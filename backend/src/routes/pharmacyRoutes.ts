import { Router } from 'express';
import { PharmacyController } from '../controllers/pharmacyController';
import { authenticateJWT, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/medicines', requirePermission('pharmacy.read'), PharmacyController.listMedicines);
router.get('/alerts', requirePermission('pharmacy.manage'), PharmacyController.getAlerts);
router.post('/dispense', requirePermission('pharmacy.manage'), PharmacyController.dispense);

export default router;
