import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';

export class DashboardController {
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await DashboardService.getAdminDashboardStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Failed to compile dashboard stats:', error);
      res.status(500).json({ error: 'Failed to retrieve hospital analytics data' });
    }
  }
}
