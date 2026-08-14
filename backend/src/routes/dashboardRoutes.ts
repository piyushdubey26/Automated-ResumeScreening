import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/stats', requireRole(['SUPER_ADMIN']), DashboardController.getStats);

export default router;
