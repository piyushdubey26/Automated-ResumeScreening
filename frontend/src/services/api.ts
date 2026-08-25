import axios from 'axios';
import type {
  User,
  ResumeRecord,
  JDMatchResult,
  RewriteResult,
  InterviewQuestion,
  RecruiterCandidate,
  LeaderboardEntry,
  FeedbackCard
} from '../types';
import { cloudSync } from './cloudSync';

const SKILLS_BY_ROLE = {
  sde: ['typescript', 'javascript', 'node.js', 'node', 'express', 'react', 'postgresql', 'postgres', 'docker', 'aws', 'redis', 'rest api', 'git', 'graphql', 'kubernetes', 'python', 'java', 'c++', 'go', 'sql', 'html', 'css'],
  'data-science': ['python', 'pytorch', 'tensorflow', 'scikit-learn', 'pandas', 'numpy', 'sql', 'a/b testing', 'docker', 'aws', 'sagemaker', 'machine learning', 'deep learning', 'nlp', 'statistics', 'spark', 'etl'],
  marketing: ['seo', 'sem', 'paid social', 'google analytics', 'ga4', 'hubspot', 'a/b testing', 'figma', 'copywriting', 'cac', 'ltv', 'roas', 'ads', 'social media', 'email marketing'],
  'product-management': ['agile', 'scrum', 'roadmap', 'product strategy', 'jira', 'user stories', 'prd', 'wireframes', 'metrics', 'analytics', 'market research', 'product launch']
};

const ACTION_VERBS = ['achieved', 'analyzed', 'architected', 'built', 'created', 'designed', 'developed', 'engineered', 'formulated', 'implemented', 'improved', 'increased', 'led', 'managed', 'optimized', 'reduced', 'scaled'];

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('resumeai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const fallbackUser: User = {
  id: 'guest-user',
  name: 'New Seeker',
  email: 'seeker@example.com',
  rolePreference: 'sde',
  userType: 'seeker',
  badges: [],
  points: 0,
  usage: { resume_reviews: 0 },
  createdAt: new Date().toISOString()
};

// ── Browser-based LocalStorage fallback DB ────────────────────────────────────
const LOCAL_DB_KEY = 'resumeai_local_db';

interface LocalDB {
  users: User[];
  resumes: ResumeRecord[];
}

const getLocalDB = (): LocalDB => {
  const saved = localStorage.getItem(LOCAL_DB_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  
  // Initial seed data
  const initial: LocalDB = {
    users: [],
    resumes: []
  };
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(initial));
  return initial;
};

const saveLocalDB = (db: LocalDB) => {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
};

export const sampleResumesText = {
  sde: `Alex Rivera
Email: alex.rivera@example.com | GitHub: github.com/arivera | LinkedIn: linkedin.com/in/alex-rivera-dev

SUMMARY
Results-driven Software Engineer with 3+ years of experience building high-throughput microservices, REST APIs, and scalable web applications.

SKILLS
TypeScript, JavaScript, Node.js, Express, React, PostgreSQL, Docker, AWS, Redis, REST API, Git, GraphQL

EXPERIENCE
Full Stack Engineer | CloudTech Solutions (2024 - Present)
- Architected and built a microservice-based notification system in Node.js & TypeScript, handling 2M+ daily active requests with 99.98% uptime.
- Optimized PostgreSQL database queries and added Redis caching, reducing average API latency by 42% (from 350ms to 20ms).
- Refactored legacy monolithic backend into decoupled RESTful services with Docker containers deployed on AWS EKS.

PROJECTS
- ResumeAI: Automated Resume Screening Platform using React, Express, and role rubrics.
- Distributed Key-Value Store: Built fault-tolerant memory DB in Go with Raft consensus.`,

  ds: `Priya Sharma
Email: priya.sharma@example.com | Kaggle: kaggle.com/psharma | GitHub: github.com/priyads

SUMMARY
Data Scientist with 2+ years experience in predictive modeling, NLP, and machine learning model deployment.

SKILLS
Python, PyTorch, TensorFlow, Scikit-Learn, Pandas, NumPy, SQL, A/B Testing, Docker, AWS SageMaker

EXPERIENCE
Associate Data Scientist | Analytics Intelligence Inc. (2023 - Present)
- Fine-tuned BERT-based NLP model for customer churn sentiment analysis, boosting F1-score from 0.74 to 0.91.
- Engineered automated ETL pipelines in Python & Apache Spark, processing 50GB+ daily user logs.
- Designed A/B testing campaigns for recommendation algorithms, increasing user session length by 18%.`,

  marketing: `Jordan Lee
Email: jordan.lee@example.com | Portfolio: jordanleemarketing.com | LinkedIn: linkedin.com/in/jordan-lee-growth

SUMMARY
Growth Marketer with 4+ years experience scaling customer acquisition and conversion rate optimization (CRO).

SKILLS
SEO, SEM, Paid Social, Google Analytics 4, HubSpot, A/B Testing, Figma, Copywriting, CAC/LTV

EXPERIENCE
Senior Growth Marketing Specialist | SaaSify Global (2023 - Present)
- Scaled monthly organic SEO traffic by 140% through targeted keyword strategy and content clustering.
- Managed $85K monthly paid acquisition budget across Meta & LinkedIn ads, achieving 3.4x ROAS and cutting CAC by 28%.`
};

export const sampleJDsText = {
  sde: `Position: Senior Full Stack Engineer (SDE II)
Company: TechScale Innovations
Requirements:
- 3+ years experience building microservices using Node.js, Express, TypeScript, React, Next.js, PostgreSQL, Docker, AWS, GraphQL, and Redis.
- Optimize database schemas and queries in SQL.
- Implement containerized deployments using Docker & Kubernetes.`,

  ds: `Position: Machine Learning & Data Scientist
Company: AI Visionaries
Requirements:
- Master's degree in Data Science or Statistics.
- Proficiency in Python, SQL, PyTorch/TensorFlow, Pandas, Scikit-Learn.
- Experience with MLOps (Docker, AWS SageMaker) and A/B testing.`
};

export const authApi = {
  login: async (email: string, password?: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      return res.data;
    } catch {
      const lowerEmail = email.toLowerCase().trim();
      
      // Enforce strict password validation for primary Admin account
      if (lowerEmail === 'piyushdubey447@gmail.com') {
        if (password && password !== 'piyush26') {
          throw new Error('Invalid password for Admin account (piyushdubey447@gmail.com)');
        }
      }

      const db = getLocalDB();
      let user = db.users.find((u: any) => u.email.toLowerCase() === lowerEmail);

      // Primary Admin account provisioning
      if (lowerEmail === 'piyushdubey447@gmail.com') {
        if (!user) {
          user = {
            id: 'admin-piyush',
            name: 'Piyush Dubey',
            email: 'piyushdubey447@gmail.com',
            rolePreference: 'sde',
            userType: 'admin',
            plan: 'enterprise',
            subscriptionStatus: 'approved',
            badges: ['Platform Founder', 'Admin'],
            points: 10000,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PiyushDubey',
            createdAt: new Date().toISOString()
          };
          db.users.push(user);
          saveLocalDB(db);
        } else {
          user.userType = 'admin';
          saveLocalDB(db);
        }
        return { token: 'mock-admin-jwt-token', user };
      }

      // For non-Piyush accounts, preserve assigned userType (which can be admin if promoted by Piyush in Admin Dashboard)
      const isRecruiter = lowerEmail.includes('recruiter');
      const userType: 'seeker' | 'recruiter' | 'admin' = user?.userType || (isRecruiter ? 'recruiter' : 'seeker');

      const rawName = lowerEmail.split('@')[0].replace(/[._-]/g, ' ');
      const displayName = rawName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

      if (!user) {
        user = {
          id: `user-${Date.now()}`,
          name: displayName,
          email,
          password: password || 'password123',
          rolePreference: 'sde',
          userType,
          plan: userType === 'recruiter' ? 'recruiter' : 'free',
          subscriptionStatus: userType === 'recruiter' ? 'approved' : 'free',
          badges: ['New Explorer'],
          points: 500,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
        saveLocalDB(db);
      } else if (user.password && password && user.password !== password) {
        throw new Error('Incorrect password for this account. Try again or reset password.');
      }

      cloudSync.saveUser({
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        rolePreference: user.rolePreference,
        status: 'Active',
        plan: user.plan || 'free',
        subscriptionStatus: user.subscriptionStatus || 'free',
        joinedDate: user.createdAt || new Date().toISOString(),
        lastActive: 'Just now'
      });

      return { token: 'mock-jwt-token', user };
    }
  },
  signup: async (name: string, email: string, rolePreference: string, userType: 'seeker' | 'recruiter', password?: string) => {
    try {
      const res = await api.post('/auth/signup', { name, email, rolePreference, userType, password });
      return res.data;
    } catch {
      const lowerEmail = email.toLowerCase().trim();
      const db = getLocalDB();
      
      const existing = db.users.find((u: any) => u.email.toLowerCase() === lowerEmail);
      if (existing) {
        throw new Error('An account already exists with this email address. Please sign in instead.');
      }

      const user: User & { password?: string } = {
        id: `user-${Date.now()}`,
        name,
        email,
        password: password || 'password123',
        rolePreference: rolePreference as any,
        userType,
        plan: userType === 'recruiter' ? 'recruiter' : 'free',
        subscriptionStatus: userType === 'recruiter' ? 'approved' : 'free',
        badges: ['New Explorer'],
        points: 500,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      saveLocalDB(db);

      cloudSync.saveUser({
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        rolePreference: user.rolePreference,
        status: 'Active',
        plan: user.plan || 'free',
        subscriptionStatus: user.subscriptionStatus || 'free',
        joinedDate: user.createdAt,
        lastActive: 'Just now'
      });

      return { token: 'mock-jwt-token', user };
    }
  },
  getMe: async () => {
    try {
      const res = await api.get('/auth/me');
      return res.data;
    } catch {
      return { user: fallbackUser };
    }
  }
};

export const resumeApi = {
  uploadAndParse: async (text: string, filename?: string, targetRole: string = 'sde'): Promise<{ resume: ResumeRecord }> => {
    try {
      const res = await api.post('/resumes/upload', { text, filename, targetRole });
      return res.data;
    } catch {
      const lowerText = text.toLowerCase();
      
      // 1. Extract contact info via regex
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const githubMatch = text.match(/(github\.com\/[a-zA-Z0-9_-]+)/i);
      const linkedinMatch = text.match(/(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i);
      
      // Get display name: use first line of text or fallback
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const derivedName = lines[0] && lines[0].length < 40 ? lines[0] : 'Uploaded Candidate';

      // 2. Identify skills present
      const roleSkills = SKILLS_BY_ROLE[targetRole as keyof typeof SKILLS_BY_ROLE] || SKILLS_BY_ROLE.sde;
      const foundSkills: string[] = [];
      roleSkills.forEach(skill => {
        const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(lowerText)) {
          foundSkills.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
        }
      });
      
      const missingSkills = roleSkills
        .filter(skill => !foundSkills.map(s => s.toLowerCase()).includes(skill))
        .map(skill => skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

      // 3. Score calculation
      let scoreBreakdown = {
        structure: 75,
        clarity: 70,
        impact: 60,
        skills: 50,
        projects: 70,
        ats: 80
      };

      const feedback: FeedbackCard[] = [];

      // Structure check
      if (emailMatch) scoreBreakdown.structure += 15;
      if (githubMatch || linkedinMatch) scoreBreakdown.structure += 10;
      if (scoreBreakdown.structure > 100) scoreBreakdown.structure = 100;
      
      if (!emailMatch) {
        feedback.push({
          id: 'fb-struct-1',
          category: 'Structure',
          severity: 'high',
          title: 'Missing Email Address',
          description: 'No valid email address was detected in your resume.',
          suggestion: 'Add a professional email address at the very top of your resume.'
        });
      }
      if (!githubMatch && !linkedinMatch) {
        feedback.push({
          id: 'fb-struct-2',
          category: 'Structure',
          severity: 'medium',
          title: 'Missing Professional Links',
          description: 'No LinkedIn or GitHub links were detected.',
          suggestion: 'Include your LinkedIn profile and GitHub (for technical roles) to build trust.'
        });
      }

      // Skills score
      const skillRatio = roleSkills.length > 0 ? foundSkills.length / roleSkills.length : 1;
      scoreBreakdown.skills = Math.round(50 + skillRatio * 50);

      if (missingSkills.length > 0) {
        feedback.push({
          id: 'fb-skills-1',
          category: 'Skills',
          severity: missingSkills.length > 4 ? 'high' : 'medium',
          title: `Missing ${targetRole.toUpperCase()} Core Skills`,
          description: `Your resume is missing important keywords: ${missingSkills.slice(0, 4).join(', ')}.`,
          suggestion: `Explicitly add missing skills like: ${missingSkills.slice(0, 3).join(', ')} to your Skills section.`
        });
      } else {
        feedback.push({
          id: 'fb-skills-2',
          category: 'Skills',
          severity: 'success',
          title: 'Excellent Core Skill Coverage',
          description: 'Your resume contains all major core skills requested for this role.',
          suggestion: 'Excellent alignment. Keep these skills updated with active project references.'
        });
      }

      // Metrics & action verbs check (Impact & Clarity)
      const metricsMatches = lowerText.match(/\d+%/g) || lowerText.match(/\d+\s*%/g) || lowerText.match(/\$\d+/g) || lowerText.match(/\b\d+\+\b/g);
      if (metricsMatches && metricsMatches.length >= 3) {
        scoreBreakdown.impact = 90;
        feedback.push({
          id: 'fb-impact-1',
          category: 'Impact',
          severity: 'success',
          title: 'Strong Metric Quantifiers',
          description: `Detected several metrics (${metricsMatches.slice(0, 3).join(', ')}) showing quantified achievements.`,
          suggestion: 'Keep highlighting ROI and quantifiable benchmarks.'
        });
      } else {
        scoreBreakdown.impact = 55;
        feedback.push({
          id: 'fb-impact-2',
          category: 'Impact',
          severity: 'high',
          title: 'Weak Metric Quantifiers',
          description: 'Very few metrics (percentages, dollar values, user counts) were detected in your resume bullet points.',
          suggestion: 'Quantify your impact. For example: "built API" -> "built API handling 10k+ requests, reducing latency by 20%".'
        });
      }

      // Action verbs check
      const verbsFound = ACTION_VERBS.filter(verb => new RegExp(`\\b${verb}\\b`, 'i').test(lowerText));
      scoreBreakdown.clarity = Math.round(60 + (verbsFound.length / 10) * 40);
      if (scoreBreakdown.clarity > 100) scoreBreakdown.clarity = 100;

      if (verbsFound.length < 5) {
        feedback.push({
          id: 'fb-clarity-1',
          category: 'Clarity',
          severity: 'medium',
          title: 'Weak Action Verbs',
          description: 'Your bullet points use passive verbs or repetitive wording.',
          suggestion: 'Start bullet points with strong action verbs like: Architected, Led, Optimized, or Engineered.'
        });
      }

      // Overall Score
      const score = Math.round(
        (scoreBreakdown.structure +
          scoreBreakdown.clarity +
          scoreBreakdown.impact +
          scoreBreakdown.skills +
          scoreBreakdown.projects +
          scoreBreakdown.ats) /
          6
      );

      const mockRecord: ResumeRecord = {
        id: `resume-${Date.now()}`,
        userId: 'user-seeker-1',
        filename: filename || 'Uploaded_Resume.pdf',
        targetRole,
        rawText: text,
        parsedSections: {
          contact: {
            name: derivedName,
            email: emailMatch ? emailMatch[0] : undefined,
            github: githubMatch ? githubMatch[0] : undefined,
            linkedin: linkedinMatch ? linkedinMatch[0] : undefined
          },
          skills: foundSkills,
          experience: lines.filter(l => l.toLowerCase().includes('respons') || l.toLowerCase().includes('build') || l.toLowerCase().includes('develop') || l.toLowerCase().includes('manag')),
          projects: lines.filter(l => l.toLowerCase().includes('project') || l.toLowerCase().includes('resumeai')),
          education: lines.filter(l => l.toLowerCase().includes('university') || l.toLowerCase().includes('college') || l.toLowerCase().includes('degree') || l.toLowerCase().includes('b.s.') || l.toLowerCase().includes('btech'))
        },
        score,
        scoreBreakdown,
        feedback,
        createdAt: new Date().toISOString()
      };

      const db = getLocalDB();
      db.resumes.push(mockRecord);
      saveLocalDB(db);

      return { resume: mockRecord };
    }
  },
  rewriteBullet: async (bulletText: string, focusMode: string, targetRole: string): Promise<RewriteResult> => {
    try {
      const res = await api.post('/resumes/rewrite', { bulletText, focusMode, targetRole });
      return res.data;
    } catch {
      let improved = bulletText.replace(/^(developed|built|worked on|made)\s*/i, 'Architected and engineered ');
      if (focusMode === 'quantify' && !/\d+/.test(improved)) {
        improved += ', driving a 38% efficiency increase and 99.9% uptime.';
      }
      return {
        originalBullet: bulletText,
        improvedBullet: improved,
        explanation: 'Enhanced verb power and added quantifiable impact metrics.',
        strengthScore: 94
      };
    }
  },
  generateMockInterview: async (targetRole: string, resumeText?: string, jdText?: string): Promise<{ questions: InterviewQuestion[] }> => {
    try {
      const res = await api.post('/resumes/mock-interview', { targetRole, resumeText, jdText });
      return res.data;
    } catch {
      return {
        questions: [
          {
            id: 'q-1',
            category: 'System & Domain Architecture',
            question: 'How would you architect a high-throughput microservices application handling 2M+ daily requests?',
            difficulty: 'Hard',
            keyPointsToCover: ['Load balancing & API gateways', 'Database indexing & Redis caching', 'Asynchronous queues', 'Circuit breaker pattern']
          },
          {
            id: 'q-2',
            category: 'Technical Core',
            question: 'Explain how you optimize PostgreSQL queries when dealing with large-scale tables, and when you choose Redis caching.',
            difficulty: 'Medium',
            keyPointsToCover: ['EXPLAIN ANALYZE', 'Composite indexes', 'Cache eviction (LRU)', 'Cache stampede prevention']
          }
        ]
      };
    }
  }
};

export const jobApi = {
  matchJD: async (resumeText: string, jdText: string, targetRole: string = 'sde'): Promise<JDMatchResult> => {
    try {
      const res = await api.post('/jobs/match', { resumeText, jdText, targetRole });
      return res.data;
    } catch {
      const lowerResume = resumeText.toLowerCase();
      const lowerJD = jdText.toLowerCase();

      // Find skills in JD
      const allSkills = [...SKILLS_BY_ROLE.sde, ...SKILLS_BY_ROLE['data-science'], ...SKILLS_BY_ROLE.marketing, ...SKILLS_BY_ROLE['product-management']];
      
      const jdSkills: string[] = [];
      allSkills.forEach(skill => {
        const regex = new RegExp(`\\b${skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerJD) && !jdSkills.includes(skill)) {
          jdSkills.push(skill);
        }
      });

      // Find which of these are in the resume
      const matched: string[] = [];
      const missing: string[] = [];
      jdSkills.forEach(skill => {
        const regex = new RegExp(`\\b${skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerResume)) {
          matched.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
        } else {
          missing.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
        }
      });

      const totalJD = jdSkills.length || 5;
      const matchPct = Math.round((matched.length / totalJD) * 100);
      
      const recommendations = [
        ...missing.map(skill => `Explicitly incorporate the missing keyword: "${skill}" in your Skills or Experience section.`),
        `Highlight experience where you worked with ${matched.slice(0, 3).join(', ') || 'relevant technologies'}.`
      ];

      return {
        matchPct,
        keywordScore: matchPct,
        embeddingScore: Math.round(matchPct * 0.95),
        matchedKeywords: matched,
        missingKeywords: missing,
        missingCoreSkills: missing.slice(0, 3),
        impactGapScore: 100 - matchPct,
        recommendations
      };
    }
  }
};

export const recruiterApi = {
  bulkScreen: async (candidates: any[], jdText?: string, targetRole: string = 'sde'): Promise<{ shortlist: RecruiterCandidate[] }> => {
    try {
      const res = await api.post('/recruiter/bulk-screen', { candidates, jdText, targetRole });
      return res.data;
    } catch {
      let candidateName = 'Alex Rivera';
      let candidateEmail = 'alex.rivera@example.com';
      try {
        const savedUserStr = localStorage.getItem('resumeai_user');
        if (savedUserStr) {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser && savedUser.name) {
            candidateName = savedUser.name;
            candidateEmail = savedUser.email;
          }
        }
      } catch {}

      const mockShortlist: RecruiterCandidate[] = [
        { id: 'c-1', recruiterJobId: 'j-1', candidateName: candidateName, candidateEmail: candidateEmail, targetRole: 'sde', resumeText: 'Full Stack Engineer. Built Node.js, React, Docker microservices.', overallScore: 88, jdMatchPct: 92, status: 'Shortlisted', appliedAt: new Date().toISOString() },
        { id: 'c-2', recruiterJobId: 'j-1', candidateName: 'Priya Sharma', candidateEmail: 'priya@example.com', targetRole: 'data-science', resumeText: 'Data Scientist in Python, PyTorch, SQL, Spark.', overallScore: 84, jdMatchPct: 86, status: 'Shortlisted', appliedAt: new Date().toISOString() },
        { id: 'c-3', recruiterJobId: 'j-1', candidateName: 'David Chen', candidateEmail: 'david@example.com', targetRole: 'sde', resumeText: 'Backend Developer in Python & MySQL.', overallScore: 76, jdMatchPct: 74, status: 'Under Review', appliedAt: new Date().toISOString() },
        { id: 'c-4', recruiterJobId: 'j-1', candidateName: 'Maria Garcia', candidateEmail: 'maria@example.com', targetRole: 'sde', resumeText: 'Frontend Developer in Vue.js and HTML/CSS.', overallScore: 64, jdMatchPct: 58, status: 'Rejected', appliedAt: new Date().toISOString() }
      ];
      return { shortlist: mockShortlist };
    }
  }
};

export const ecosystemApi = {
  getLeaderboard: async (): Promise<{ leaderboard: LeaderboardEntry[] }> => {
    try {
      const res = await api.get('/ecosystem/leaderboard');
      return res.data;
    } catch {
      let candidateName = 'Alex Rivera';
      try {
        const savedUserStr = localStorage.getItem('resumeai_user');
        if (savedUserStr) {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser && savedUser.name) {
            candidateName = savedUser.name;
          }
        }
      } catch {}

      return {
        leaderboard: [
          { rank: 1, name: candidateName, institution: 'UC Berkeley', score: 94, badges: ['ATS Ninja', 'Metric Machine', 'Role Ready'], avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
          { rank: 2, name: 'Priya Sharma', institution: 'Northeastern Univ', score: 91, badges: ['ML Wizard', 'Data Master'], avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100' },
          { rank: 3, name: 'Jordan Lee', institution: 'NYU Stern', score: 89, badges: ['Growth Hacker', 'CRO Pro'], avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
          { rank: 4, name: 'Samantha Wu', institution: 'Stanford Univ', score: 88, badges: ['Full Stack Ace'], avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' },
          { rank: 5, name: 'Marcus Brody', institution: 'MIT', score: 86, badges: ['System Architect'], avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }
        ]
      };
    }
  }
};
