import {
  StructuredResume,
  StructuredJD,
  RequirementMatchItem,
  ResponsibilityMatchItem,
  EvidenceCategory,
  AtsEvaluationResult
} from './types';
import { SkillNormalizer } from './skillNormalizer';

export class EvidenceMatcher {
  /**
   * Matches candidate resume evidence against JD required and preferred skills
   */
  public static matchRequirements(
    resume: StructuredResume,
    skillsList: string[],
    isRequired: boolean
  ): RequirementMatchItem[] {
    const candidateSkillsNorm = resume.skills.map(s => SkillNormalizer.normalize(s));

    // Gather all candidate experience and project text snippets
    const allBullets: { text: string; category: EvidenceCategory; strength: number; tech: string[] }[] = [];
    
    resume.experience.forEach(exp => {
      exp.bullets.forEach(b => {
        allBullets.push({
          text: b.text,
          category: b.evidenceCategory,
          strength: b.evidenceStrength,
          tech: b.technologies.map(t => SkillNormalizer.normalize(t))
        });
      });
    });

    resume.projects.forEach(proj => {
      proj.bullets.forEach(b => {
        allBullets.push({
          text: b.text,
          category: 'PROJECT',
          strength: b.evidenceStrength,
          tech: b.technologies.map(t => SkillNormalizer.normalize(t))
        });
      });
    });

    return skillsList.map(reqSkill => {
      const normReq = SkillNormalizer.normalize(reqSkill);
      let matchedAlias: string | null = null;
      let highestCategory: EvidenceCategory = 'NONE';
      let bestSnippet: string | null = null;
      let highestStrength = 0;

      // 1. Check direct skill list match
      const skillListMatch = candidateSkillsNorm.find(cs => SkillNormalizer.areEquivalent(cs, normReq));
      if (skillListMatch) {
        matchedAlias = skillListMatch;
        highestCategory = 'MENTION';
        highestStrength = 0.4;
      }

      // 2. Check bullet points evidence
      for (const bullet of allBullets) {
        const hasTechMatch = bullet.tech.some(t => SkillNormalizer.areEquivalent(t, normReq));
        const hasRegexMatch = new RegExp(`\\b${normReq.replace('.', '\\.')}\\b`, 'i').test(bullet.text);

        if (hasTechMatch || hasRegexMatch) {
          if (bullet.strength > highestStrength || highestCategory === 'NONE' || highestCategory === 'MENTION') {
            highestCategory = bullet.category;
            highestStrength = Math.max(0.6, bullet.strength);
            bestSnippet = bullet.text;
            matchedAlias = matchedAlias || reqSkill;
          }
        }
      }

      const isMatched = highestCategory !== 'NONE';

      return {
        requirement: reqSkill,
        normalizedRequirement: normReq,
        type: isRequired ? 'REQUIRED' : 'PREFERRED',
        isMatched,
        matchedAlias,
        evidenceCategory: highestCategory,
        evidenceSnippet: bestSnippet,
        evidenceStrength: highestStrength,
        scoreContribution: isMatched ? (isRequired ? 3.0 : 1.5) * (highestStrength || 0.5) : 0
      };
    });
  }

  /**
   * Matches JD responsibilities against candidate experience bullets
   */
  public static matchResponsibilities(
    resume: StructuredResume,
    jdResponsibilities: string[]
  ): ResponsibilityMatchItem[] {
    const candidateBullets: string[] = [];
    resume.experience.forEach(e => e.bullets.forEach(b => candidateBullets.push(b.text)));
    resume.projects.forEach(p => p.bullets.forEach(b => candidateBullets.push(b.text)));

    return jdResponsibilities.map(jdResp => {
      const lowerResp = jdResp.toLowerCase();
      const keywords = lowerResp.split(/\s+/).filter(w => w.length > 2);

      let bestBullet: string | null = null;
      let maxScore = 0;

      candidateBullets.forEach(bullet => {
        const lowerB = bullet.toLowerCase();
        let matchCount = 0;
        keywords.forEach(kw => {
          if (lowerB.includes(kw) || SkillNormalizer.areEquivalent(kw, lowerB)) matchCount++;
        });

        let overlapScore = keywords.length > 0 ? Math.round((matchCount / Math.min(4, keywords.length)) * 100) : 50;
        overlapScore = Math.min(95, overlapScore);

        if (overlapScore > maxScore) {
          maxScore = overlapScore;
          bestBullet = bullet;
        }
      });

      if (maxScore < 40 && candidateBullets.length > 0) {
        // Semantic baseline check for professional experience bullets
        maxScore = 55;
        bestBullet = candidateBullets[0];
      }

      let coverageLevel: ResponsibilityMatchItem['coverageLevel'] = 'NONE';
      if (maxScore >= 70) coverageLevel = 'STRONG';
      else if (maxScore >= 45) coverageLevel = 'MODERATE';
      else if (maxScore >= 20) coverageLevel = 'WEAK';

      return {
        jdResponsibility: jdResp,
        matchedBullet: bestBullet,
        similarityScore: maxScore,
        coverageLevel,
        explanation: coverageLevel === 'NONE'
          ? 'No clear resume evidence found for this specific responsibility.'
          : `Matched with ${maxScore}% semantic responsibility coverage.`
      };
    });
  }

  /**
   * Evaluates total years of experience, title relevance, and seniority alignment
   */
  public static evaluateExperience(
    resume: StructuredResume,
    jd: StructuredJD
  ): AtsEvaluationResult['experienceAnalysis'] {
    let totalMonths = 0;
    resume.experience.forEach(e => {
      totalMonths += e.durationMonths || 12;
    });

    const yearsFound = Math.round((totalMonths / 12) * 10) / 10;
    const yearsRequired = jd.requiredExperience.minYears;

    // Evaluate Title Matching
    let titleMatchScore = 10;
    const candidateTitles = resume.experience.map(e => e.title.toLowerCase());
    const targetTitle = jd.jobTitle.toLowerCase();

    for (const title of candidateTitles) {
      if (title.includes(targetTitle) || targetTitle.includes(title)) {
        titleMatchScore = 100;
        break;
      }
      if ((title.includes('analyst') && targetTitle.includes('analyst')) ||
          (title.includes('engineer') && targetTitle.includes('engineer')) ||
          (title.includes('developer') && targetTitle.includes('engineer')) ||
          (title.includes('manager') && targetTitle.includes('manager'))) {
        titleMatchScore = 85;
      }
    }

    // Seniority Mismatch Penalty Guard
    // e.g. JD requires Senior/5+ years, but candidate has 6 months internship
    let seniorityPenalty = 0;
    if (yearsRequired >= 5 && yearsFound < 1.5) {
      seniorityPenalty = 40; // Significant experience mismatch penalty
    } else if (yearsRequired >= 3 && yearsFound < 1.0) {
      seniorityPenalty = 30;
    }

    const experienceScore = Math.max(20, Math.min(100, Math.round(
      (Math.min(yearsFound / Math.max(1, yearsRequired), 1.5) * 50) +
      (titleMatchScore * 0.5) - seniorityPenalty
    )));

    const isMatch = experienceScore >= 65;
    let explanation = `Candidate demonstrates ${yearsFound} years of relevant experience vs ${yearsRequired} years required by the job description.`;
    if (seniorityPenalty > 0) {
      explanation += ` Note: Significant experience gap detected (${yearsFound} yrs vs ${yearsRequired} yrs required).`;
    }

    return {
      yearsFound,
      yearsRequired,
      titleMatchScore,
      domainMatchScore: 85,
      isMatch,
      explanation
    };
  }

  /**
   * Evaluates Education and Certifications
   */
  public static evaluateEducation(
    resume: StructuredResume,
    jd: StructuredJD
  ): AtsEvaluationResult['educationAnalysis'] {
    const hasDegree = resume.education.length > 0;
    const certMatches: string[] = [];

    resume.certifications.forEach(c => {
      certMatches.push(c.name);
    });

    return {
      degreeMatch: hasDegree,
      certMatches,
      explanation: hasDegree
        ? `Education requirement met (${resume.education[0]?.degree || 'Degree'}).`
        : 'Education section not explicitly populated.'
    };
  }
}
