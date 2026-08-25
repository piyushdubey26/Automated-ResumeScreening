import { Request, Response } from 'express';
import { getActiveSubscription } from '../utils/auth';
import { mockDb, JobDescriptionRecord, JDMatchRecord, saveDb } from '../utils/mockDb';
import { ParserService } from '../services/parserService';
import { JDMatchEngine } from '../services/jdMatchEngine';

export const createJD = (req: Request, res: Response) => {
  const { title, targetRole, text, requiredSkills, optionalSkills } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Job description text is required' });
  }

  const newJd: JobDescriptionRecord = {
    id: `jd-${Date.now()}`,
    recruiterId: req.user?.userId || 'user-recruiter-1',
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
  const authUserId = req.user?.userId;
  if (authUserId) {
    const userRecord = mockDb.users.find(u => u.id === authUserId);
    const activeSub = getActiveSubscription(authUserId);
    if (!activeSub && userRecord) {
      const usage = userRecord.monthlyUsage || 0;
      if (usage >= 5) {
        return res.status(403).json({
          error: 'Monthly free limit reached (5 reviews & matches). Please upgrade to a paid plan for unlimited access.'
        });
      }
    }
  }

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

  // If user is authenticated, save the match to the db
  if (authUserId) {
    const newMatch: JDMatchRecord = {
      id: `match-${Date.now()}`,
      userId: authUserId,
      resumeId: resumeId || 'latest',
      jdId: jdId || 'latest',
      jdText: jText,
      targetRole: targetRole || 'sde',
      matchPct: matchResult.matchPct,
      keywordScore: matchResult.keywordScore,
      embeddingScore: matchResult.embeddingScore,
      matchedKeywords: matchResult.matchedKeywords,
      missingKeywords: matchResult.missingKeywords,
      missingCoreSkills: matchResult.missingCoreSkills,
      impactGapScore: matchResult.impactGapScore,
      recommendations: matchResult.recommendations,
      createdAt: new Date().toISOString()
    };
    // Remove previous match for the same user if any, or keep history. Let's unshift and keep latest first.
    mockDb.jdMatches.unshift(newMatch);
    saveDb();
  }

  return res.json({
    resumeId: resumeId || 'latest',
    jdId: jdId || 'latest',
    ...matchResult
  });
};

export const getLatestMatch = (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const match = mockDb.jdMatches.find(m => m.userId === authUserId);
  if (!match) {
    return res.status(404).json({ error: 'No job matches found' });
  }
  return res.json(match);
};
