import { ParsedResume } from './parserService';
import { AtsScoringEngine, AtsEvaluationResult } from './atsEngine';

export interface JDMatchResult {
  matchPct: number;
  keywordScore: number;
  embeddingScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingCoreSkills: string[];
  impactGapScore: number;
  recommendations: string[];
  atsEvaluation?: AtsEvaluationResult;
}

export class JDMatchEngine {
  public static match(resume: ParsedResume | string, jdText: string, targetRole: string = 'sde'): JDMatchResult {
    const rawResumeText = typeof resume === 'string'
      ? resume
      : (
        (resume.contact.name || '') + '\n' +
        (resume.sections.skills ? resume.sections.skills.join(' ') : '') + '\n' +
        (resume.sections.experience ? resume.sections.experience.join('\n') : '') + '\n' +
        (resume.sections.projects ? resume.sections.projects.join('\n') : '')
      );

    const atsResult = AtsScoringEngine.evaluate(rawResumeText, jdText, targetRole);

    const matchedKeywords = atsResult.matchedRequiredSkills.map(s => s.requirement).concat(atsResult.matchedPreferredSkills.map(s => s.requirement));
    const missingCoreSkills = atsResult.missingRequiredSkills.map(s => s.requirement);
    const missingKeywords = atsResult.missingRequiredSkills.map(s => s.requirement).concat(atsResult.missingPreferredSkills.map(s => s.requirement));

    return {
      matchPct: atsResult.overallScore,
      keywordScore: Math.round(atsResult.breakdown.keywords * 10),
      embeddingScore: Math.round(atsResult.breakdown.responsibilities * 5),
      matchedKeywords: Array.from(new Set(matchedKeywords)),
      missingKeywords: Array.from(new Set(missingKeywords)),
      missingCoreSkills: Array.from(new Set(missingCoreSkills)),
      impactGapScore: Math.round(atsResult.breakdown.evidence * 10),
      recommendations: atsResult.recommendations,
      atsEvaluation: atsResult
    };
  }
}
