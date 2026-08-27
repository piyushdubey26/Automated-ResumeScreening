import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import {
  getAiQualityStats,
  triggerLearningCycle,
  getCandidateSkills,
  promoteCandidateSkill,
  rollbackModelVersion,
  submitHumanFeedback
} from '../controllers/adminAiQualityController';

const router = Router();
const requireAdmin = requireRole(['admin']);

// All continuous learning control routes require Admin authentication
router.get('/stats', authenticateJWT, requireAdmin, getAiQualityStats);
router.post('/run-cycle', authenticateJWT, requireAdmin, triggerLearningCycle);
router.get('/candidate-skills', authenticateJWT, requireAdmin, getCandidateSkills);
router.post('/candidate-skills/promote', authenticateJWT, requireAdmin, promoteCandidateSkill);
router.post('/rollback', authenticateJWT, requireAdmin, rollbackModelVersion);
router.post('/feedback', authenticateJWT, requireAdmin, submitHumanFeedback);

export default router;
