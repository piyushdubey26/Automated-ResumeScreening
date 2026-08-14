import { Router } from 'express';
import { createJD, getJobs, matchResumeWithJD } from '../controllers/jobController';

const router = Router();

router.post('/jd', createJD);
router.get('/', getJobs);
router.post('/match', matchResumeWithJD);

export default router;
