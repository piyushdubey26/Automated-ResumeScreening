import { Request, Response } from 'express';
import { mockDb, ResumeRecord, saveDb } from '../utils/mockDb';
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

    let rawText = text || '';

    // Enforce authentication
    const authUserId = req.user?.userId;
    if (!authUserId) {
      return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
    }

    if (!rawText && reqFile) {
      // Validate file size (max 10MB)
      if (reqFile.size > 10 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: 'File size must be under 10MB' });
      }
      try {
        rawText = await extractTextFromBuffer(reqFile.buffer, reqFile.originalname || 'resume.pdf', reqFile.mimetype);
      } catch (err: any) {
        return res.status(400).json({ success: false, error: err.message || 'Failed to extract text from file' });
      }
    }

    if (!rawText || rawText.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'Could not extract enough text from this file. Try a different format or paste text manually.' });
    }

    const parsed = ParserService.parseText(rawText);
    const scoreResult = ScoringEngine.evaluate(parsed, role);

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

    mockDb.resumes.unshift(newResume);
    saveDb();

    return res.status(201).json({
      success: true,
      message: 'Resume parsed and scored successfully',
      resumeId: newResume.id,
      resume: newResume
    });
  } catch (err: any) {
    console.error('Error parsing resume:', err);
    return res.status(500).json({ success: false, error: 'Failed to parse resume' });
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
