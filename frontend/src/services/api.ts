import axios from 'axios';
import type {
  ResumeRecord,
  JDMatchResult,
  RewriteResult,
  InterviewQuestion,
  RecruiterCandidate,
  LeaderboardEntry,
  FeedbackCard,
  UserApplication
} from '../types';
export const SKILLS_BY_ROLE = {
  sde: ['typescript', 'javascript', 'node.js', 'node', 'express', 'react', 'postgresql', 'postgres', 'docker', 'aws', 'redis', 'rest api', 'git', 'graphql', 'kubernetes', 'python', 'java', 'c++', 'go', 'sql', 'html', 'css'],
  'data-science': ['python', 'pytorch', 'tensorflow', 'scikit-learn', 'pandas', 'numpy', 'sql', 'a/b testing', 'docker', 'aws', 'sagemaker', 'machine learning', 'deep learning', 'nlp', 'statistics', 'spark', 'etl'],
  marketing: ['seo', 'sem', 'paid social', 'google analytics', 'ga4', 'hubspot', 'a/b testing', 'figma', 'copywriting', 'cac', 'ltv', 'roas', 'ads', 'social media', 'email marketing'],
  'product-management': ['agile', 'scrum', 'roadmap', 'product strategy', 'jira', 'user stories', 'prd', 'wireframes', 'metrics', 'analytics', 'market research', 'product launch']
};

const ACTION_VERBS = ['achieved', 'analyzed', 'architected', 'built', 'created', 'designed', 'developed', 'engineered', 'formulated', 'implemented', 'improved', 'increased', 'led', 'managed', 'optimized', 'reduced', 'scaled'];

const getApiBase = () => {
  let envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
  }
  // Default to relative /api (proxied in Vite dev, native on Vercel production)
  return '/api';
};

const API_BASE = getApiBase();

export const api = axios.create({
  baseURL: API_BASE
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('resumeai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});



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



export const TECH_ALIASES: Record<string, string[]> = {
  'javascript': ['js', 'javascript', 'javascript.js'],
  'typescript': ['ts', 'typescript', 'typescript.js'],
  'react': ['react', 'react.js', 'reactjs'],
  'next.js': ['next.js', 'nextjs', 'next'],
  'node.js': ['node.js', 'nodejs', 'node'],
  'postgresql': ['postgresql', 'postgres', 'postgresql database'],
  'aws': ['aws', 'amazon web services', 'amazon web service'],
  'docker': ['docker', 'docker container', 'containers'],
  'kubernetes': ['kubernetes', 'k8s'],
  'graphql': ['graphql', 'gql']
};

const checkSkillMatched = (text: string, skill: string): boolean => {
  const lowerText = text.toLowerCase();
  const cleanSkill = skill.toLowerCase().trim();
  
  let searchTerms = [cleanSkill];
  for (const [canonical, aliases] of Object.entries(TECH_ALIASES)) {
    if (canonical === cleanSkill || aliases.includes(cleanSkill)) {
      searchTerms = [canonical, ...aliases];
      break;
    }
  }

  return searchTerms.some(term => {
    const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(lowerText);
  });
};

const parseYearsRequired = (jdText: string): number => {
  const matches = jdText.match(/(\d+)\s*\+?\s*years?/i);
  if (matches) {
    return parseInt(matches[1], 10);
  }
  return 0;
};

const parseCandidateYears = (resumeText: string): number => {
  const matches = resumeText.match(/(\d+)\s*\+?\s*years?\s+(?:of\s+)?experience/i);
  if (matches) {
    return parseInt(matches[1], 10);
  }
  const durMatches = resumeText.matchAll(/(?:20\d{2}|19\d{2})\s*-\s*(?:20\d{2}|19\d{2}|present)/gi);
  let calculated = 0;
  for (const match of durMatches) {
    const parts = match[0].split('-');
    const start = parseInt(parts[0].trim(), 10);
    const endStr = parts[1].trim().toLowerCase();
    const end = endStr === 'present' ? new Date().getFullYear() : parseInt(endStr, 10);
    calculated += Math.max(0, end - start);
  }
  if (calculated > 0) return Math.min(20, calculated);
  return 1;
};

const extractJDSkills = (jdText: string, targetRole: string) => {
  const lowerJD = jdText.toLowerCase();
  const roleSkills = SKILLS_BY_ROLE[targetRole as keyof typeof SKILLS_BY_ROLE] || SKILLS_BY_ROLE.sde;
  const required: string[] = [];
  const preferred: string[] = [];
  
  roleSkills.forEach(skill => {
    const escapes = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapes}\\b`, 'i');
    if (regex.test(lowerJD)) {
      const index = lowerJD.indexOf(skill.toLowerCase());
      const prefix = lowerJD.substring(Math.max(0, index - 200), index);
      const isPreferred = prefix.includes('preferred') || 
                          prefix.includes('nice to have') || 
                          prefix.includes('plus') || 
                          prefix.includes('bonus') ||
                          prefix.includes('desired');
      if (isPreferred) {
        preferred.push(skill);
      } else {
        required.push(skill);
      }
    }
  });

  if (required.length === 0) {
    required.push(...roleSkills.slice(0, 3));
  }
  return { required, preferred };
};

export const evaluateResumeAgainstJD = (resumeText: string, jdText: string, targetRole: string): JDMatchResult => {
  const lowerResume = resumeText.toLowerCase();
  const { required, preferred } = extractJDSkills(jdText, targetRole);

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const partialSkills: string[] = [];

  required.forEach(skill => {
    if (checkSkillMatched(resumeText, skill)) {
      matchedSkills.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    } else {
      missingSkills.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }
  });

  preferred.forEach(skill => {
    if (checkSkillMatched(resumeText, skill)) {
      matchedSkills.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    } else {
      missingSkills.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }
  });

  const requiredYears = parseYearsRequired(jdText);
  const candidateYears = parseCandidateYears(resumeText);
  
  let experienceScore = 100;
  if (requiredYears > 0) {
    if (candidateYears >= requiredYears) {
      experienceScore = 100;
    } else {
      experienceScore = Math.round((candidateYears / requiredYears) * 100);
      partialSkills.push(`${requiredYears}+ years experience required (Resume shows ~${candidateYears} years)`);
    }
  }

  const totalRequired = required.length;
  const matchedRequiredCount = required.filter(s => matchedSkills.map(ms => ms.toLowerCase()).includes(s.toLowerCase())).length;
  const requiredSkillsScore = totalRequired > 0 ? Math.round((matchedRequiredCount / totalRequired) * 100) : 100;

  const totalPreferred = preferred.length;
  const matchedPreferredCount = preferred.filter(s => matchedSkills.map(ms => ms.toLowerCase()).includes(s.toLowerCase())).length;
  const preferredSkillsScore = totalPreferred > 0 ? Math.round((matchedPreferredCount / totalPreferred) * 100) : 100;

  const matchedVerbs = ACTION_VERBS.filter(verb => new RegExp(`\\b${verb}\\b`, 'i').test(lowerResume));
  const responsibilitiesScore = Math.min(100, Math.round(50 + (matchedVerbs.length / 8) * 50));

  const metricsMatches = resumeText.match(/\d+%/g) || resumeText.match(/\d+\s*%/g) || resumeText.match(/\$\d+/g) || resumeText.match(/\b\d+\+\b/g);
  const projectsScore = metricsMatches ? Math.min(100, Math.round(40 + metricsMatches.length * 15)) : 40;

  const hasDegree = lowerResume.includes('degree') || lowerResume.includes('bachelor') || lowerResume.includes('master') || lowerResume.includes('btech') || lowerResume.includes('b.s.') || lowerResume.includes('university') || lowerResume.includes('college');
  const educationScore = hasDegree ? 100 : 50;

  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  const hasPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\+\d+/.test(resumeText);
  const resumeLines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
  const atsScore = Math.round((hasEmail ? 50 : 0) + (hasPhone ? 30 : 0) + (resumeLines.length >= 10 ? 20 : 0));

  const finalScore = Math.round(
    requiredSkillsScore * 0.40 +
    experienceScore * 0.20 +
    responsibilitiesScore * 0.15 +
    preferredSkillsScore * 0.10 +
    projectsScore * 0.10 +
    educationScore * 0.05
  );

  const criticalGaps: string[] = [];
  const recommendations: string[] = [];

  required.forEach(skill => {
    if (!matchedSkills.map(ms => ms.toLowerCase()).includes(skill.toLowerCase())) {
      criticalGaps.push(`${skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`);
      recommendations.push(`Explicitly incorporate the missing keyword: "${skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}" in your Skills or Experience section.`);
    }
  });

  if (requiredYears > 0 && candidateYears < requiredYears) {
    criticalGaps.push(`Seniority Gap: JD requires ${requiredYears}+ years, but resume shows ~${candidateYears} years`);
    recommendations.push(`Highlight key leadership tasks or high-impact projects to compensate for the ${requiredYears - candidateYears} year experience gap.`);
  }

  let explanation = `Your match score is ${finalScore}% because you match ${matchedRequiredCount} out of ${totalRequired} required core skills (${matchedSkills.slice(0, 3).join(', ') || 'none'}).`;
  if (requiredYears > 0 && candidateYears < requiredYears) {
    explanation += ` Additionally, the target job description requires ${requiredYears}+ years of experience and your resume shows approximately ${candidateYears} years.`;
  } else if (requiredYears > 0) {
    explanation += ` Your experience level (~${candidateYears} years) meets the target requirement of ${requiredYears}+ years.`;
  }
  if (criticalGaps.length > 0) {
    explanation += ` Consider adding evidence of "${criticalGaps.slice(0, 2).map(g => g.split(' ')[0]).join(', ')}" to boost your compatibility score.`;
  }

  return {
    matchPct: finalScore,
    keywordScore: requiredSkillsScore,
    embeddingScore: Math.round(finalScore * 0.95),
    matchedKeywords: matchedSkills,
    missingKeywords: missingSkills,
    missingCoreSkills: missingSkills.slice(0, 3),
    impactGapScore: 100 - finalScore,
    recommendations: recommendations.length > 0 ? recommendations : ['Highlight experience where you worked with target technologies.'],
    scoreBreakdown: {
      requiredSkills: requiredSkillsScore,
      experience: experienceScore,
      responsibilities: responsibilitiesScore,
      preferredSkills: preferredSkillsScore,
      projects: projectsScore,
      ats: atsScore
    },
    criticalGaps,
    partialSkills,
    explanation
  };
};

export const evaluateResumeHealth = (text: string, targetRole: string) => {
  const lowerText = text.toLowerCase();
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const githubMatch = text.match(/(github\.com\/[a-zA-Z0-9_-]+)/i);
  const linkedinMatch = text.match(/(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i);
  
  let structureScore = 50;
  if (emailMatch) structureScore += 25;
  if (githubMatch || linkedinMatch) structureScore += 25;
  structureScore = Math.min(100, structureScore);

  const feedback: FeedbackCard[] = [];
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

  const verbsFound = ACTION_VERBS.filter(verb => new RegExp(`\\b${verb}\\b`, 'i').test(lowerText));
  const clarityScore = Math.min(100, Math.round(50 + (verbsFound.length / 5) * 50));
  
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

  const metricsMatches = text.match(/\d+%/g) || text.match(/\d+\s*%/g) || text.match(/\$\d+/g) || text.match(/\b\d+\+\b/g);
  const impactScore = metricsMatches ? Math.min(100, Math.round(40 + metricsMatches.length * 15)) : 40;

  if (!metricsMatches || metricsMatches.length < 3) {
    feedback.push({
      id: 'fb-impact-2',
      category: 'Impact',
      severity: 'high',
      title: 'Weak Metric Quantifiers',
      description: 'Very few metrics (percentages, dollar values, user counts) were detected in your resume bullet points.',
      suggestion: 'Quantify your impact. For example: "built API" -> "built API handling 10k+ requests, reducing latency by 20%".'
    });
  } else {
    feedback.push({
      id: 'fb-impact-1',
      category: 'Impact',
      severity: 'success',
      title: 'Strong Metric Quantifiers',
      description: `Detected ${metricsMatches.length} metrics showing quantified achievements.`,
      suggestion: 'Keep highlighting ROI and quantifiable benchmarks.'
    });
  }

  const roleSkills = SKILLS_BY_ROLE[targetRole as keyof typeof SKILLS_BY_ROLE] || SKILLS_BY_ROLE.sde;
  const foundSkills: string[] = [];
  roleSkills.forEach(skill => {
    if (checkSkillMatched(text, skill)) {
      foundSkills.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }
  });
  const skillScore = Math.min(100, Math.round(50 + (foundSkills.length / Math.max(1, roleSkills.length)) * 50));

  const missingSkills = roleSkills.filter(s => !foundSkills.map(fs => fs.toLowerCase()).includes(s.toLowerCase()));
  if (missingSkills.length > 0) {
    feedback.push({
      id: 'fb-skills-1',
      category: 'Skills',
      severity: 'medium',
      title: `Missing ${targetRole.toUpperCase()} Skills`,
      description: `Your resume is missing keywords: ${missingSkills.slice(0, 3).map(s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ')}.`,
      suggestion: `Explicitly add missing skills like: ${missingSkills.slice(0, 3).map(s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ')} to your Skills section.`
    });
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const projectLines = lines.filter(l => l.toLowerCase().includes('project') || l.toLowerCase().includes('resumeai'));
  const projectsScore = projectLines.length > 0 ? 100 : 50;

  const atsScore = Math.round((emailMatch ? 50 : 0) + (githubMatch || linkedinMatch ? 30 : 0) + (lines.length >= 10 ? 20 : 0));

  const score = Math.round(
    structureScore * 0.20 +
    clarityScore * 0.20 +
    impactScore * 0.20 +
    skillScore * 0.20 +
    projectsScore * 0.10 +
    atsScore * 0.10
  );

  return {
    score,
    scoreBreakdown: {
      structure: structureScore,
      clarity: clarityScore,
      impact: impactScore,
      skills: skillScore,
      projects: projectsScore,
      ats: atsScore
    },
    feedback,
    foundSkills
  };
};

export const authApi = {
  login: async (email: string, password?: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  resetPassword: async (email: string, newPassword?: string) => {
    const res = await api.post('/auth/reset-password', { email, newPassword });
    return res.data;
  },
  signup: async (name: string, email: string, rolePreference: string, userType: 'seeker' | 'recruiter', password?: string) => {
    const res = await api.post('/auth/signup', { name, email, rolePreference, userType, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  updateProfile: async (profileData: { rolePreference?: string; profileLinks?: any; points?: number; badges?: string[]; interviewScore?: number | null }) => {
    const res = await api.put('/auth/profile', profileData);
    return res.data;
  },
  getAllUsers: async () => {
    const res = await api.get('/auth/users');
    return res.data;
  },
  updateSubscription: async (userId: string, plan: string, subscriptionStatus: string) => {
    const res = await api.put(`/auth/users/${userId}/subscription`, { plan, subscriptionStatus });
    return res.data;
  },
  getSubscription: async () => {
    const res = await api.get('/auth/subscription');
    return res.data;
  },
  purchaseSubscription: async (planId: string) => {
    const res = await api.post('/auth/subscription/purchase', { planId });
    return res.data;
  },
  cancelSubscription: async () => {
    const res = await api.post('/auth/subscription/cancel');
    return res.data;
  },
  reactivateSubscription: async () => {
    const res = await api.post('/auth/subscription/reactivate');
    return res.data;
  }
};

export const resumeApi = {
  uploadAndParse: async (text: string, filename?: string, targetRole: string = 'sde'): Promise<{ resume: ResumeRecord }> => {
    const res = await api.post('/resumes/upload', { text, filename, targetRole });
    return res.data;
  },
  getLatest: async (): Promise<{ resume: ResumeRecord | null }> => {
    try {
      const res = await api.get('/resumes/latest');
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return { resume: null };
      }
      throw err;
    }
  },
  rewriteBullet: async (bulletText: string, focusMode: string, targetRole: string): Promise<RewriteResult> => {
    const res = await api.post('/resumes/rewrite', { bulletText, focusMode, targetRole });
    return res.data;
  },
  generateMockInterview: async (targetRole: string, resumeText?: string, jdText?: string): Promise<{ questions: InterviewQuestion[] }> => {
    const res = await api.post('/resumes/mock-interview', { targetRole, resumeText, jdText });
    return res.data;
  },
  getApplications: async (): Promise<{ applications: UserApplication[] }> => {
    const res = await api.get('/resumes/applications');
    return res.data;
  },
  addApplication: async (application: { role: string; company: string; status: string; notes?: string }): Promise<{ success: boolean; application: UserApplication }> => {
    const res = await api.post('/resumes/applications', application);
    return res.data;
  },
  deleteApplication: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/resumes/applications/${id}`);
    return res.data;
  }
};

export const jobApi = {
  matchJD: async (resumeText: string, jdText: string, targetRole: string = 'sde'): Promise<JDMatchResult> => {
    const res = await api.post('/jobs/match', { resumeText, jdText, targetRole });
    return res.data;
  },
  getLatestMatch: async (): Promise<JDMatchResult | null> => {
    try {
      const res = await api.get('/jobs/latest-match');
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }
};

export const recruiterApi = {
  bulkScreen: async (candidates: any[], jdText?: string, targetRole: string = 'sde'): Promise<{ shortlist: RecruiterCandidate[] }> => {
    const res = await api.post('/recruiter/bulk-screen', { candidates, jdText, targetRole });
    return res.data;
  }
};

export const ecosystemApi = {
  getLeaderboard: async (): Promise<{ leaderboard: LeaderboardEntry[] }> => {
    const res = await api.get('/ecosystem/leaderboard');
    return res.data;
  }
};
