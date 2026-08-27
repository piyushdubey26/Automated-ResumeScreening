// Dictionary of valid skill canonical forms and aliases
const CANONICAL_SKILLS_MAP: Record<string, string> = {
  // Languages & Core Runtimes
  'js': 'javascript',
  'javascript': 'javascript',
  'ts': 'typescript',
  'typescript': 'typescript',
  'py': 'python',
  'python': 'python',
  'golang': 'go',
  'go': 'go',
  'cpp': 'c++',
  'cplusplus': 'c++',
  'c++': 'c++',
  'csharp': 'c#',
  'c#': 'c#',
  
  // Frameworks & Libraries
  'react': 'react',
  'react.js': 'react',
  'reactjs': 'react',
  'node': 'node.js',
  'node.js': 'node.js',
  'nodejs': 'node.js',
  'express': 'express',
  'express.js': 'express',
  'expressjs': 'express',
  'next': 'next.js',
  'next.js': 'next.js',
  'nextjs': 'next.js',

  // Databases & Storage
  'postgres': 'postgresql',
  'postgresql': 'postgresql',
  'psql': 'postgresql',
  'mongo': 'mongodb',
  'mongodb': 'mongodb',
  'redis': 'redis',

  // Cloud & DevOps
  'aws': 'amazon web services',
  'amazon web services': 'amazon web services',
  'gcp': 'google cloud platform',
  'google cloud': 'google cloud platform',
  'google cloud platform': 'google cloud platform',
  'azure': 'microsoft azure',
  'microsoft azure': 'microsoft azure',
  'k8s': 'kubernetes',
  'kubernetes': 'kubernetes',
  'docker': 'docker',
  'cicd': 'ci/cd',
  'ci/cd': 'ci/cd',
  'continuous integration': 'ci/cd',

  // AI & Data Science
  'ml': 'machine learning',
  'machine learning': 'machine learning',
  'ai': 'artificial intelligence',
  'artificial intelligence': 'artificial intelligence',
  'nlp': 'natural language processing',
  'natural language processing': 'natural language processing',
  'tf': 'tensorflow',
  'tensorflow': 'tensorflow',
  'torch': 'pytorch',
  'pytorch': 'pytorch',
  'pandas': 'pandas',
  'numpy': 'numpy',
  'scikit-learn': 'scikit-learn',
  'sklearn': 'scikit-learn',

  // Analytics & Business Intelligence
  'excel': 'microsoft excel',
  'microsoft excel': 'microsoft excel',
  'power bi': 'power bi',
  'powerbi': 'power bi',
  'tableau': 'tableau',
  'bi': 'business intelligence',
  'business intelligence': 'business intelligence',
  'ga4': 'google analytics',
  'google analytics': 'google analytics',
  'seo': 'search engine optimization',
  'search engine optimization': 'search engine optimization',
  'sem': 'search engine marketing',
  'search engine marketing': 'search engine marketing'
};

// Strict list of unsafe pairs that must NEVER be considered equivalent
const UNSAFE_EQUIVALENCE_PAIRS: [string, string][] = [
  ['java', 'javascript'],
  ['java', 'js'],
  ['c', 'c++'],
  ['c', 'c#'],
  ['c++', 'c#'],
  ['react', 'react native'],
  ['aws', 'azure'],
  ['aws', 'gcp'],
  ['azure', 'gcp'],
  ['tensorflow', 'pytorch'],
  ['python', 'pip'],
  ['mysql', 'postgresql']
];

export class SkillNormalizer {
  /**
   * Normalizes a raw skill string to its canonical lowercased representation
   */
  public static normalize(skill: string): string {
    if (!skill) return '';
    const cleaned = skill.trim().toLowerCase();
    return CANONICAL_SKILLS_MAP[cleaned] || cleaned;
  }

  /**
   * Checks whether two skill strings represent the same underlying skill
   */
  public static areEquivalent(skillA: string, skillB: string): boolean {
    if (!skillA || !skillB) return false;
    const cleanA = skillA.trim().toLowerCase();
    const cleanB = skillB.trim().toLowerCase();

    if (cleanA === cleanB) return true;

    // Check unsafe pair guard
    for (const [uA, uB] of UNSAFE_EQUIVALENCE_PAIRS) {
      if ((cleanA === uA && cleanB === uB) || (cleanA === uB && cleanB === uA)) {
        return false;
      }
    }

    const normA = SkillNormalizer.normalize(cleanA);
    const normB = SkillNormalizer.normalize(cleanB);

    return normA === normB;
  }

  /**
   * Checks if candidate skill string matches target skill (with synonym fallback)
   */
  public static isSkillMatch(candidateSkill: string, targetSkill: string): boolean {
    return SkillNormalizer.areEquivalent(candidateSkill, targetSkill);
  }
}
