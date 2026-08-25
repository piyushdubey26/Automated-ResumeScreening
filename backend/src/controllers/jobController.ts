import { Request, Response } from 'express';
import { mockDb, JobDescriptionRecord, saveDb } from '../utils/mockDb';
import { ParserService } from '../services/parserService';
import { JDMatchEngine } from '../services/jdMatchEngine';

export const createJD = (req: Request, res: Response) => {
  const { title, targetRole, text, requiredSkills, optionalSkills } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Job description text is required' });
  }

  const newJd: JobDescriptionRecord = {
    id: `jd-${Date.now()}`,
    recruiterId: (req as any).user?.id || 'user-recruiter-1',
    title: title || 'Full Stack Engineer',
    targetRole: targetRole || 'sde',
    text,
    requiredSkills: requiredSkills || ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Docker'],
    optionalSkills: optionalSkills || ['GraphQL', 'AWS', 'Redis'],
    createdAt: new Date().toISOString()
  };

  mockDb.jobDescriptions.unshift(newJd);
  saveDb();
  return res.status(201).json({ message: 'JD saved successfully', jdId: newJd.id, jd: newJd });
};

export const getJobs = (req: Request, res: Response) => {
  return res.json({ jobs: mockDb.jobDescriptions });
};

export const matchResumeWithJD = (req: Request, res: Response) => {
  const { resumeId, resumeText, jdId, jdText, targetRole } = req.body;

  let rText = resumeText;
  if (!rText && resumeId) {
    const r = mockDb.resumes.find(item => item.id === resumeId);
    if (r) rText = r.rawText;
  }

  let jText = jdText;
  if (!jText && jdId) {
    const j = mockDb.jobDescriptions.find(item => item.id === jdId);
    if (j) jText = j.text;
  }

  if (!rText) {
    rText = mockDb.resumes[0]?.rawText || `Alex Rivera
Email: alex.rivera@example.com
Architected microservices in Node.js, Express, React, PostgreSQL, Docker, AWS. Reduced latency by 42%.`;
  }

  if (!jText) {
    jText = mockDb.jobDescriptions[0]?.text || `Senior Full Stack Engineer. Build microservices in Node.js, Express, TypeScript, React, PostgreSQL, Docker, AWS, GraphQL, and Redis.`;
  }

  const parsedResume = ParserService.parseText(rText);
  const matchResult = JDMatchEngine.match(parsedResume, jText, targetRole || 'sde');

  return res.json({
    resumeId: resumeId || 'latest',
    jdId: jdId || 'latest',
    ...matchResult
  });
};
