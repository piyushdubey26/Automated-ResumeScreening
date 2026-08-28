import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        email?: string;
      };
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  const authHeader = req.headers.authorization || (req.headers['authorization'] as string) || (req.headers['Authorization'] as string);
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && (req.cookies.access_token || req.cookies.token)) {
    token = req.cookies.access_token || req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication token missing or invalid' });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email ? decoded.email.trim().toLowerCase() : undefined
    };
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Unauthorized: Access token has expired or is invalid' });
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

    const { findUserByIdOrEmail } = require('../utils/mockDb');

    const user = findUserByIdOrEmail(req.user?.userId, (req.user as any)?.email);
    if (!user) {
      res.status(404).json({ error: 'User account not found' });
      return;
    }

    // Admin users bypass plan restrictions
    if (user.userType === 'admin' || user.email === 'admin@resumeai.com' || user.email === 'piyushdubey447@gmail.com') {
      next();
      return;
    }

    const plan = user.plan || 'free';
    const isPro = plan === 'pro' || plan === 'job_seeker_pro';
    const isCareerMax = plan === 'career-max';

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
