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
router.get(['/stats', '/ai-quality/stats'], authenticateJWT, requireAdmin, getAiQualityStats);
router.post(['/run-cycle', '/ai-quality/run-cycle'], authenticateJWT, requireAdmin, triggerLearningCycle);
router.get(['/candidate-skills', '/ai-quality/candidate-skills'], authenticateJWT, requireAdmin, getCandidateSkills);
router.post(['/candidate-skills/promote', '/ai-quality/candidate-skills/promote'], authenticateJWT, requireAdmin, promoteCandidateSkill);
router.post(['/rollback', '/ai-quality/rollback'], authenticateJWT, requireAdmin, rollbackModelVersion);
router.post(['/feedback', '/ai-quality/feedback'], authenticateJWT, requireAdmin, submitHumanFeedback);

export default router;
