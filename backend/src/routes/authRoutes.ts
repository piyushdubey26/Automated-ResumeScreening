import { Router } from 'express';
import {
  signup,
  login,
  getMe,
  updateProfile,
  getAllUsers,
  updateSubscription,
  getUserSubscription,
  purchaseSubscription,
  requestSubscriptionUpgrade,
  getSubscriptionRequests,
  approveSubscriptionRequest,
  rejectSubscriptionRequest,
  cancelSubscription,
  reactivateSubscription,
  logout
} from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateJWT, getMe);
router.put('/profile', authenticateJWT, updateProfile);
router.get('/users', authenticateJWT, getAllUsers);
router.put('/users/:userId/subscription', authenticateJWT, updateSubscription);

router.get('/subscription', authenticateJWT, getUserSubscription);
router.post('/subscription/purchase', authenticateJWT, purchaseSubscription);
router.post('/subscription/request', authenticateJWT, requestSubscriptionUpgrade);
router.get('/subscription/requests', authenticateJWT, getSubscriptionRequests);
router.post('/subscription/requests/:id/approve', authenticateJWT, approveSubscriptionRequest);
router.post('/subscription/requests/:id/reject', authenticateJWT, rejectSubscriptionRequest);
router.post('/subscription/cancel', authenticateJWT, cancelSubscription);
router.post('/subscription/reactivate', authenticateJWT, reactivateSubscription);

export default router;
