export interface PricingPlan {
  id: 'free' | 'pro' | 'career-max' | 'recruiter' | 'enterprise';
  eyebrow: string;
  name: string;
  price: string;
  period: string;
  targetRole: 'seeker' | 'recruiter' | 'enterprise' | 'all';
  description: string;
  features: string[];
  limits: string;
  activeSubscribersCount: number;
}

export const PLANS: PricingPlan[] = [
  {
    id: 'free',
    eyebrow: 'For Students & Beginners',
    name: 'Free Plan',
    price: '$0',
    period: 'forever',
    targetRole: 'seeker',
    description: 'A solid starting point for checking resume fundamentals and scoring.',
    features: [
      '5 resume reviews each month',
      'Software Engineering & Data Science rubrics',
      'Clear, actionable formatting feedback',
      'Profile links & GitHub activity check'
    ],
    limits: '5 reviews / month',
    activeSubscribersCount: 8420
  },
  {
    id: 'pro',
    eyebrow: 'For Active Job Applicants',
    name: 'Job Seeker Pro',
    price: '$12',
    period: 'per month',
    targetRole: 'seeker',
    description: 'Everything you need to tailor each application with AI confidence.',
    features: [
      'Unlimited resume reviews',
      'All 4 role rubrics (SDE, Data, Mkt, PM)',
      'JD match & skills-gap overlap reports',
      'AI bullet point rewriter',
      'Tailored AI mock interview practice'
    ],
    limits: 'Unlimited reviews & AI tools',
    activeSubscribersCount: 1420
  },
  {
    id: 'career-max',
    eyebrow: 'For Ambitious Candidates',
    name: 'Career Max',
    price: '$49',
    period: 'per month',
    targetRole: 'seeker',
    description: 'Complete career acceleration workspace targeting top-tier tech roles.',
    features: [
      'Everything in Job Seeker Pro',
      'Unlimited resume & JD comparisons',
      'Portfolio, GitHub & LeetCode signal analysis',
      'Priority recruiter-ready exports',
      '1-on-1 AI interview simulator'
    ],
    limits: 'Unlimited + Priority Support',
    activeSubscribersCount: 310
  },
  {
    id: 'recruiter',
    eyebrow: 'For Hiring Teams',
    name: 'Recruiter Hub',
    price: '$49',
    period: 'per month',
    targetRole: 'recruiter',
    description: 'A focused workspace for bulk screening and shortlisting candidates.',
    features: [
      'Bulk PDF resume uploads',
      'AI semantic candidate ranking',
      'Automated skills-gap analysis',
      'Exportable shortlists & CSV reports',
      'Active job management'
    ],
    limits: 'Up to 500 candidates / month',
    activeSubscribersCount: 480
  },
  {
    id: 'enterprise',
    eyebrow: 'For Organizations',
    name: 'Enterprise Platform',
    price: 'Custom',
    period: 'annual billing',
    targetRole: 'enterprise',
    description: 'Unlimited screening, custom ATS integrations, and dedicated SLA support.',
    features: [
      'Unlimited candidate screening',
      'Custom role rubric JSON builder',
      'Workday & Greenhouse ATS sync',
      'Dedicated account manager',
      'SOC2 compliance & audit logs'
    ],
    limits: 'Unlimited across organization',
    activeSubscribersCount: 45
  }
];
