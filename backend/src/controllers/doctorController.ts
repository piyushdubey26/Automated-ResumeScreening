import { Request, Response } from 'express';
import { z } from 'zod';
import { DoctorService } from '../services/doctorService';

const createDoctorSchema = z.object({
  email: z.string().email(),
  passwordPlain: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  departmentId: z.string().uuid(),
  specialization: z.string().min(1),
  qualification: z.string().min(1),
  experienceYears: z.number().int().min(0),
  consultationFee: z.number().min(0),
  roomNumber: z.string().min(1),
  availability: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'HH:MM'),
        endTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'HH:MM'),
        maxAppointments: z.number().int().optional(),
      })
    )
    .optional(),
});

const updateDoctorSchema = z.object({
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  experienceYears: z.number().int().optional(),
  consultationFee: z.number().optional(),
  roomNumber: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export class DoctorController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const departmentId = req.query.departmentId?.toString();
      const status = req.query.status?.toString();

      const doctors = await DoctorService.getDoctors({ departmentId, status });
      res.json(doctors);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to list doctors' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createDoctorSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const doctor = await DoctorService.createDoctor(parsed.data, req.user?.userId);
      res.status(201).json(doctor);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create doctor profile' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const parsed = updateDoctorSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const doctor = await DoctorService.updateDoctor(id, parsed.data, req.user?.userId);
      res.json(doctor);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update doctor profile' });
    }
  }

  static async dashboardStats(req: Request, res: Response): Promise<void> {
    try {
      let doctorId = req.params.id as string;

      // If user is a Doctor, enforce self dashboard stats access
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
        res.status(400).json({ error: 'Doctor ID is required' });
        return;
      }

      const stats = await DoctorService.getDoctorDashboardStats(doctorId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to retrieve stats' });
    }
  }

  static async departments(req: Request, res: Response): Promise<void> {
    try {
      const departments = await DoctorService.getDepartments();
      res.json(departments);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve departments' });
    }
  }
}
import prisma from '../config/db';
