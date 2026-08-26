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
  profileLinks?: { github?: string; linkedin?: string; project?: string; coding?: string };
  interviewScore?: number | null;
  monthlyUsage?: number;
  usageMonth?: string;
  plan?: string;
  subscriptionStatus?: string;
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

export interface SubscriptionRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  currentPlan: string;
  requestedPlan: string;
  requestedPlanName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectedByName?: string;
}

export interface UserApplication {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  appliedDate: string;
  notes?: string;
}

export interface JDMatchRecord {
  id: string;
  userId: string;
  resumeId: string;
  jdId: string;
  jdText: string;
  targetRole: string;
  matchPct: number;
  keywordScore: number;
  embeddingScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingCoreSkills: string[];
  impactGapScore: number;
  recommendations: string[];
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  timestamp: string;
  points: number;
}

export interface FeedbackCard {
  id: string;
  category: 'Structure' | 'Clarity' | 'Impact' | 'Skills' | 'Projects' | 'ATS';
  severity: 'high' | 'medium' | 'low' | 'success';
  title: string;
  description: string;
  suggestion: string;
}

export interface ResumeRecord {
  id: string;
  userId: string;
  filename: string;
  targetRole: string;
  rawText: string;
  parsedSections: {
    contact: { name?: string; email?: string; phone?: string; github?: string; linkedin?: string };
    skills: string[];
    experience: string[];
    projects: string[];
    education: string[];
  };
  score: number;
  scoreBreakdown: {
    structure: number;
    clarity: number;
    impact: number;
    skills: number;
    projects: number;
    ats: number;
  };
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

export interface MatchResultRecord {
  id: string;
  resumeId: string;
  jdId: string;
  matchPct: number;
  keywordScore: number;
  embeddingScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingCoreSkills: string[];
  impactGapScore: number;
  recommendations: string[];
  createdAt: string;
}

export interface RecruiterCandidateRecord {
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

// Initial Seed Users
const users: User[] = [
  {
    id: 'admin-piyush',
    name: 'Piyush Dubey',
    email: 'piyushdubey447@gmail.com',
    password: 'piyush26',
    rolePreference: 'sde',
    userType: 'admin',
    badges: ['Platform Founder', 'Admin'],
    points: 10000,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Piyush%20Dubey',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-sakshi',
    name: 'Sakshi',
    email: 'sakshi@gmail.com',
    password: 'Sakshi22@',
    rolePreference: 'sde',
    userType: 'seeker',
    badges: ['New Explorer', 'ATS Ready'],
    points: 500,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakshi',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-seeker-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    password: 'password123',
    rolePreference: 'sde',
    userType: 'seeker',
    badges: ['ATS Ninja', 'Metric Machine', 'Role Ready'],
    points: 1450,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-recruiter-1',
    name: 'Sarah Jenkins (Recruiter)',
    email: 'recruiter@techscale.com',
    password: 'password123',
    rolePreference: 'sde',
    userType: 'recruiter',
    badges: ['Top Talent Scout'],
    points: 3200,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    createdAt: new Date().toISOString()
  }
];

// Initial Seed Resumes
const resumes: ResumeRecord[] = [
  {
    id: 'resume-sde-1',
    userId: 'user-seeker-1',
    filename: 'Alex_Rivera_SDE_Resume.pdf',
    targetRole: 'sde',
    rawText: `Alex Rivera
Email: alex.rivera@example.com | GitHub: github.com/arivera | LinkedIn: linkedin.com/in/alex-rivera-dev
Architected and built a microservice-based notification system in Node.js & TypeScript, handling 2M+ daily active requests with 99.98% uptime.
Optimized PostgreSQL database queries and added Redis caching, reducing average API latency by 42% (from 350ms to 20ms).
Refactored legacy monolithic backend into decoupled RESTful services with Docker containers deployed on AWS EKS.`,
    parsedSections: {
      contact: {
        name: 'Alex Rivera',
        email: 'alex.rivera@example.com',
        github: 'github.com/arivera',
        linkedin: 'linkedin.com/in/alex-rivera-dev'
      },
      skills: ['TypeScript', 'Node.js', 'Express', 'React', 'PostgreSQL', 'Docker', 'AWS', 'REST API', 'Redis'],
      experience: [
        'Architected and built a microservice-based notification system in Node.js & TypeScript handling 2M+ requests',
        'Optimized PostgreSQL database queries and added Redis caching reducing latency by 42%',
        'Refactored legacy monolithic backend into Docker containers on AWS EKS'
      ],
      projects: ['ResumeAI - Automated Screening Platform', 'Distributed Key-Value Store'],
      education: ['B.S. in Computer Science | UC Berkeley']
    },
    score: 86,
    scoreBreakdown: {
      structure: 90,
      clarity: 88,
      impact: 92,
      skills: 85,
      projects: 80,
      ats: 82
    },
    feedback: [
      {
        id: 'fb-1',
        category: 'Impact',
        severity: 'success',
        title: 'Strong Metric Quantifiers',
        description: 'You included great hard numbers (2M+ requests, 42% latency reduction).',
        suggestion: 'Keep highlighting ROI and quantifiable backend benchmarks.'
      },
      {
        id: 'fb-2',
        category: 'Skills',
        severity: 'medium',
        title: 'Missing System Design Keywords',
        description: 'Target SDE roles frequently look for GraphQL or CI/CD pipelines.',
        suggestion: 'Mention Docker/Kubernetes container orchestration or GraphQL explicitly.'
      },
      {
        id: 'fb-3',
        category: 'ATS',
        severity: 'high',
        title: 'Avoid Graphic Icons or Columns',
        description: 'Ensure contact details use clean plain text without complex tabular formatting.',
        suggestion: 'Format contact bar as single line text separated by pipes.'
      }
    ],
    createdAt: new Date().toISOString()
  }
];

// Seed Job Descriptions
const jobDescriptions: JobDescriptionRecord[] = [
  {
    id: 'jd-sde-1',
    recruiterId: 'user-recruiter-1',
    title: 'Senior Full Stack Engineer (SDE II)',
    targetRole: 'sde',
    text: `We are seeking an experienced Full Stack Engineer to architect microservices using Node.js, Express, TypeScript, React, Next.js, PostgreSQL, Docker, AWS, GraphQL, and Redis.`,
    requiredSkills: ['Node.js', 'TypeScript', 'React', 'PostgreSQL', 'Docker', 'AWS', 'REST API', 'GraphQL', 'System Design'],
    optionalSkills: ['Kubernetes', 'Redis', 'Jest', 'Cypress', 'CI/CD'],
    createdAt: new Date().toISOString()
  }
];

// Seed Candidate Shortlist for Recruiter
const recruiterCandidates: RecruiterCandidateRecord[] = [
  {
    id: 'cand-1',
    recruiterJobId: 'jd-sde-1',
    candidateName: 'Alex Rivera',
    candidateEmail: 'alex.rivera@example.com',
    targetRole: 'sde',
    resumeText: 'Full Stack Engineer with 3+ years experience. Built microservices in Node.js, React, PostgreSQL, Docker, AWS.',
    overallScore: 88,
    jdMatchPct: 91,
    status: 'Shortlisted',
    appliedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'cand-2',
    recruiterJobId: 'jd-sde-1',
    candidateName: 'David Chen',
    candidateEmail: 'david.chen@example.com',
    targetRole: 'sde',
    resumeText: 'Backend Developer focusing on Python, Django, MySQL, REST APIs, and AWS. Basic React knowledge.',
    overallScore: 78,
    jdMatchPct: 76,
    status: 'Under Review',
    appliedAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'cand-3',
    recruiterJobId: 'jd-sde-1',
    candidateName: 'Maria Garcia',
    candidateEmail: 'm.garcia@example.com',
    targetRole: 'sde',
    resumeText: 'Frontend Specialist proficient in Vue.js, HTML, CSS, JavaScript, Webpack. Learning Node.js.',
    overallScore: 65,
    jdMatchPct: 58,
    status: 'Rejected',
    appliedAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

import fs from 'fs';
import path from 'path';
import os from 'os';

export const mockDb = {
  users,
  resumes,
  jobDescriptions,
  recruiterCandidates,
  applications: [] as UserApplication[],
  jdMatches: [] as JDMatchRecord[],
  activities: [] as ActivityItem[],
  subscriptions: [] as Subscription[],
  subscriptionRequests: [] as SubscriptionRequest[]
};

// Safe database path resolution for both Local Dev and Vercel Serverless Function environment
const getDbFilePath = () => {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join(os.tmpdir(), 'resumeai_db.json');
  }
  const rootDir = process.cwd();
  const primaryPath = path.join(rootDir, 'backend/data/db.json');
  if (fs.existsSync(primaryPath)) {
    return primaryPath;
  }
  return path.join(__dirname, '../../data/db.json');
};

const DB_FILE = getDbFilePath();

// Helper to save current database to file
export const saveDb = () => {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(mockDb, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing to local JSON database:', e);
  }
};

// Load database from file on start
const loadDb = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(fileData);
      if (parsed.users) {
        const userMap = new Map<string, User>();
        // Load hardcoded seed users first
        users.forEach(u => userMap.set(u.email.toLowerCase(), u));
        // Merge loaded users
        parsed.users.forEach((u: any) => userMap.set(u.email.toLowerCase(), u));
        mockDb.users = Array.from(userMap.values());
      }
      if (parsed.resumes) mockDb.resumes = parsed.resumes;
      if (parsed.jobDescriptions) mockDb.jobDescriptions = parsed.jobDescriptions;
      if (parsed.recruiterCandidates) mockDb.recruiterCandidates = parsed.recruiterCandidates;
      if (parsed.applications) mockDb.applications = parsed.applications;
      if (parsed.jdMatches) mockDb.jdMatches = parsed.jdMatches;
      if (parsed.activities) mockDb.activities = parsed.activities;
      if (parsed.subscriptions) mockDb.subscriptions = parsed.subscriptions;
      if (parsed.subscriptionRequests) mockDb.subscriptionRequests = parsed.subscriptionRequests;
    } else {
      // Create initial DB file from seeds
      saveDb();
    }
  } catch (e) {
    console.error('Error loading local JSON database:', e);
  }
};

// Initial load
loadDb();
saveDb();
