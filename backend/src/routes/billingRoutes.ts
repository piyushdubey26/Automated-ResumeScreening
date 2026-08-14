import { Router } from 'express';
import { BillingController } from '../controllers/billingController';
import { authenticateJWT, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/invoices', requirePermission('billing.read'), BillingController.listInvoices);
router.post('/invoices', requirePermission('billing.manage'), BillingController.create);
router.post('/invoices/:id/pay', requirePermission('billing.manage'), BillingController.pay); // checks inner ownership if patient

export default router;
