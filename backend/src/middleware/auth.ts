import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication token missing or invalid' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Access token has expired or is invalid' });
  }
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    next();
  };
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
      return;
    }

    next();
  };
};

export const requirePlan = (requiredPlan: 'pro' | 'career-max') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { mockDb } = require('../utils/mockDb');
    const { getActiveSubscription } = require('../utils/auth');

    const user = mockDb.users.find((u: any) => u.id === req.user?.userId);
    if (!user) {
      res.status(404).json({ error: 'User account not found' });
      return;
    }

    // Admin users bypass plan restrictions
    if (user.userType === 'admin' || user.email === 'admin@resumeai.com' || user.email === 'piyushdubey447@gmail.com') {
      next();
      return;
    }

    const activeSub = getActiveSubscription(user.id);
    const hasActiveSub = !!activeSub && activeSub.status === 'active';
    const isApprovedStatus = user.subscriptionStatus === 'approved' || user.subscriptionStatus === 'active' || hasActiveSub;

    const isPro = (user.plan === 'pro' || user.plan === 'job_seeker_pro' || (activeSub && (activeSub.planId === 'pro' || activeSub.planId === 'job_seeker_pro'))) && isApprovedStatus;
    const isCareerMax = (user.plan === 'career-max' || (activeSub && activeSub.planId === 'career-max')) && isApprovedStatus;

    if (requiredPlan === 'pro') {
      if (!isPro && !isCareerMax) {
        res.status(403).json({
          error: 'Forbidden: Upgrade to Job Seeker Pro ($12) or Career Max ($49) to access this feature.',
          code: 'PLAN_UPGRADE_REQUIRED',
          requiredPlan: 'Job Seeker Pro'
        });
        return;
      }
    } else if (requiredPlan === 'career-max') {
      if (!isCareerMax) {
        res.status(403).json({
          error: 'Forbidden: Upgrade to Career Max ($49) to access this feature.',
          code: 'PLAN_UPGRADE_REQUIRED',
          requiredPlan: 'Career Max'
        });
        return;
      }
    }

    next();
  };
};
