import { Request, Response } from 'express';
import { getActiveSubscription } from '../utils/auth';
import { mockDb, ResumeRecord, UserApplication, saveDb } from '../utils/mockDb';
import { ParserService } from '../services/parserService';
import { ScoringEngine } from '../services/scoringEngine';
import { AIRewriteService } from '../services/aiRewriteService';
import { AIInterviewService } from '../services/aiInterviewService';
import { extractTextFromBuffer } from '../utils/fileExtractor';

export const uploadAndParseResume = async (req: Request, res: Response) => {
  try {
    const { text, filename, targetRole } = req.body;
    const reqFile = (req as any).file;
    const role = targetRole || 'sde';

    // Enforce authentication
    const authUserId = req.user?.userId;
    if (!authUserId) {
      return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
    }

    let rawText = text || '';

    if (!rawText && !reqFile) {
      return res.status(400).json({ success: false, error: 'No resume text or file uploaded.' });
    }

    if (reqFile) {
      // Validate file size (max 10MB)
      if (reqFile.size > 10 * 1024 * 1024) {
        return res.status(413).json({ success: false, error: 'File size exceeds maximum limit of 10MB.' });
      }

      try {
        rawText = await extractTextFromBuffer(reqFile.buffer, reqFile.originalname || 'resume.pdf', reqFile.mimetype || '');
      } catch (err: any) {
        console.error('Text extraction failed during resume upload:', err);
        const isUnsupported = err.message?.includes('Unsupported file type');
        return res.status(isUnsupported ? 415 : 422).json({
          success: false,
          error: isUnsupported ? 'Unsupported file type.' : (err.message || 'Failed to extract text from file.')
        });
      }
    }

    if (!rawText || rawText.trim().length < 10) {
      return res.status(422).json({
        success: false,
        error: 'Could not extract enough text from this file. Try a different format or paste text manually.'
      });
    }

    const userRecord = mockDb.users.find(u => u.id === authUserId);
    if (!userRecord) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    // Monthly period calculation & auto reset for new calendar month
    const d = new Date();
    const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (userRecord.usageMonth !== currentMonth) {
      userRecord.usageMonth = currentMonth;
      userRecord.monthlyUsage = 0;
    }

    const activeSub = getActiveSubscription(authUserId);
    const isPaidPlan = userRecord.plan === 'job_seeker_pro' || 
                       userRecord.plan === 'career-max' || 
                       userRecord.plan === 'pro' || 
                       userRecord.userType === 'recruiter' || 
                       userRecord.userType === 'admin' || 
                       (activeSub && activeSub.status === 'active');

    // Strict Backend Entitlement Enforcement
    if (!isPaidPlan) {
      const currentUsage = userRecord.monthlyUsage || 0;
      if (currentUsage >= 5) {
        return res.status(403).json({
          success: false,
          code: 'LIMIT_REACHED',
          error: "Monthly resume review limit reached (5 reviews). Upgrade your plan to continue.",
          usage: {
            used: currentUsage,
            limit: 5,
            remaining: 0,
            isUnlimited: false
          }
        });
      }
    }

    const parsed = ParserService.parseText(rawText);
    const scoreResult = ScoringEngine.evaluate(parsed, role);

    // Increment usage ONLY upon successful review for Free tier users
    if (!isPaidPlan) {
      userRecord.monthlyUsage = (userRecord.monthlyUsage || 0) + 1;
    }

    const newResume: ResumeRecord = {
      id: `resume-${Date.now()}`,
      userId: authUserId,
      filename: filename || reqFile?.originalname || 'Uploaded_Resume.pdf',
      targetRole: role,
      rawText,
      parsedSections: {
        contact: parsed.contact,
        skills: parsed.sections.skills,
        experience: parsed.sections.experience,
        projects: parsed.sections.projects,
        education: parsed.sections.education
      },
      score: scoreResult.score,
      scoreBreakdown: scoreResult.scoreBreakdown,
      feedback: scoreResult.feedback,
      createdAt: new Date().toISOString()
    };

    mockDb.resumes = [newResume, ...mockDb.resumes.filter(r => r.id !== newResume.id)];
    saveDb();

    const finalUsage = userRecord.monthlyUsage || 0;

    return res.status(201).json({
      success: true,
      message: 'Resume parsed and scored successfully',
      resumeId: newResume.id,
      resume: newResume,
      usage: {
        used: finalUsage,
        limit: isPaidPlan ? null : 5,
        remaining: isPaidPlan ? null : Math.max(0, 5 - finalUsage),
        isUnlimited: isPaidPlan
      }
    });
  } catch (err: any) {
    console.error('CRITICAL BACKEND ERROR in uploadAndParseResume:', err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected server error occurred while processing the upload.'
    });
  }
};

export const getResumeById = (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  const { id } = req.params;
  const resume = mockDb.resumes.find(r => r.id === id && r.userId === authUserId);
  if (!resume) {
    return res.status(404).json({ success: false, error: 'Resume not found' });
  }
  return res.json({ success: true, resume });
};

export const getLatestResume = async (req: Request, res: Response) => {
  try {
    const authUserId = req.user?.userId;
    if (!authUserId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userResumes = mockDb.resumes
      .filter(r => r.userId === authUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (userResumes.length === 0) {
      return res.json({ success: true, resume: null });
    }

    return res.json({
      success: true,
      resume: userResumes[0]
    });
  } catch (err: any) {
    console.error('Error fetching latest resume:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch latest resume' });
  }
};

export const getResumeFeedback = (req: Request, res: Response) => {
  const { id } = req.params;
  const resume = mockDb.resumes.find(r => r.id === id) || mockDb.resumes[0];
  return res.json({ feedback: resume?.feedback || [] });
};

export const rewriteBullet = (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const activeSub = getActiveSubscription(authUserId);
  if (!activeSub) {
    return res.status(403).json({ error: 'Upgrade required: AI Bullet Rewriter is a premium feature.' });
  }

  const { bulletText, focusMode, targetRole } = req.body;
  const result = AIRewriteService.rewriteBullet({
    bulletText: bulletText || 'Developed microservices with Node.js and SQL.',
    focusMode: focusMode || 'quantify',
    targetRole: targetRole || 'sde'
  });
  return res.json(result);
};

export const generateMockInterview = (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const activeSub = getActiveSubscription(authUserId);
  if (!activeSub) {
    return res.status(403).json({ error: 'Upgrade required: AI Mock Interview is a premium feature.' });
  }

  const { targetRole, resumeText, jdText } = req.body;
  const questions = AIInterviewService.generateQuestions(
    targetRole || 'sde',
    resumeText || '',
    jdText || ''
  );
  return res.json({ questions });
};

export const getApplications = (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const apps = mockDb.applications.filter(a => a.userId === authUserId);
  return res.json({ applications: apps });
};

export const addApplication = (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const activeSub = getActiveSubscription(authUserId);
  if (!activeSub) {
    return res.status(403).json({ error: 'Upgrade required: Tracking job applications is a premium feature.' });
  }
  const { role, company, status, notes } = req.body;
  if (!role || !company) {
    return res.status(400).json({ error: 'Role and company are required' });
  }
  const newApp: UserApplication = {
    id: `app-${Date.now()}`,
    userId: authUserId,
    company,
    role,
    status: status || 'Applied',
    appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    notes
  };
  mockDb.applications.unshift(newApp);
  saveDb();
  return res.status(201).json({ success: true, application: newApp });
};

export const deleteApplication = (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { id } = req.params;
  const index = mockDb.applications.findIndex(a => a.id === id && a.userId === authUserId);
  if (index === -1) {
    return res.status(404).json({ error: 'Application not found' });
  }
  mockDb.applications.splice(index, 1);
  saveDb();
  return res.json({ success: true });
};
