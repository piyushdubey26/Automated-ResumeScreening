import { Request, Response } from 'express';
import { z } from 'zod';
import { ClinicalService } from '../services/clinicalService';
import prisma from '../config/db';

const createRecordSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid().optional(), // Can resolve self if doctor
  appointmentId: z.string().uuid().optional(),
  type: z.enum(['CONSULTATION', 'ADMISSION', 'EMERGENCY']),
  summary: z.string().optional(),
  clinicalNotes: z.string().optional(),
  symptoms: z.string().optional(),
  vitals: z
    .object({
      bloodPressure: z.string(),
      heartRate: z.number().int(),
      temperature: z.number(),
      spo2: z.number().int(),
      respiratoryRate: z.number().int(),
      weight: z.number(),
    })
    .optional(),
  diagnoses: z
    .array(
      z.object({
        code: z.string().optional(),
        description: z.string(),
        type: z.enum(['PRIMARY', 'SECONDARY']).optional(),
      })
    )
    .optional(),
  prescriptionItems: z
    .array(
      z.object({
        medicineId: z.string().uuid(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
        instructions: z.string().optional(),
      })
    )
    .optional(),
  labOrders: z
    .array(
      z.object({
        testType: z.string(),
        notes: z.string().optional(),
      })
    )
    .optional(),
});

const updateLabResultSchema = z.object({
  testType: z.string(),
  resultValue: z.string(), // stringified json or single value
  unit: z.string(),
  referenceRange: z.string(),
  notes: z.string().optional(),
  status: z.enum(['SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED']),
});

export class ClinicalController {
  static async createRecord(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createRecordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      let doctorId = parsed.data.doctorId;
      if (req.user?.role === 'DOCTOR') {
        const doc = await prisma.doctor.findUnique({ where: { userId: req.user.userId } });
        if (!doc) {
          res.status(404).json({ error: 'Doctor profile not found' });
          return;
        }
        doctorId = doc.id;
      }

      if (!doctorId) {
        res.status(400).json({ error: 'Doctor ID is required' });
        return;
      }

      const record = await ClinicalService.createMedicalRecord(
        {
          ...parsed.data,
          doctorId,
        },
        req.user?.userId || ''
      );

      res.status(201).json(record);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to record consultation' });
    }
  }

  static async listLabOrders(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.query.doctorId?.toString();
      const patientId = req.query.patientId?.toString();
      const status = req.query.status?.toString();

      // Enforce patient filter limit on Patient role
      if (req.user?.role === 'PATIENT') {
        const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
        if (!patient) {
          res.status(404).json({ error: 'Patient profile not found' });
          return;
        }
        const orders = await ClinicalService.getLabOrders({ patientId: patient.id, status });
        res.json(orders);
        return;
      }

      const orders = await ClinicalService.getLabOrders({ doctorId, patientId, status });
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve lab orders' });
    }
  }

  static async updateLabResult(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const parsed = updateLabResultSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const result = await ClinicalService.updateLabResult(
        id,
        parsed.data,
        req.user?.userId || ''
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update lab results' });
    }
  }

  static async verifyLabResult(req: Request, res: Response): Promise<void> {
    try {
      const resultId = req.params.resultId as string;
      const result = await ClinicalService.verifyLabResult(resultId, req.user?.userId || '');
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to verify lab result' });
    }
  }

  static async getPrescription(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const prescription = await prisma.prescription.findUnique({
        where: { id },
        include: {
          patient: true,
          doctor: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              department: true,
            },
          },
          items: {
            include: {
              medicine: true,
            },
          },
        },
      });

      if (!prescription) {
        res.status(404).json({ error: 'Prescription not found' });
        return;
      }

      // Enforce self-access limit for Patient role
      if (req.user?.role === 'PATIENT' && prescription.patient.userId !== req.user.userId) {
        res.status(403).json({ error: 'Access denied: You are only permitted to view your own prescriptions' });
        return;
      }

      res.json(prescription);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve prescription' });
    }
  }
}
