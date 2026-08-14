import { Router } from 'express';
import { AdmissionController } from '../controllers/admissionController';
import { authenticateJWT, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/beds', requirePermission('beds.read'), AdmissionController.listBeds);
router.post('/', requirePermission('beds.manage'), AdmissionController.admit);
router.post('/:id/discharge', requirePermission('beds.manage'), AdmissionController.discharge);

export default router;
