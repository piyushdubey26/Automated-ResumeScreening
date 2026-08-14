import { Router } from 'express';
import { DoctorController } from '../controllers/doctorController';
import { authenticateJWT, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', DoctorController.list);
router.post('/', requirePermission('users.manage'), DoctorController.create);
router.put('/:id', requirePermission('users.manage'), DoctorController.update);
router.get('/departments', DoctorController.departments);
router.get('/:id/dashboard-stats', DoctorController.dashboardStats);
router.get('/me/dashboard-stats', DoctorController.dashboardStats); // Self resolve

export default router;
