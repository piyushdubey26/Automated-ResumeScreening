import { StructuredJD } from './types';
import { SkillNormalizer } from './skillNormalizer';

const COMMON_TECH_KEYWORDS = [
  'typescript', 'javascript', 'node.js', 'express', 'react', 'next.js', 'postgresql',
  'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'graphql', 'rest api',
  'python', 'pytorch', 'tensorflow', 'pandas', 'scikit-learn', 'a/b testing', 'seo', 'sem',
  'google analytics', 'microservices', 'system design', 'agile', 'scrum', 'ci/cd',
  'jest', 'cypress', 'sql', 'git', 'figma', 'excel', 'power bi', 'tableau'
];

const SOFT_SKILLS = [
  'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
  'collaboration', 'stakeholder management', 'time management', 'adaptability'
];

export class AtsJdParser {
  public static parse(rawText: string, targetRole: string = 'sde'): StructuredJD {
    if (!rawText) rawText = '';
    const lowerText = rawText.toLowerCase();

    // 1. Detect Job Title & Seniority
    let jobTitle = 'Software Engineer';
    if (lowerText.includes('senior') || lowerText.includes('sr.')) {
      jobTitle = 'Senior Engineer';
    } else if (lowerText.includes('lead') || lowerText.includes('staff')) {
      jobTitle = 'Lead / Staff Engineer';
    } else if (lowerText.includes('data analyst')) {
      jobTitle = 'Data Analyst';
    } else if (lowerText.includes('data scientist')) {
      jobTitle = 'Data Scientist';
    } else if (lowerText.includes('product manager')) {
      jobTitle = 'Product Manager';
    } else if (lowerText.includes('marketing')) {
      jobTitle = 'Marketing Specialist';
    }

    let seniority: StructuredJD['seniority'] = 'mid';
    if (lowerText.includes('senior') || lowerText.includes('sr.')) seniority = 'senior';
    else if (lowerText.includes('lead') || lowerText.includes('principal') || lowerText.includes('director')) seniority = 'lead';
    else if (lowerText.includes('entry') || lowerText.includes('junior') || lowerText.includes('intern')) seniority = 'entry';

    // 2. Classify Required vs Preferred Skills
    const requiredSkills: string[] = [];
    const preferredSkills: string[] = [];

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    let currentCategory: 'required' | 'preferred' | 'general' = 'general';

    lines.forEach(line => {
      const l = line.toLowerCase();
      if (l.includes('required') || l.includes('must have') || l.includes('qualifications') || l.includes('requirements')) {
        currentCategory = 'required';
      } else if (l.includes('preferred') || l.includes('nice to have') || l.includes('plus') || l.includes('bonus')) {
        currentCategory = 'preferred';
      }

      COMMON_TECH_KEYWORDS.forEach(kw => {
        const normKw = SkillNormalizer.normalize(kw);
        if (l.includes(kw)) {
          if (currentCategory === 'preferred' || l.includes('preferred') || l.includes('nice to have')) {
            if (!preferredSkills.includes(normKw) && !requiredSkills.includes(normKw)) {
              preferredSkills.push(normKw);
            }
          } else {
            if (!requiredSkills.includes(normKw)) {
              requiredSkills.push(normKw);
            }
          }
        }
      });
    });

    // Fallback: If no required skills section demarcated, populate from tech keywords present
    if (requiredSkills.length === 0) {
      COMMON_TECH_KEYWORDS.forEach(kw => {
        if (lowerText.includes(kw)) {
          requiredSkills.push(SkillNormalizer.normalize(kw));
        }
      });
    }

    // 3. Extract Years of Experience Required
    const expMatch = lowerText.match(/(\d+)\+?\s*(years|yrs)\s*(of\s*)?(experience|exp)?/i);
    const minYears = expMatch ? parseInt(expMatch[1], 10) : (seniority === 'senior' ? 5 : seniority === 'entry' ? 0 : 2);

    // 4. Extract Responsibilities
    const responsibilities: string[] = [];
    lines.forEach(line => {
      const clean = line.replace(/^[-•*\d.]+\s*/, '').trim();
      if (clean.length > 10) {
        const lower = clean.toLowerCase();
        if (!lower.startsWith('data analyst') && !lower.startsWith('required skills') && !lower.startsWith('preferred skills')) {
          responsibilities.push(clean);
        }
      }
    });

    if (responsibilities.length === 0) {
      responsibilities.push('Build, test, and maintain high-performance software systems and APIs.');
      responsibilities.push('Collaborate with cross-functional teams to deliver scalable solutions.');
    }

    // 5. Extract Education Requirements
    const degreeMatch = lowerText.includes('bachelor') || lowerText.includes('b.s.') || lowerText.includes('b.tech') || lowerText.includes('master');
    const educationRequirements = degreeMatch ? [{
      degreeLevel: lowerText.includes('master') ? 'Master' : 'Bachelor',
      fieldOfStudy: ['Computer Science', 'Engineering', 'STEM', 'Related Field'],
      isRequired: lowerText.includes('bachelor required') || lowerText.includes('degree required')
    }] : [];

    // 6. Extract Soft Skills
    const foundSoftSkills = SOFT_SKILLS.filter(sk => lowerText.includes(sk));

    return {
      jobTitle,
      seniority,
      requiredSkills: Array.from(new Set(requiredSkills)),
      preferredSkills: Array.from(new Set(preferredSkills.filter(s => !requiredSkills.includes(s)))),
      responsibilities,
      requiredExperience: {
        minYears,
        titleKeywords: [jobTitle.toLowerCase(), targetRole],
        domainKeywords: [targetRole, 'engineering', 'software', 'technology']
      },
      educationRequirements,
      certifications: lowerText.includes('aws certified') ? [{ name: 'AWS Certified', isRequired: false }] : [],
      tools: requiredSkills.slice(0, 5),
      domainKeywords: ['software', 'architecture', 'scalability', 'performance'],
      softSkills: foundSoftSkills,
      rawText
    };
  }
}
