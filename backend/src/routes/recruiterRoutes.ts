import { Router } from 'express';
import {
  bulkScreenResumes,
  getRecruiterShortlist,
  updateCandidateStatus
} from '../controllers/recruiterController';

const router = Router();

router.post('/bulk-screen', bulkScreenResumes);
router.get('/shortlist/:jdId', getRecruiterShortlist);
router.patch('/candidate/:id/status', updateCandidateStatus);

export default router;
