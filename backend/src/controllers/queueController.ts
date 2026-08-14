import { Request, Response } from 'express';
import { QueueService } from '../services/queueService';
import prisma from '../config/db';

export class QueueController {
  static async getQueue(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.query.doctorId?.toString();
      const queue = await QueueService.getActiveQueue(doctorId);
      res.json(queue);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch active queue' });
    }
  }

  static async callNext(req: Request, res: Response): Promise<void> {
    try {
      let doctorId = req.body.doctorId;

      // If user is a Doctor, resolve their profile ID automatically
      if (req.user?.role === 'DOCTOR') {
        const doctorProfile = await prisma.doctor.findUnique({
          where: { userId: req.user.userId },
        });
        if (!doctorProfile) {
          res.status(404).json({ error: 'Doctor profile not found for logged in user' });
          return;
        }
        doctorId = doctorProfile.id;
      }

      if (!doctorId) {
        res.status(400).json({ error: 'Doctor ID is required to call next patient' });
        return;
      }

      const result = await QueueService.callNext(doctorId, req.user?.userId || '');
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to call next patient' });
    }
  }
}
