import { Request, Response } from 'express';
import { z } from 'zod';
import { AdmissionService } from '../services/admissionService';

const admitSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  bedId: z.string().uuid(),
  admissionReason: z.string().min(3),
});

const dischargeSchema = z.object({
  dischargeSummary: z.string().min(5),
  dischargeInstructions: z.string().min(5),
});

export class AdmissionController {
  static async listBeds(req: Request, res: Response): Promise<void> {
    try {
      const beds = await AdmissionService.getBeds();
      res.json(beds);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve beds list' });
    }
  }

  static async admit(req: Request, res: Response): Promise<void> {
    try {
      const parsed = admitSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const admission = await AdmissionService.admitPatient(parsed.data, req.user?.userId || '');
      res.status(201).json(admission);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Admission failed' });
    }
  }

  static async discharge(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const parsed = dischargeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const admission = await AdmissionService.dischargePatient(id, parsed.data, req.user?.userId || '');
      res.json({ message: 'Patient successfully discharged', admission });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Discharge failed' });
    }
  }
}
