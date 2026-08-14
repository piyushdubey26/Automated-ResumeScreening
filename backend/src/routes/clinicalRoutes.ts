import { Router } from 'express';
import { ClinicalController } from '../controllers/clinicalController';
import { authenticateJWT, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.post('/medical-records', requirePermission('medical_records.write'), ClinicalController.createRecord);
router.get('/labs/orders', ClinicalController.listLabOrders); // Inner checks handle permissions
router.put('/labs/orders/:id/result', requirePermission('lab_results.write'), ClinicalController.updateLabResult);
router.put('/labs/results/:resultId/verify', requirePermission('lab_orders.manage'), ClinicalController.verifyLabResult); // Only verifier doctors/admins
router.get('/prescriptions/:id', ClinicalController.getPrescription);

export default router;
