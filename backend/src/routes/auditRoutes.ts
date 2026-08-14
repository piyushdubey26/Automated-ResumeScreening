import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { authenticateJWT, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', requirePermission('audit_logs.read'), AuditController.list);

export default router;
