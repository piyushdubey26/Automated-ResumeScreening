import { ParsedResume } from './parserService';
import { FeedbackCard } from '../utils/mockDb';

import sdeRubric from '../../../shared/rubrics/sde.json';
import dsRubric from '../../../shared/rubrics/data-science.json';
import marketingRubric from '../../../shared/rubrics/marketing.json';
import pmRubric from '../../../shared/rubrics/product-management.json';

const RUBRICS: Record<string, any> = {
  'sde': sdeRubric,
  'data-science': dsRubric,
  'marketing': marketingRubric,
  'product-management': pmRubric
};

export interface ScoreResult {
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
}

const DEFAULT_RUBRIC = {
  title: 'Target Role',
  keywords: ['typescript', 'javascript', 'node.js', 'express', 'react', 'postgresql', 'docker', 'aws', 'redis', 'git', 'python', 'java', 'sql'],
  weights: { structure: 0.2, clarity: 0.15, impact: 0.25, skills: 0.2, projects: 0.1, ats: 0.1 }
};

export class ScoringEngine {
  public static evaluate(parsed: ParsedResume, roleKey: string = 'sde'): ScoreResult {
    const rubric = RUBRICS[roleKey] || RUBRICS['sde'] || DEFAULT_RUBRIC;
    const rubricTitle = rubric?.title || 'Target Role';
    const feedback: FeedbackCard[] = [];

    // 1. Structure (20 points max)
    let structureScore = 15;
    const hasContact = parsed.contact.email && (parsed.contact.github || parsed.contact.linkedin || parsed.contact.phone);
    if (hasContact) structureScore += 3;
    if (parsed.sections.skills.length > 0) structureScore += 1;
    if (parsed.sections.experience.length > 0) structureScore += 1;

    if (!parsed.contact.github && roleKey === 'sde') {
      feedback.push({
        id: 'fb-struct-1',
        category: 'Structure',
        severity: 'medium',
        title: 'Add GitHub / Code Portfolio Link',
        description: 'Recruiters expect a link to your public code repositories for SDE roles.',
        suggestion: 'Include GitHub profile (e.g., github.com/username) in the header contact line.'
      });
    }

    // 2. Clarity (15 points max)
    let clarityScore = 10;
    if (parsed.actionVerbCount >= 4) clarityScore += 5;
    else if (parsed.actionVerbCount >= 2) clarityScore += 3;

    if (parsed.actionVerbCount < 3) {
      feedback.push({
        id: 'fb-clarity-1',
        category: 'Clarity',
        severity: 'high',
        title: 'Use Strong Action Verbs',
        description: 'Several bullet points use weak passive phrasing like "was responsible for" or "helped with".',
        suggestion: 'Begin bullet points with decisive action verbs like Architected, Engineered, Optimized, or Spearheaded.'
      });
    } else {
      feedback.push({
        id: 'fb-clarity-2',
        category: 'Clarity',
        severity: 'success',
        title: 'Strong Action Phrasing',
        description: `Found ${parsed.actionVerbCount} impactful action verbs across experience bullets.`,
        suggestion: 'Maintain action-oriented verb tense consistency.'
      });
    }

    // 3. Impact & Metrics (25 points max)
    let impactScore = 12;
    if (parsed.metricsCount >= 4) impactScore += 13;
    else if (parsed.metricsCount >= 2) impactScore += 8;
    else if (parsed.metricsCount === 1) impactScore += 4;

    if (parsed.metricsCount < 2) {
      feedback.push({
        id: 'fb-impact-1',
        category: 'Impact',
        severity: 'high',
        title: 'Missing Quantifiable Metrics',
        description: 'Bullet points list responsibilities rather than measured outcomes.',
        suggestion: 'Add hard metrics like percentage improvements, throughput scale (e.g. 10k users), or time saved.'
      });
    } else {
      feedback.push({
        id: 'fb-impact-2',
        category: 'Impact',
        severity: 'success',
        title: 'Quantified Accomplishments',
        description: `Detected ${parsed.metricsCount} metric figures (latency reductions, user numbers, percentage gains).`,
        suggestion: 'Highlight top 2 metric achievements in the resume summary.'
      });
    }

    // 4. Skills Match (20 points max)
    let skillsScore = 10;
    const requiredKeywords: string[] = rubric?.keywords || DEFAULT_RUBRIC.keywords;
    const matchedRoleKeywords = requiredKeywords.filter(kw =>
      parsed.sections.skills.map(s => s.toLowerCase()).includes(kw.toLowerCase())
    );

    const skillMatchRatio = requiredKeywords.length > 0 ? matchedRoleKeywords.length / Math.min(10, requiredKeywords.length) : 0.5;
    skillsScore += Math.min(10, Math.round(skillMatchRatio * 10));

    const missingRoleKeywords = requiredKeywords.filter(kw =>
      !parsed.sections.skills.map(s => s.toLowerCase()).includes(kw.toLowerCase())
    ).slice(0, 4);

    if (missingRoleKeywords.length > 0) {
      feedback.push({
        id: 'fb-skills-1',
        category: 'Skills',
        severity: 'medium',
        title: `Missing Essential ${rubricTitle} Keywords`,
        description: `Key industry terms missing from your skills section: ${missingRoleKeywords.join(', ')}.`,
        suggestion: `Add relevant experience or project bullets demonstrating proficiency in ${missingRoleKeywords.slice(0, 2).join(' & ')}.`
      });
    }

    // 5. Projects (10 points max)
    let projectsScore = 6;
    if (parsed.sections.projects.length >= 2) projectsScore = 10;
    else if (parsed.sections.projects.length === 1) projectsScore = 8;

    // 6. ATS Friendliness (10 points max)
    let atsScore = 8;
    if (parsed.wordCount >= 250 && parsed.wordCount <= 650) atsScore += 2;

    if (parsed.pageEstimate > 2) {
      atsScore -= 2;
      feedback.push({
        id: 'fb-ats-1',
        category: 'ATS',
        severity: 'medium',
        title: 'Page Length Warning',
        description: 'Estimated length exceeds 2 pages.',
        suggestion: 'Keep early-career resumes strictly to 1 page for maximum recruiter review efficiency.'
      });
    }

    // Weighted Overall Score calculation
    const weights = rubric?.weights || DEFAULT_RUBRIC.weights;
    const overallScore = Math.min(99, Math.round(
      (structureScore / 20) * (weights.structure * 100) +
      (clarityScore / 15) * (weights.clarity * 100) +
      (impactScore / 25) * (weights.impact * 100) +
      (skillsScore / 20) * (weights.skills * 100) +
      (projectsScore / 10) * (weights.projects * 100) +
      (atsScore / 10) * (weights.ats * 100)
    ));

    return {
      score: overallScore,
      scoreBreakdown: {
        structure: Math.round((structureScore / 20) * 100),
        clarity: Math.round((clarityScore / 15) * 100),
        impact: Math.round((impactScore / 25) * 100),
        skills: Math.round((skillsScore / 20) * 100),
        projects: Math.round((projectsScore / 10) * 100),
        ats: Math.round((atsScore / 10) * 100)
      },
      feedback
    };
  }
}
