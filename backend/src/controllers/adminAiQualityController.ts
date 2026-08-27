import { Request, Response } from 'express';
import { ContinuousLearningEngine, DriftDetector } from '../services/continuousLearning';

export const getAiQualityStats = (req: Request, res: Response) => {
  const stats = ContinuousLearningEngine.getDashboardStats();
  return res.json({ success: true, stats });
};

export const triggerLearningCycle = (req: Request, res: Response) => {
  const minRequired = req.body?.minRequiredNewCandidates || 2;
  const log = ContinuousLearningEngine.runDailyLearningCycle(minRequired);
  return res.json({ success: true, log });
};

export const getCandidateSkills = (req: Request, res: Response) => {
  const skills = DriftDetector.getCandidateSkills();
  return res.json({ success: true, candidateSkills: skills });
};

export const promoteCandidateSkill = (req: Request, res: Response) => {
  const { term } = req.body;
  if (!term) {
    return res.status(400).json({ error: 'Term parameter is required' });
  }
  const success = DriftDetector.promoteCandidateSkill(term);
  if (!success) {
    return res.status(404).json({ error: `Term ${term} not found in candidate skills queue` });
  }
  return res.json({ success: true, message: `Term ${term} promoted to production skill catalog` });
};

export const rollbackModelVersion = (req: Request, res: Response) => {
  const { version } = req.body;
  if (!version) {
    return res.status(400).json({ error: 'Version parameter is required' });
  }
  const result = ContinuousLearningEngine.rollbackToVersion(version);
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
};

export const submitHumanFeedback = (req: Request, res: Response) => {
  const { analysisId, status, notes, rating } = req.body;
  if (!analysisId || !status) {
    return res.status(400).json({ error: 'analysisId and status are required' });
  }

  const success = ContinuousLearningEngine.attachHumanLabel(analysisId, {
    status,
    verifiedBy: req.user?.userId || 'admin',
    verifiedAt: new Date().toISOString(),
    notes
  });

  return res.json({ success, message: success ? 'Human label recorded' : 'Analysis record not found' });
};
