export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  rolePreference: 'sde' | 'data-science' | 'marketing' | 'product-management';
  userType: 'seeker' | 'recruiter' | 'admin';
  badges: string[];
  points: number;
  avatar?: string;
  createdAt: string;
  plan?: string;
  subscriptionStatus?: string;
  subscriptionRequestedAt?: string;
  usage?: Record<string, number>;
  monthlyUsage?: number;
  usageMonth?: string;
  profileLinks?: { github?: string; linkedin?: string; project?: string; coding?: string };
  interviewScore?: number | null;
}

export interface UserApplication {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: 'Applied' | 'Interviewing' | 'Offered' | 'Rejected' | 'Offer';
  appliedDate?: string;
  date?: string;
  notes?: string;
}

export interface FeedbackCard {
  id: string;
  category: 'Structure' | 'Clarity' | 'Impact' | 'Skills' | 'Projects' | 'ATS';
  severity: 'high' | 'medium' | 'low' | 'success';
  title: string;
  description: string;
  suggestion: string;
}

export interface ScoreBreakdown {
  structure: number;
  clarity: number;
  impact: number;
  skills: number;
  projects: number;
  ats: number;
}

export interface ParsedSections {
  contact: { name?: string; email?: string; phone?: string; github?: string; linkedin?: string };
  skills: string[];
  experience: string[];
  projects: string[];
  education: string[];
}

export interface ResumeRecord {
  id: string;
  userId: string;
  filename: string;
  targetRole: string;
  rawText: string;
  parsedSections: ParsedSections;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  feedback: FeedbackCard[];
  createdAt: string;
}

export interface JobDescriptionRecord {
  id: string;
  recruiterId?: string;
  title: string;
  targetRole: string;
  text: string;
  requiredSkills: string[];
  optionalSkills: string[];
  createdAt: string;
}

export interface JDMatchResult {
  resumeId?: string;
  jdId?: string;
  jdText?: string;
  matchPct: number;
  keywordScore: number;
  embeddingScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingCoreSkills: string[];
  impactGapScore: number;
  recommendations: string[];
  scoreBreakdown?: {
    requiredSkills: number;
    experience: number;
    responsibilities: number;
    preferredSkills: number;
    projects: number;
    ats: number;
  };
  criticalGaps?: string[];
  partialSkills?: string[];
  explanation?: string;
}

export interface RewriteResult {
  originalBullet: string;
  improvedBullet: string;
  explanation: string;
  strengthScore: number;
}

export interface InterviewQuestion {
  id: string;
  category: 'Technical Core' | 'System & Domain Architecture' | 'Behavioral & Leadership' | 'JD Specific';
  question: string;
  difficulty: 'Medium' | 'Hard';
  keyPointsToCover: string[];
}

export interface RecruiterCandidate {
  id: string;
  recruiterJobId: string;
  candidateName: string;
  candidateEmail: string;
  targetRole: string;
  resumeText: string;
  overallScore: number;
  jdMatchPct: number;
  status: 'Shortlisted' | 'Under Review' | 'Rejected' | 'Interviewed';
  appliedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  institution: string;
  score: number;
  badges: string[];
  avatar: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'active' | 'expired';
  billingInterval: 'monthly';
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  customerId?: string;
  subscriptionId?: string;
  priceId?: string;
}
