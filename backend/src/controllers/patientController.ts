import { Request, Response } from 'express';
import { z } from 'zod';
import { PatientService } from '../services/patientService';

const createPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(5),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date of birth format',
  }),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContactName: z.string().min(1),
  emergencyContactPhone: z.string().min(5),
  address: z.string().optional(),
  medicalHistory: z.string().optional(),
  currentMedications: z.string().optional(),
});

const updatePatientSchema = createPatientSchema.partial();

export class PatientController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search?.toString();
      const gender = req.query.gender?.toString();
      const bloodGroup = req.query.bloodGroup?.toString();

      const patients = await PatientService.getPatients({ search, gender, bloodGroup });
      res.json(patients);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to list patients' });
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      
      // Enforce self-access limit for Patient role
      if (req.user?.role === 'PATIENT') {
        const patientRecord = await prisma.patient.findUnique({
          where: { id },
          select: { userId: true },
        });
        if (!patientRecord || patientRecord.userId !== req.user.userId) {
          res.status(403).json({ error: 'Access denied: You are only permitted to view your own patient profile' });
          return;
        }
      }

      const profile = await PatientService.getPatientProfile(id);
      res.json(profile);
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(404).json({ error: error.message || 'Patient profile not found' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createPatientSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const patient = await PatientService.createPatient({
        ...parsed.data,
        email: parsed.data.email || undefined,
        creatorUserId: req.user?.userId,
      });

      res.status(201).json(patient);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create patient profile' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      
      // Enforce self-update limit for Patient role
      if (req.user?.role === 'PATIENT') {
        const patientRecord = await prisma.patient.findUnique({
          where: { id },
          select: { userId: true },
        });
        if (!patientRecord || patientRecord.userId !== req.user.userId) {
          res.status(403).json({ error: 'Access denied: You are only permitted to update your own patient profile' });
          return;
        }
      }

      const parsed = updatePatientSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const patient = await PatientService.updatePatient(id, parsed.data, req.user?.userId);
      res.json(patient);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update patient profile' });
    }
  }
}
import prisma from '../config/db';
