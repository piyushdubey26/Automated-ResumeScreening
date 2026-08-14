import { Router } from 'express';
import { AppointmentController } from '../controllers/appointmentController';
import { authenticateJWT, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', AppointmentController.list); // internal filters handle permissions
router.post('/', requirePermission('appointments.create'), AppointmentController.book);
router.put('/:id/status', requirePermission('appointments.update'), AppointmentController.updateStatus);

export default router;
