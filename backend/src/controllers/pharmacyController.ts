import { Request, Response } from 'express';
import { z } from 'zod';
import { InventoryService } from '../services/inventoryService';

const dispenseSchema = z.object({
  prescriptionId: z.string().uuid(),
});

export class PharmacyController {
  static async listMedicines(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search?.toString();
      const category = req.query.category?.toString();

      const medicines = await InventoryService.getMedicines({ search, category });
      res.json(medicines);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve medicine inventory' });
    }
  }

  static async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await InventoryService.getInventoryAlerts();
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve inventory warnings' });
    }
  }

  static async dispense(req: Request, res: Response): Promise<void> {
    try {
      const parsed = dispenseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const prescription = await InventoryService.dispensePrescription(
        parsed.data.prescriptionId,
        req.user?.userId || ''
      );
      res.json({ message: 'Prescription successfully dispensed', prescription });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Dispensing failed' });
    }
  }
}
