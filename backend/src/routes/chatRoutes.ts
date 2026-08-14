import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/conversations', ChatController.listConversations);
router.get('/conversations/:id/messages', ChatController.getMessages);
router.post('/conversations', ChatController.createChat);
router.post('/conversations/:id/messages', ChatController.send);

export default router;
