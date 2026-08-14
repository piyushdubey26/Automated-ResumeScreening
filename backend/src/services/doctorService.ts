import prisma from '../config/db';
import bcrypt from 'bcryptjs';

export class DoctorService {
  static async getDoctors(query: { departmentId?: string; status?: string }) {
    const { departmentId, status } = query;
    const whereClause: any = {};

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
    if (status) {
      whereClause.status = status;
    }

    return prisma.doctor.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
        department: true,
        availability: true,
      },
    });
  }

  static async createDoctor(
    data: {
      email: string;
      passwordPlain: string;
      firstName: string;
      lastName: string;
      departmentId: string;
      specialization: string;
      qualification: string;
      experienceYears: number;
      consultationFee: number;
      roomNumber: string;
      availability?: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        maxAppointments?: number;
      }>;
    },
    creatorUserId?: string
  ) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const doctorRole = await prisma.role.findUnique({
      where: { name: 'DOCTOR' },
    });

    if (!doctorRole) {
      throw new Error('Doctor role not defined');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordPlain, salt);

    return prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: doctorRole.id,
        },
      });

      // 2. Generate employee id
      const count = await tx.doctor.count();
      const employeeId = `DOC-${1001 + count}`;

      // 3. Create Doctor Profile
      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          employeeId,
          departmentId: data.departmentId,
          specialization: data.specialization,
          qualification: data.qualification,
          experienceYears: data.experienceYears,
          consultationFee: data.consultationFee,
          roomNumber: data.roomNumber,
        },
      });

      // 4. Create Availability
      if (data.availability && data.availability.length > 0) {
        for (const slot of data.availability) {
          await tx.doctorAvailability.create({
            data: {
              doctorId: doctor.id,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              maxAppointments: slot.maxAppointments || 12,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: creatorUserId || null,
          action: 'DOCTOR_CREATE',
          entity: 'Doctor',
          entityId: doctor.id,
          newValue: `Added doctor profile: ${employeeId}`,
        },
      });

      return doctor;
    });
  }

  static async updateDoctor(
    id: string,
    data: Partial<{
      specialization: string;
      qualification: string;
      experienceYears: number;
      consultationFee: number;
      roomNumber: string;
      status: string;
    }>,
    updaterUserId?: string
  ) {
    const previous = await prisma.doctor.findUnique({ where: { id } });
    if (!previous) {
      throw new Error('Doctor profile not found');
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: updaterUserId || null,
        action: 'DOCTOR_UPDATE',
        entity: 'Doctor',
        entityId: id,
        previousValue: JSON.stringify(previous),
        newValue: JSON.stringify(doctor),
      },
    });

    return doctor;
  }

  static async getDoctorDashboardStats(doctorId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Today's Appointments
    const appointmentsToday = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        patient: true,
        queueItem: true,
      },
      orderBy: { timeSlot: 'asc' },
    });

    // Counts
    const waitingPatients = appointmentsToday.filter((a) => a.status === 'WAITING' || a.status === 'CHECKED_IN');
    const completedConsultations = appointmentsToday.filter((a) => a.status === 'COMPLETED');
    const activeConsultation = appointmentsToday.find((a) => a.status === 'IN_CONSULTATION');

    // Total Patients treated (historical)
    const totalPatientsCount = await prisma.medicalRecord.count({
      where: { doctorId },
    });

    return {
      appointmentsToday,
      waitingCount: waitingPatients.length,
      completedCount: completedConsultations.length,
      activeConsultation: activeConsultation || null,
      totalPatientsCount,
    };
  }

  static async getDepartments() {
    return prisma.department.findMany({
      where: { status: 'ACTIVE' },
    });
  }
}
