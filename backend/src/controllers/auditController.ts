import { Request, Response } from 'express';
import { AuditService } from '../services/auditService';

export class AuditController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId?.toString();
      const action = req.query.action?.toString();
      const entity = req.query.entity?.toString();
      const startDate = req.query.startDate?.toString();
      const endDate = req.query.endDate?.toString();

      const logs = await AuditService.getAuditLogs({ userId, action, entity, startDate, endDate });
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve system audit logs' });
    }
  }
}
