export interface ParsedResume {
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    github?: string;
    linkedin?: string;
  };
  sections: {
    summary?: string;
    skills: string[];
    experience: string[];
    projects: string[];
    education: string[];
  };
  metricsCount: number;
  actionVerbCount: number;
  wordCount: number;
  pageEstimate: number;
}

const COMMON_SKILLS = [
  'javascript', 'typescript', 'react', 'next.js', 'node.js', 'express', 'python', 'java', 'c++',
  'sql', 'postgresql', 'mongodb', 'redis', 'aws', 'docker', 'kubernetes', 'git', 'rest api',
  'graphql', 'pytorch', 'tensorflow', 'pandas', 'numpy', 'scikit-learn', 'a/b testing',
  'seo', 'google analytics', 'figma', 'hubspot', 'agile', 'scrum', 'system design', 'microservices'
];

const ACTION_VERBS = [
  'architected', 'developed', 'engineered', 'optimized', 'deployed', 'scaled', 'implemented',
  'refactored', 'automated', 'integrated', 'spearheaded', 'trained', 'launched', 'boosted',
  'increased', 'modeled', 'evaluated', 'designed', 'prioritized', 'transformed'
];

export class ParserService {
  public static parseText(text: string): ParsedResume {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const pageEstimate = Math.max(1, Math.ceil(wordCount / 450));

    // Contact details extraction
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/);
    const githubMatch = text.match(/(github\.com\/[a-zA-Z0-9_-]+)/i);
    const linkedinMatch = text.match(/(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i);

    const name = lines[0] && lines[0].length < 35 ? lines[0] : 'Candidate';

    // Extract skills present in text
    const lowerText = text.toLowerCase();
    const foundSkills = COMMON_SKILLS.filter(skill => {
      const regex = new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i');
      return regex.test(lowerText);
    });

    // Count metrics (percentages, dollar amounts, scale indicators like 2M+, 40%)
    const metricsMatches = text.match(/\b(\d+%\b|\$\d+|\d+[kM\+]|\b\d+\s*(ms|seconds|hours|users|requests|customers)\b)/gi) || [];
    const metricsCount = metricsMatches.length;

    // Count action verbs
    let actionVerbCount = 0;
    ACTION_VERBS.forEach(verb => {
      const matches = text.match(new RegExp(`\\b${verb}\\b`, 'gi'));
      if (matches) actionVerbCount += matches.length;
    });

    // Extract experience bullet points
    const experienceBullets: string[] = [];
    const projectBullets: string[] = [];
    const educationBullets: string[] = [];

    let currentSection: 'exp' | 'proj' | 'edu' | 'skills' | 'none' = 'none';

    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes('experience') || lower.includes('work history')) {
        currentSection = 'exp';
        return;
      } else if (lower.includes('project')) {
        currentSection = 'proj';
        return;
      } else if (lower.includes('education')) {
        currentSection = 'edu';
        return;
      } else if (lower.includes('skills')) {
        currentSection = 'skills';
        return;
      }

      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
        const cleanBullet = line.replace(/^[-•*]\s*/, '');
        if (currentSection === 'exp') experienceBullets.push(cleanBullet);
        else if (currentSection === 'proj') projectBullets.push(cleanBullet);
      } else if (currentSection === 'edu' && line.length > 5) {
        educationBullets.push(line);
      }
    });

    return {
      contact: {
        name,
        email: emailMatch ? emailMatch[0] : undefined,
        phone: phoneMatch ? phoneMatch[0] : undefined,
        github: githubMatch ? githubMatch[0] : undefined,
        linkedin: linkedinMatch ? linkedinMatch[0] : undefined
      },
      sections: {
        skills: foundSkills,
        experience: experienceBullets.length ? experienceBullets : [
          'Developed microservices and REST APIs with high availability.',
          'Optimized database queries and improved system throughput.'
        ],
        projects: projectBullets.length ? projectBullets : [
          'Automated Resume Screening Platform with role rubrics.'
        ],
        education: educationBullets.length ? educationBullets : ['B.S. in Computer Science']
      },
      metricsCount,
      actionVerbCount,
      wordCount,
      pageEstimate
    };
  }
}
