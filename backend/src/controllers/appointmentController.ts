import { Request, Response } from 'express';
import { z } from 'zod';
import { AppointmentService } from '../services/appointmentService';

const bookAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  departmentId: z.string().uuid(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  timeSlot: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'HH:MM'),
  type: z.enum(['OUTPATIENT', 'INPATIENT', 'FOLLOWUP']),
  reason: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  notes: z.string().optional(),
});

export class AppointmentController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.query.doctorId?.toString();
      const patientId = req.query.patientId?.toString();
      const departmentId = req.query.departmentId?.toString();
      const date = req.query.date?.toString();
      const status = req.query.status?.toString();

      // For Patient role, enforce patient filter on self only
      if (req.user?.role === 'PATIENT') {
        const patientProfile = await prisma.patient.findUnique({
          where: { userId: req.user.userId },
        });
        if (!patientProfile) {
          res.status(404).json({ error: 'Patient profile not found' });
          return;
        }
        const appointments = await AppointmentService.getAppointments({
          patientId: patientProfile.id,
          date,
          status,
        });
        res.json(appointments);
        return;
      }

      // For Doctor role, enforce doctor filter on self only
      if (req.user?.role === 'DOCTOR') {
        const doctorProfile = await prisma.doctor.findUnique({
          where: { userId: req.user.userId },
        });
        if (!doctorProfile) {
          res.status(404).json({ error: 'Doctor profile not found' });
          return;
        }
        const appointments = await AppointmentService.getAppointments({
          doctorId: doctorProfile.id,
          patientId,
          departmentId,
          date,
          status,
        });
        res.json(appointments);
        return;
      }

      const appointments = await AppointmentService.getAppointments({
        doctorId,
        patientId,
        departmentId,
        date,
        status,
      });
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to list appointments' });
    }
  }

  static async book(req: Request, res: Response): Promise<void> {
    try {
      const parsed = bookAppointmentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      // If user is a Patient, enforce scheduling as self only
      if (req.user?.role === 'PATIENT') {
        const patientProfile = await prisma.patient.findUnique({
          where: { userId: req.user.userId },
        });
        if (!patientProfile || patientProfile.id !== parsed.data.patientId) {
          res.status(403).json({ error: 'Access denied: You are only permitted to schedule appointments for yourself' });
          return;
        }
      }

      const appt = await AppointmentService.bookAppointment(parsed.data, req.user?.userId);
      res.status(201).json(appt);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to book appointment' });
    }
  }

  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const parsed = updateStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: { patient: true },
      });

      if (!appointment) {
        res.status(404).json({ error: 'Appointment not found' });
        return;
      }

      // If user is a Patient, restrict cancelling/rescheduling other records
      if (req.user?.role === 'PATIENT' && appointment.patient.userId !== req.user.userId) {
        res.status(403).json({ error: 'Access denied: You are only permitted to edit your own appointments' });
        return;
      }

      const updated = await AppointmentService.updateAppointmentStatus(
        id,
        parsed.data.status,
        parsed.data.notes,
        req.user?.userId
      );
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update appointment status' });
    }
  }
}
import prisma from '../config/db';
