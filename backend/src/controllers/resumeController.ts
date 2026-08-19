import { mockDb, ResumeRecord, saveDb } from '../utils/mockDb';
import { ParserService } from '../services/parserService';
import { ScoringEngine } from '../services/scoringEngine';
import { AIRewriteService } from '../services/aiRewriteService';
import { AIInterviewService } from '../services/aiInterviewService';

export const uploadAndParseResume = (req: Request, res: Response) => {
  try {
    const { text, filename, targetRole } = req.body;
    const reqFile = (req as any).file;
    const rawText = text || reqFile?.buffer?.toString('utf-8') || `Alex Rivera
Email: alex.rivera@example.com | GitHub: github.com/arivera
Architected microservices in Node.js, Express, React, PostgreSQL, Docker. Reduced latency by 42%.`;

    const role = targetRole || 'sde';
    const parsed = ParserService.parseText(rawText);
    const scoreResult = ScoringEngine.evaluate(parsed, role);

    const newResume: ResumeRecord = {
      id: `resume-${Date.now()}`,
      userId: (req as any).user?.id || 'user-seeker-1',
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

    mockDb.resumes.unshift(newResume);
    saveDb();

    return res.status(201).json({
      message: 'Resume parsed and scored successfully',
      resumeId: newResume.id,
      resume: newResume
    });
  } catch (err: any) {
    console.error('Error parsing resume:', err);
    return res.status(500).json({ error: 'Failed to parse resume' });
  }
};

export const getResumeById = (req: Request, res: Response) => {
  const { id } = req.params;
  const resume = mockDb.resumes.find(r => r.id === id) || mockDb.resumes[0];
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }
  return res.json({ resume });
};

export const getResumeFeedback = (req: Request, res: Response) => {
  const { id } = req.params;
  const resume = mockDb.resumes.find(r => r.id === id) || mockDb.resumes[0];
  return res.json({ feedback: resume?.feedback || [] });
};

export const rewriteBullet = (req: Request, res: Response) => {
  const { bulletText, focusMode, targetRole } = req.body;
  const result = AIRewriteService.rewriteBullet({
    bulletText: bulletText || 'Developed microservices with Node.js and SQL.',
    focusMode: focusMode || 'quantify',
    targetRole: targetRole || 'sde'
  });
  return res.json(result);
};

export const generateMockInterview = (req: Request, res: Response) => {
  const { targetRole, resumeText, jdText } = req.body;
  const questions = AIInterviewService.generateQuestions(
    targetRole || 'sde',
    resumeText || '',
    jdText || ''
  );
  return res.json({ questions });
};
