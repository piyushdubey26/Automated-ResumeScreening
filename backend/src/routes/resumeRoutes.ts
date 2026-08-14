import { Router } from 'express';
import {
  uploadAndParseResume,
  getResumeById,
  getResumeFeedback,
  rewriteBullet,
  generateMockInterview
} from '../controllers/resumeController';

const router = Router();

router.post('/upload', uploadAndParseResume);
router.post('/rewrite', rewriteBullet);
router.post('/mock-interview', generateMockInterview);
router.get('/:id', getResumeById);
router.get('/:id/feedback', getResumeFeedback);

export default router;
