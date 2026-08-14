import { Router } from 'express';
import { PatientController } from '../controllers/patientController';
import { authenticateJWT, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', requirePermission('patients.read'), PatientController.list);
router.get('/:id', PatientController.getProfile); // Checks self permission inside controller
router.post('/', requirePermission('patients.create'), PatientController.create);
router.put('/:id', PatientController.update); // Checks self permission inside controller

export default router;
