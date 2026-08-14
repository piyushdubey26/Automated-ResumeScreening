import { Router } from 'express';
import { QueueController } from '../controllers/queueController';
import { authenticateJWT, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', requirePermission('queue.read'), QueueController.getQueue);
router.post('/call-next', requirePermission('queue.manage'), QueueController.callNext);

export default router;
