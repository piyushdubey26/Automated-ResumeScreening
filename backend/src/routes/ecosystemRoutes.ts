import { Router } from 'express';
import {
  getLeaderboard,
  analyzePortfolio,
  getLearningRecommendations
} from '../controllers/ecosystemController';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.post('/portfolio-analyze', analyzePortfolio);
router.post('/learning-recommendations', getLearningRecommendations);

export default router;
