import axios from 'axios';
import type {
  User,
  ResumeRecord,
  JDMatchResult,
  RewriteResult,
  InterviewQuestion,
  RecruiterCandidate,
  LeaderboardEntry
} from '../types';

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
  id: 'user-seeker-1',
  name: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  rolePreference: 'sde',
  userType: 'seeker',
  badges: ['ATS Ninja', 'Metric Machine', 'Role Ready'],
  points: 1450,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  createdAt: new Date().toISOString()
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
      const isRecruiter = email.includes('recruiter');
      const isAdmin = email.includes('admin');
      // Derive display name from email: piyush.dubey@gmail.com → Piyush Dubey
      const rawName = email.split('@')[0].replace(/[._-]/g, ' ');
      const displayName = isAdmin
        ? 'Platform Admin'
        : isRecruiter
        ? 'Recruiter Admin'
        : rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      const userType = isAdmin ? 'admin' : isRecruiter ? 'recruiter' : 'seeker';
      const user: User = {
        ...fallbackUser,
        email,
        name: displayName,
        userType: userType as User['userType']
      };
      return { token: 'mock-jwt-token', user };
    }
  },
  signup: async (name: string, email: string, rolePreference: string, userType: 'seeker' | 'recruiter') => {
    try {
      const res = await api.post('/auth/signup', { name, email, rolePreference, userType });
      return res.data;
    } catch {
      const user: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        rolePreference: rolePreference as any,
        userType,
        badges: ['New Explorer'],
        points: 500,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        createdAt: new Date().toISOString()
      };
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
      const mockRecord: ResumeRecord = {
        id: `resume-${Date.now()}`,
        userId: 'user-seeker-1',
        filename: filename || 'Uploaded_Resume.pdf',
        targetRole,
        rawText: text,
        parsedSections: {
          contact: { name: 'Alex Rivera', email: 'alex.rivera@example.com', github: 'github.com/arivera' },
          skills: ['TypeScript', 'Node.js', 'Express', 'React', 'PostgreSQL', 'Docker', 'AWS', 'Redis'],
          experience: ['Architected microservices handling 2M+ requests', 'Optimized database queries reducing latency by 42%'],
          projects: ['ResumeAI Platform', 'Distributed Key-Value Store'],
          education: ['B.S. in Computer Science | UC Berkeley']
        },
        score: targetRole === 'sde' ? 88 : 82,
        scoreBreakdown: {
          structure: 90,
          clarity: 88,
          impact: 92,
          skills: 85,
          projects: 80,
          ats: 84
        },
        feedback: [
          {
            id: 'fb-1',
            category: 'Impact',
            severity: 'success',
            title: 'Strong Metric Quantifiers',
            description: 'Contains excellent metric figures (2M+ requests, 42% latency reduction).',
            suggestion: 'Keep highlighting ROI and quantifiable backend benchmarks.'
          },
          {
            id: 'fb-2',
            category: 'Skills',
            severity: 'medium',
            title: 'Missing Microservice Keywords',
            description: 'Target roles look for GraphQL or CI/CD explicitly.',
            suggestion: 'Include container orchestration or GraphQL explicitly in the skills section.'
          }
        ],
        createdAt: new Date().toISOString()
      };
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
      return {
        matchPct: 86,
        keywordScore: 84,
        embeddingScore: 88,
        matchedKeywords: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Docker', 'AWS', 'Redis'],
        missingKeywords: ['GraphQL', 'Kubernetes', 'CI/CD'],
        missingCoreSkills: ['GraphQL', 'Kubernetes'],
        impactGapScore: 88,
        recommendations: [
          'Explicitly incorporate missing target skills: GraphQL, Kubernetes into your Skills or Experience section.',
          'Align your resume summary headline directly with the Senior Full Stack Engineer title.'
        ]
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
      const mockShortlist: RecruiterCandidate[] = [
        { id: 'c-1', recruiterJobId: 'j-1', candidateName: 'Alex Rivera', candidateEmail: 'alex@example.com', targetRole: 'sde', resumeText: 'Full Stack Engineer. Built Node.js, React, Docker microservices.', overallScore: 88, jdMatchPct: 92, status: 'Shortlisted', appliedAt: new Date().toISOString() },
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
      return {
        leaderboard: [
          { rank: 1, name: 'Alex Rivera', institution: 'UC Berkeley', score: 94, badges: ['ATS Ninja', 'Metric Machine', 'Role Ready'], avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
          { rank: 2, name: 'Priya Sharma', institution: 'Northeastern Univ', score: 91, badges: ['ML Wizard', 'Data Master'], avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100' },
          { rank: 3, name: 'Jordan Lee', institution: 'NYU Stern', score: 89, badges: ['Growth Hacker', 'CRO Pro'], avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
          { rank: 4, name: 'Samantha Wu', institution: 'Stanford Univ', score: 88, badges: ['Full Stack Ace'], avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' },
          { rank: 5, name: 'Marcus Brody', institution: 'MIT', score: 86, badges: ['System Architect'], avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }
        ]
      };
    }
  }
};
