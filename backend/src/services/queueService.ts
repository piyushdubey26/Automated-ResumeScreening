import prisma from '../config/db';
import { io } from '../server';

export class QueueService {
  static async getActiveQueue(doctorId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const whereClause: any = {
      appointment: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    };

    if (doctorId) {
      whereClause.appointment.doctorId = doctorId;
    }

    return prisma.queueItem.findMany({
      where: whereClause,
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
            department: true,
          },
        },
      },
      orderBy: { queuePosition: 'asc' },
    });
  }

  static async callNext(doctorId: string, changerUserId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return prisma.$transaction(async (tx) => {
      // 1. Find all active queue items for this doctor today
      const activeQueue = await tx.queueItem.findMany({
        where: {
          appointment: {
            doctorId,
            date: {
              gte: today,
              lt: tomorrow,
            },
          },
          status: { in: ['WAITING', 'CALLING', 'IN_CONSULTATION'] },
        },
        orderBy: { queuePosition: 'asc' },
      });

      if (activeQueue.length === 0) {
        throw new Error('No patients waiting in queue for this doctor today');
      }

      // 2. If there is a patient currently in consultation, mark them as completed
      const currentConsultation = activeQueue.find((q) => q.status === 'IN_CONSULTATION' || q.status === 'CALLING');
      if (currentConsultation) {
        await tx.queueItem.update({
          where: { id: currentConsultation.id },
          data: { status: 'COMPLETED', queuePosition: 0 },
        });

        await tx.appointment.update({
          where: { id: currentConsultation.appointmentId },
          data: { status: 'COMPLETED' },
        });

        await tx.appointmentStatusHistory.create({
          data: {
            appointmentId: currentConsultation.appointmentId,
            status: 'COMPLETED',
            changedById: changerUserId,
            notes: 'Completed in consultation via Queue call next',
          },
        });
      }

      // 3. Find next waiting patient
      const nextInQueue = activeQueue.find((q) => q.status === 'WAITING' && q.id !== currentConsultation?.id);
      if (!nextInQueue) {
        // No more patients waiting
        io.emit('queue_update', { message: 'Queue updated' });
        return { message: 'All consultations completed. No more patients waiting.' };
      }

      // 4. Update next patient to CALLING/IN_CONSULTATION
      const updatedNext = await tx.queueItem.update({
        where: { id: nextInQueue.id },
        data: { status: 'IN_CONSULTATION', estimatedWaitingTimeMinutes: 0 },
      });

      await tx.appointment.update({
        where: { id: nextInQueue.appointmentId },
        data: { status: 'IN_CONSULTATION' },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: nextInQueue.appointmentId,
          status: 'IN_CONSULTATION',
          changedById: changerUserId,
          notes: 'Doctor called patient into consultation',
        },
      });

      // 5. Recalculate estimated waiting times for all remaining waiting patients
      const remainingWaiting = activeQueue.filter((q) => q.status === 'WAITING' && q.id !== nextInQueue.id);
      for (let i = 0; i < remainingWaiting.length; i++) {
        const item = remainingWaiting[i];
        await tx.queueItem.update({
          where: { id: item.id },
          data: {
            queuePosition: i + 1,
            estimatedWaitingTimeMinutes: (i + 1) * 20,
          },
        });
      }

      // Trigger Socket event for real-time screens
      io.emit('queue_update', { message: 'Queue updated', calledPatient: updatedNext });

      return {
        message: 'Called next patient',
        queueItem: updatedNext,
      };
    });
  }
}
