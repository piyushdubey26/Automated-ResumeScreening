import { Router } from 'express';
import {
  getLeaderboard,
  analyzePortfolio,
  getLearningRecommendations
} from '../controllers/ecosystemController';
import { authenticateJWT, requirePlan } from '../middleware/auth';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.post('/portfolio-analyze', authenticateJWT, requirePlan('career-max'), analyzePortfolio);
router.post('/learning-recommendations', getLearningRecommendations);

export default router;
