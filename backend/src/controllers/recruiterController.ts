import { Request, Response } from 'express';
import { mockDb, RecruiterCandidateRecord, saveDb } from '../utils/mockDb';
import { ParserService } from '../services/parserService';
import { ScoringEngine } from '../services/scoringEngine';
import { JDMatchEngine } from '../services/jdMatchEngine';

export const bulkScreenResumes = (req: Request, res: Response) => {
  const { jdId, candidates, targetRole } = req.body;
  const jd = mockDb.jobDescriptions.find(j => j.id === jdId) || mockDb.jobDescriptions[0];
  const jdText = jd ? jd.text : 'Seeking Full Stack Engineer proficient in Node.js, React, SQL, Docker, AWS.';

  const candidatesInput = candidates && candidates.length > 0 ? candidates : [
    { name: 'Alex Rivera', email: 'alex@example.com', text: 'Full Stack Engineer with 3+ years experience. Built Node.js, React, PostgreSQL, Docker, AWS microservices.' },
    { name: 'David Chen', email: 'david@example.com', text: 'Backend Developer in Python, Django, MySQL, AWS REST APIs. Basic React.' },
    { name: 'Maria Garcia', email: 'm.garcia@example.com', text: 'Frontend Specialist in Vue.js, HTML, CSS, JavaScript. Learning Node.js.' },
    { name: 'James Wilson', email: 'james@example.com', text: 'DevOps & SDE. Kubernetes, Docker, AWS, Terraform, Go, Node.js, CI/CD.' }
  ];

  const processedList: RecruiterCandidateRecord[] = candidatesInput.map((c: any, index: number) => {
    const parsed = ParserService.parseText(c.text);
    const scoreResult = ScoringEngine.evaluate(parsed, targetRole || 'sde');
    const matchResult = JDMatchEngine.match(parsed, jdText, targetRole || 'sde');

    const status: 'Shortlisted' | 'Under Review' | 'Rejected' = matchResult.matchPct >= 80 ? 'Shortlisted' : matchResult.matchPct >= 65 ? 'Under Review' : 'Rejected';

    return {
      id: `cand-bulk-${Date.now()}-${index}`,
      recruiterJobId: jd ? jd.id : 'jd-sde-1',
      candidateName: c.name || `Candidate ${index + 1}`,
      candidateEmail: c.email || `candidate${index + 1}@example.com`,
      targetRole: targetRole || 'sde',
      resumeText: c.text,
      overallScore: scoreResult.score,
      jdMatchPct: matchResult.matchPct,
      status,
      appliedAt: new Date().toISOString()
    };
  });

  // Sort candidates by match % descending
  processedList.sort((a, b) => b.jdMatchPct - a.jdMatchPct);

  // Update recruiterCandidates in mockDb
  mockDb.recruiterCandidates = [...processedList, ...mockDb.recruiterCandidates];
  saveDb();

  return res.json({
    message: `Screened ${processedList.length} candidates successfully`,
    shortlist: processedList
  });
};

export const getRecruiterShortlist = (req: Request, res: Response) => {
  const { jdId } = req.params;
  let candidates = mockDb.recruiterCandidates;
  if (jdId && jdId !== 'all') {
    candidates = candidates.filter(c => c.recruiterJobId === jdId);
  }
  return res.json({ candidates });
};

export const updateCandidateStatus = (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const candidate = mockDb.recruiterCandidates.find(c => c.id === id);
  if (!candidate) {
    return res.status(404).json({ error: 'Candidate not found' });
  }

  candidate.status = status;
  return res.json({ message: 'Status updated successfully', candidate });
};
