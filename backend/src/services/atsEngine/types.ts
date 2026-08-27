export interface CandidateContact {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  github?: string;
}

export type EvidenceCategory =
  | 'NONE'
  | 'MENTION'
  | 'CONTEXTUAL'
  | 'PROJECT'
  | 'PROFESSIONAL_EXPERIENCE'
  | 'STRONG_PROFESSIONAL_EVIDENCE';

export interface BulletAnalysis {
  text: string;
  actionVerb: string | null;
  technologies: string[];
  responsibilities: string[];
  metrics: string[];
  outcome: string | null;
  evidenceStrength: number; // 0.0 to 1.0
  evidenceCategory: EvidenceCategory;
}

export interface StructuredExperienceItem {
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  durationMonths: number;
  bullets: BulletAnalysis[];
}

export interface StructuredProjectItem {
  name: string;
  role?: string;
  technologies: string[];
  bullets: BulletAnalysis[];
}

export interface StructuredEducationItem {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear?: string;
}

export interface StructuredCertificationItem {
  name: string;
  issuer?: string;
  year?: string;
}

export interface FormattingAuditResult {
  formatScore: number; // 0 to 100
  wordCount: number;
  pageEstimate: number;
  hasTwoColumns: boolean;
  hasUnusualSectionHeadings: boolean;
  hasIconContactInfo: boolean;
  hasTablesOrGraphics: boolean;
  textExtractionQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  issues: string[];
}

export interface StructuredResume {
  candidate: CandidateContact;
  summary?: string;
  skills: string[];
  experience: StructuredExperienceItem[];
  projects: StructuredProjectItem[];
  education: StructuredEducationItem[];
  certifications: StructuredCertificationItem[];
  achievements: string[];
  languages: string[];
  formattingAudit: FormattingAuditResult;
  rawText: string;
}

export type RequirementType = 'REQUIRED' | 'PREFERRED' | 'CONTEXTUAL';

export interface RequirementMatchItem {
  requirement: string;
  normalizedRequirement: string;
  type: RequirementType;
  isMatched: boolean;
  matchedAlias?: string | null;
  evidenceCategory: EvidenceCategory;
  evidenceSnippet?: string | null;
  evidenceStrength: number;
  scoreContribution: number;
}

export interface StructuredJD {
  jobTitle: string;
  seniority: 'entry' | 'mid' | 'senior' | 'lead' | 'director' | 'any';
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  requiredExperience: {
    minYears: number;
    titleKeywords: string[];
    domainKeywords: string[];
  };
  educationRequirements: {
    degreeLevel: string;
    fieldOfStudy: string[];
    isRequired: boolean;
  }[];
  certifications: {
    name: string;
    isRequired: boolean;
  }[];
  tools: string[];
  domainKeywords: string[];
  softSkills: string[];
  rawText: string;
}

export interface ResponsibilityMatchItem {
  jdResponsibility: string;
  matchedBullet: string | null;
  similarityScore: number; // 0 to 100
  coverageLevel: 'NONE' | 'WEAK' | 'MODERATE' | 'STRONG';
  explanation: string;
}

export interface DeterministicAtsScoreBreakdown {
  requiredSkills: number;  // Max 30
  responsibilities: number; // Max 20
  experience: number;       // Max 15
  keywords: number;         // Max 10
  evidence: number;         // Max 10
  education: number;        // Max 5
  formatting: number;       // Max 10
  totalScore: number;       // 0 to 100 (exactly sum of all subscores)
  scoreBand: 'Excellent' | 'Strong' | 'Good' | 'Weak/Moderate' | 'Weak' | 'Poor';
}

export interface AtsEvaluationResult {
  engineVersion: string;
  overallScore: number;
  scoreBand: string;
  breakdown: DeterministicAtsScoreBreakdown;
  structuredResume: StructuredResume;
  structuredJD: StructuredJD;
  matchedRequiredSkills: RequirementMatchItem[];
  missingRequiredSkills: RequirementMatchItem[];
  matchedPreferredSkills: RequirementMatchItem[];
  missingPreferredSkills: RequirementMatchItem[];
  responsibilityMatches: ResponsibilityMatchItem[];
  experienceAnalysis: {
    yearsFound: number;
    yearsRequired: number;
    titleMatchScore: number;
    domainMatchScore: number;
    isMatch: boolean;
    explanation: string;
  };
  educationAnalysis: {
    degreeMatch: boolean;
    certMatches: string[];
    explanation: string;
  };
  formatAnalysis: FormattingAuditResult;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  antiHallucinationCheck: {
    verifiedEvidenceCount: number;
    unverifiedClaimsCount: number;
    clean: boolean;
  };
}
