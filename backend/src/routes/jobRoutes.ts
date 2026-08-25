import { Router } from 'express';
import { createJD, getJobs, matchResumeWithJD, getLatestMatch } from '../controllers/jobController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/jd', authenticateJWT, createJD);
router.get('/', getJobs);
router.post('/match', authenticateJWT, matchResumeWithJD);
router.get('/latest-match', authenticateJWT, getLatestMatch);

export default router;
