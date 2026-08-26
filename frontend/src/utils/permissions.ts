import type { User } from '../types';

export type FeatureKey =
  | 'resume.basicReview'
  | 'resume.unlimitedReviews'
  | 'resume.jdMatch'
  | 'ai.bulletRewriter'
  | 'ai.mockInterview'
  | 'portfolio.analysis'
  | 'candidate.applications'
  | 'candidate.leaderboard'
  | 'candidate.profile'
  | 'recruiter.hub'
  | 'recruiter.candidateUpload'
  | 'recruiter.screening'
  | 'admin.dashboard';

export interface AccessCheckResult {
  allowed: boolean;
  reason?: 'unauthenticated' | 'wrong_role' | 'upgrade_required' | 'limit_reached';
  requiredPlan?: string;
  requiredRole?: 'seeker' | 'recruiter' | 'admin';
  limit?: number;
  currentUsage?: number;
}

export interface FeatureGateInfo {
  featureKey: FeatureKey;
  title: string;
  description: string;
  requiredPlanName: string;
  badgeText: string;
}

export const FEATURE_GATE_INFO: Record<FeatureKey, FeatureGateInfo> = {
  'resume.basicReview': {
    featureKey: 'resume.basicReview',
    title: 'Basic Resume Review',
    description: 'Score your resume against basic SDE & Data Science role rubrics.',
    requiredPlanName: 'Free',
    badgeText: 'FREE FEATURE'
  },
  'resume.unlimitedReviews': {
    featureKey: 'resume.unlimitedReviews',
    title: 'Unlimited Monthly Resume Reviews',
    description: 'Free accounts are limited to 5 resume reviews per month. Upgrade to Pro for unlimited reviews.',
    requiredPlanName: 'Job Seeker Pro',
    badgeText: '✦ PRO FEATURE'
  },
  'resume.jdMatch': {
    featureKey: 'resume.jdMatch',
    title: 'Advanced JD Match & Skills Gap Analysis',
    description: 'Compare your resume against any custom job description with AI keyword overlap scoring.',
    requiredPlanName: 'Job Seeker Pro ($12)',
    badgeText: '✦ PRO FEATURE ($12/MO)'
  },
  'ai.bulletRewriter': {
    featureKey: 'ai.bulletRewriter',
    title: 'AI Resume Bullet Enhancer',
    description: 'Transform weak bullet points into high-impact, quantified statements tailored for ATS.',
    requiredPlanName: 'Job Seeker Pro ($12)',
    badgeText: '✦ PRO FEATURE ($12/MO)'
  },
  'ai.mockInterview': {
    featureKey: 'ai.mockInterview',
    title: 'AI Mock Interview Generator',
    description: 'Generate customized technical and behavioral interview questions based on your resume and target JD.',
    requiredPlanName: 'Job Seeker Pro ($12)',
    badgeText: '✦ PRO FEATURE ($12/MO)'
  },
  'portfolio.analysis': {
    featureKey: 'portfolio.analysis',
    title: 'Portfolio & Public GitHub Signal Analysis',
    description: 'Validate public repositories, code commits, and project metrics automatically.',
    requiredPlanName: 'Career Max ($49)',
    badgeText: '✦ CAREER MAX FEATURE ($49/MO)'
  },
  'candidate.applications': {
    featureKey: 'candidate.applications',
    title: 'Applications Tracker',
    description: 'Track and manage your job applications across recruiters and companies.',
    requiredPlanName: 'Free',
    badgeText: 'FREE FEATURE'
  },
  'candidate.leaderboard': {
    featureKey: 'candidate.leaderboard',
    title: 'Leaderboard & Badges',
    description: 'Earn points and badges by improving your resume and mastering interview topics.',
    requiredPlanName: 'Free',
    badgeText: 'FREE FEATURE'
  },
  'candidate.profile': {
    featureKey: 'candidate.profile',
    title: 'Profile Settings & Links',
    description: 'Manage your GitHub, LinkedIn, and personal portfolio links.',
    requiredPlanName: 'Free',
    badgeText: 'FREE FEATURE'
  },
  'recruiter.hub': {
    featureKey: 'recruiter.hub',
    title: 'Recruiter Hub & Screening Ecosystem',
    description: 'Dedicated workspace for recruiters to post jobs, rank candidates, and automate resume screening.',
    requiredPlanName: 'Recruiter Plan',
    badgeText: '💼 RECRUITER FEATURE'
  },
  'recruiter.candidateUpload': {
    featureKey: 'recruiter.candidateUpload',
    title: 'Bulk Candidate Resume Upload',
    description: 'Upload candidate PDF resumes in bulk for automated ATS parsing and ranking.',
    requiredPlanName: 'Recruiter Plan',
    badgeText: '💼 RECRUITER FEATURE'
  },
  'recruiter.screening': {
    featureKey: 'recruiter.screening',
    title: 'AI Candidate Screening & Shortlisting',
    description: 'Automated semantic match scores, candidate ranking, and shortlisting workflows.',
    requiredPlanName: 'Recruiter Plan',
    badgeText: '💼 RECRUITER FEATURE'
  },
  'admin.dashboard': {
    featureKey: 'admin.dashboard',
    title: 'Platform Admin Control Center',
    description: 'System administration, user management, telemetry monitoring, and subscription approvals.',
    requiredPlanName: 'Platform Admin',
    badgeText: '🛡️ ADMIN FEATURE'
  }
};

/**
 * Returns true if the user's subscription status allows active usage.
 */
export const isSubscriptionActive = (user: User | null): boolean => {
  if (!user) return false;
  // Free users don't require an approved payment status
  if (!user.plan || user.plan === 'free') return true;
  // Admins do not depend on subscription status
  if (user.userType === 'admin') return true;
  // Approved or active statuses
  return user.subscriptionStatus === 'approved' || user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
};

/**
 * Calculates monthly review usage limit for candidates.
 */
export const getMonthlyReviewLimit = (user: User | null): number => {
  if (!user) return 0;
  if (user.userType === 'admin') return Infinity;
  if (user.plan === 'pro' || user.plan === 'career-max') return Infinity;
  return 5; // Free plan limit
};

/**
 * Main Entitlement Check Function
 */
export const canAccessFeature = (user: User | null, featureKey: FeatureKey): AccessCheckResult => {
  // 1. Must be authenticated
  if (!user) {
    return {
      allowed: false,
      reason: 'unauthenticated'
    };
  }

  // 2. Admin Has Global Access
  if (user.userType === 'admin' || user.email === 'admin@resumeai.com' || user.email === 'piyushdubey447@gmail.com') {
    return { allowed: true };
  }

  // 3. Admin Dashboard Check
  if (featureKey === 'admin.dashboard') {
    return {
      allowed: false,
      reason: 'wrong_role',
      requiredRole: 'admin'
    };
  }

  // 4. Recruiter Features Check
  if (featureKey.startsWith('recruiter.')) {
    if (user.userType !== 'recruiter') {
      return {
        allowed: false,
        reason: 'wrong_role',
        requiredRole: 'recruiter'
      };
    }
    // Check if recruiter subscription is active
    if (user.plan !== 'recruiter' && user.plan !== 'enterprise') {
      return {
        allowed: false,
        reason: 'upgrade_required',
        requiredPlan: 'Recruiter Plan'
      };
    }
    return { allowed: true };
  }

  // 5. Candidate Features Check
  if (user.userType !== 'seeker') {
    // If a recruiter tries seeker features, check if allowed
    if (featureKey === 'resume.basicReview') return { allowed: true };
  }

  // Determine effective plan (if pending or expired, fallback to free unless approved)
  const isProPlan = (user.plan === 'pro' || user.plan === 'career-max') && isSubscriptionActive(user);

  switch (featureKey) {
    case 'resume.basicReview':
      return { allowed: true };

    case 'resume.unlimitedReviews': {
      const limit = getMonthlyReviewLimit(user);
      if (limit === Infinity) return { allowed: true };
      const currentUsage = user.usage?.['resume_reviews'] || 0;
      if (currentUsage >= limit) {
        return {
          allowed: false,
          reason: 'limit_reached',
          limit,
          currentUsage,
          requiredPlan: 'Job Seeker Pro'
        };
      }
      return { allowed: true, limit, currentUsage };
    }

    case 'resume.jdMatch':
    case 'ai.bulletRewriter':
    case 'ai.mockInterview':
      if (!isProPlan) {
        return {
          allowed: false,
          reason: 'upgrade_required',
          requiredPlan: 'Job Seeker Pro ($12)'
        };
      }
      return { allowed: true };

    case 'portfolio.analysis': {
      const isMaxPlan = user.plan === 'career-max' && isSubscriptionActive(user);
      if (!isMaxPlan) {
        return {
          allowed: false,
          reason: 'upgrade_required',
          requiredPlan: 'Career Max ($49)'
        };
      }
      return { allowed: true };
    }

    case 'candidate.applications':
    case 'candidate.leaderboard':
    case 'candidate.profile':
    default:
      return { allowed: true };
  }
};
