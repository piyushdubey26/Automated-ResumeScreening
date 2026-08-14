import prisma from '../config/db';
import { io } from '../server';

export class AppointmentService {
  static async getAppointments(query: {
    doctorId?: string;
    patientId?: string;
    departmentId?: string;
    date?: string;
    status?: string;
  }) {
    const { doctorId, patientId, departmentId, date, status } = query;
    const whereClause: any = {};

    if (doctorId) whereClause.doctorId = doctorId;
    if (patientId) whereClause.patientId = patientId;
    if (departmentId) whereClause.departmentId = departmentId;
    if (status) whereClause.status = status;

    if (date) {
      const parsedDate = new Date(date);
      parsedDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(parsedDate);
      nextDay.setDate(parsedDate.getDate() + 1);

      whereClause.date = {
        gte: parsedDate,
        lt: nextDay,
      };
    }

    return prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        department: true,
        queueItem: true,
      },
      orderBy: { timeSlot: 'asc' },
    });
  }

  static async bookAppointment(
    data: {
      patientId: string;
      doctorId: string;
      departmentId: string;
      date: string;
      timeSlot: string;
      type: string;
      reason?: string;
    },
    creatorUserId?: string
  ) {
    const apptDate = new Date(data.date);
    apptDate.setHours(0, 0, 0, 0);

    // Double-booking check using the database unique constraint
    const existing = await prisma.appointment.findUnique({
      where: {
        doctorId_date_timeSlot: {
          doctorId: data.doctorId,
          date: apptDate,
          timeSlot: data.timeSlot,
        },
      },
    });

    if (existing && existing.status !== 'CANCELLED') {
      throw new Error('This time slot is already booked for this doctor');
    }

    const appt = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        departmentId: data.departmentId,
        date: apptDate,
        timeSlot: data.timeSlot,
        type: data.type,
        status: 'SCHEDULED',
        reason: data.reason,
      },
    });

    // Create History Log
    await prisma.appointmentStatusHistory.create({
      data: {
        appointmentId: appt.id,
        status: 'SCHEDULED',
        changedById: creatorUserId || appt.patientId, // Patient self or Receptionist
        notes: 'Appointment booked',
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: creatorUserId || null,
        action: 'APPOINTMENT_CREATE',
        entity: 'Appointment',
        entityId: appt.id,
        newValue: `Booked appointment for patient ${data.patientId} on ${data.date} at ${data.timeSlot}`,
      },
    });

    return appt;
  }

  static async updateAppointmentStatus(
    id: string,
    status: string,
    notes?: string,
    changerUserId?: string
  ) {
    const previous = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!previous) {
      throw new Error('Appointment not found');
    }

    const updatedAppt = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id },
        data: { status },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: id,
          status,
          changedById: changerUserId || previous.patient.userId || '',
          notes: notes || `Status updated to ${status}`,
        },
      });

      // Handle Check-in Queue generation (CHECKED_IN / WAITING status)
      if (status === 'CHECKED_IN') {
        // Calculate token number (total count today + 1)
        const startOfDay = new Date(appt.date);
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(startOfDay.getDate() + 1);

        const countToday = await tx.queueItem.count({
          where: {
            appointment: {
              doctorId: appt.doctorId,
              date: {
                gte: startOfDay,
                lt: endOfDay,
              },
            },
          },
        });

        const tokenNumber = countToday + 101;
        const queuePosition = countToday + 1;
        const estimatedWaitingTimeMinutes = queuePosition * 20;

        await tx.queueItem.create({
          data: {
            appointmentId: id,
            tokenNumber,
            queuePosition,
            status: 'WAITING',
            estimatedWaitingTimeMinutes,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: changerUserId || null,
          action: 'APPOINTMENT_STATUS_CHANGE',
          entity: 'Appointment',
          entityId: id,
          previousValue: previous.status,
          newValue: status,
        },
      });

      return appt;
    });

    // Notify clients real-time if queue has changed
    if (status === 'CHECKED_IN' || status === 'COMPLETED' || status === 'CANCELLED') {
      io.to('role:RECEPTIONIST').emit('queue_update', { message: 'Queue updated' });
      io.to('role:DOCTOR').emit('queue_update', { message: 'Queue updated' });
      io.to('role:PATIENT').emit('queue_update', { message: 'Queue updated' });
    }

    return updatedAppt;
  }
}
