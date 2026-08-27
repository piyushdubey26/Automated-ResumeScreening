import { BulletAnalysis, EvidenceCategory } from './types';
import { SkillNormalizer } from './skillNormalizer';

const ACTION_VERBS = [
  'architected', 'built', 'created', 'designed', 'developed', 'engineered',
  'formulated', 'implemented', 'improved', 'increased', 'led', 'managed',
  'optimized', 'reduced', 'scaled', 'spearheaded', 'automated', 'deployed',
  'integrated', 'launched', 'modeled', 'refactored', 'transformed', 'delivered'
];

const METRIC_REGEX = /\b(\d+%\b|\$\d+[\d,]*[kM\+]?|\b\d+[kM\+]|\b\d+\s*(ms|seconds|hours|users|requests|customers|percent|x)\b)/gi;

const COMMON_TECH_TOKENS = [
  'typescript', 'javascript', 'python', 'java', 'c++', 'c#', 'node.js', 'express',
  'react', 'next.js', 'postgresql', 'postgres', 'mongodb', 'redis', 'docker',
  'kubernetes', 'aws', 'gcp', 'azure', 'graphql', 'rest api', 'sql', 'git',
  'pytorch', 'tensorflow', 'pandas', 'numpy', 'scikit-learn', 'a/b testing',
  'excel', 'power bi', 'tableau', 'hubspot', 'figma', 'seo', 'sem', 'ga4'
];

export class BulletAnalyzer {
  public static analyzeBullet(text: string, isExperienceBullet = true): BulletAnalysis {
    if (!text || !text.trim()) {
      return {
        text: '',
        actionVerb: null,
        technologies: [],
        responsibilities: [],
        metrics: [],
        outcome: null,
        evidenceStrength: 0,
        evidenceCategory: 'NONE'
      };
    }

    const cleanText = text.trim();
    const lowerText = cleanText.toLowerCase();

    // 1. Detect Action Verb
    const words = lowerText.split(/\s+/);
    let foundActionVerb: string | null = null;
    for (const verb of ACTION_VERBS) {
      if (words[0] === verb || lowerText.startsWith(verb)) {
        foundActionVerb = verb;
        break;
      }
    }
    if (!foundActionVerb) {
      for (const verb of ACTION_VERBS) {
        if (lowerText.includes(verb)) {
          foundActionVerb = verb;
          break;
        }
      }
    }

    // 2. Extract Technologies
    const technologies: string[] = [];
    COMMON_TECH_TOKENS.forEach(token => {
      if (lowerText.includes(token)) {
        technologies.push(SkillNormalizer.normalize(token));
      }
    });

    // 3. Extract Hard Metrics
    const metricsMatches = cleanText.match(METRIC_REGEX) || [];
    const metrics = Array.from(new Set(metricsMatches));

    // 4. Determine Evidence Strength (0.0 to 1.0)
    let strength = 0.3; // baseline for having text
    if (foundActionVerb) strength += 0.2;
    if (technologies.length > 0) strength += 0.2;
    if (metrics.length > 0) strength += 0.3;

    strength = Math.min(1.0, Math.round(strength * 100) / 100);

    // 5. Determine Evidence Category
    let category: EvidenceCategory = 'CONTEXTUAL';
    if (isExperienceBullet) {
      if (strength >= 0.7) {
        category = 'STRONG_PROFESSIONAL_EVIDENCE';
      } else {
        category = 'PROFESSIONAL_EXPERIENCE';
      }
    } else {
      category = 'PROJECT';
    }

    return {
      text: cleanText,
      actionVerb: foundActionVerb,
      technologies: Array.from(new Set(technologies)),
      responsibilities: [cleanText],
      metrics,
      outcome: metrics.length > 0 ? cleanText : null,
      evidenceStrength: strength,
      evidenceCategory: category
    };
  }
}
