import { ParsedResume } from './parserService';

export interface JDMatchResult {
  matchPct: number;
  keywordScore: number;
  embeddingScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingCoreSkills: string[];
  impactGapScore: number;
  recommendations: string[];
}

export class JDMatchEngine {
  public static match(resume: ParsedResume, jdText: string, targetRole: string = 'sde'): JDMatchResult {
    const jdLower = jdText.toLowerCase();
    const resumeTextLower = (
      (resume.contact.name || '') + ' ' +
      resume.sections.skills.join(' ') + ' ' +
      resume.sections.experience.join(' ') + ' ' +
      resume.sections.projects.join(' ')
    ).toLowerCase();

    // Extract potential skills/keywords from JD text
    const commonTechKeywords = [
      'typescript', 'javascript', 'node.js', 'express', 'react', 'next.js', 'postgresql',
      'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'graphql', 'rest api', 'python',
      'pytorch', 'tensorflow', 'pandas', 'scikit-learn', 'a/b testing', 'seo', 'sem',
      'google analytics', 'microservices', 'system design', 'agile', 'scrum', 'ci/cd',
      'jest', 'cypress', 'sql', 'git', 'figma'
    ];

    const jdKeywords = commonTechKeywords.filter(kw => {
      const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
      return regex.test(jdLower);
    });

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    jdKeywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
      if (regex.test(resumeTextLower)) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    // Calculate Keyword Overlap Score (0 - 100)
    const keywordScore = jdKeywords.length > 0
      ? Math.round((matchedKeywords.length / jdKeywords.length) * 100)
      : 75;

    // Simulate Cosine Similarity / Semantic Embedding Score based on vocabulary overlap & length
    const semanticOverlapRatio = Math.min(1.0, (matchedKeywords.length * 1.5 + resume.metricsCount * 2) / Math.max(1, jdKeywords.length + 5));
    const embeddingScore = Math.round(55 + semanticOverlapRatio * 40);

    // Weighted Overall Match Percentage: Keyword overlap (50%) + Semantic Embedding (50%)
    const matchPct = Math.min(98, Math.max(25, Math.round(keywordScore * 0.5 + embeddingScore * 0.5)));

    // Categorize missing core vs optional skills
    const missingCoreSkills = missingKeywords.slice(0, 4);

    // Impact Gap Score: does JD ask for scaling/metrics while resume lacks them?
    const hasJdScaleTerms = /\b(scale|throughput|millions|latency|roi|growth|optimization|percent|high availability)\b/i.test(jdText);
    const impactGapScore = hasJdScaleTerms && resume.metricsCount < 2 ? 65 : 90;

    // Generate actionable recommendations
    const recommendations: string[] = [];
    if (missingCoreSkills.length > 0) {
      recommendations.push(`Explicitly incorporate target skills: ${missingCoreSkills.join(', ')} into your Skills section or experience bullet points.`);
    }
    if (hasJdScaleTerms && resume.metricsCount < 2) {
      recommendations.push('The job description emphasizes high-scale systems and optimizations. Add measurable numbers (e.g. latency reduced by X%, 2M+ active requests handled).');
    }
    recommendations.push('Align your resume headline / summary directly with the exact target job title from the JD.');

    return {
      matchPct,
      keywordScore,
      embeddingScore,
      matchedKeywords,
      missingKeywords,
      missingCoreSkills,
      impactGapScore,
      recommendations
    };
  }
}
