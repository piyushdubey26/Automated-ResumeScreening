import { DeterministicAtsScoreBreakdown } from '../atsEngine/types';

export type UserFeedbackSignal =
  | 'accepted'
  | 'edited'
  | 'regenerated'
  | 'reported_error'
  | 'ignored';

export interface HumanReviewLabel {
  status: 'correct' | 'incorrect' | 'partially_correct';
  verifiedBy: string;
  verifiedAt: string;
  skillMatchRating?: number; // 1 to 5
  experienceMatchRating?: number;
  formattingRating?: number;
  notes?: string;
}

export interface AnonymizedAnalysisRecord {
  id: string;
  timestamp: string;
  modelVersion: string;
  atsEngineVersion: string;
  promptVersion: string;
  scoringVersion: string;
  anonymizedResumeHash: string;
  parsedSkills: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  matchedSkills: string[];
  missingRequiredSkills: string[];
  missingPreferredSkills: string[];
  overallScore: number;
  breakdown: DeterministicAtsScoreBreakdown;
  formatScore: number;
  wordCount: number;
  hasMetrics: boolean;
  yearsExperience: number;
  targetRole: string;
  userFeedbackSignal?: UserFeedbackSignal;
  humanLabel?: HumanReviewLabel;
  isTrainingCandidate: boolean;
  qualityScore: number; // 0.0 to 1.0
  rejectionReason?: string;
}

export interface DiscoveredSkillTerm {
  term: string;
  normalizedTerm: string;
  possibleCategory: 'language' | 'framework' | 'database' | 'cloud' | 'ai' | 'tool' | 'general';
  frequency: number;
  confidence: number; // 0.0 to 1.0
  status: 'pending_validation' | 'promoted' | 'rejected';
  firstSeen: string;
  lastSeen: string;
  sampleContext: string;
}

export interface LearningRunLog {
  runId: string;
  startedAt: string;
  completedAt: string;
  examplesCollected: number;
  examplesAccepted: number;
  examplesRejected: number;
  championVersion: string;
  challengerVersion: string;
  benchmarkMetrics: {
    championMae: number;
    challengerMae: number;
    championRmse: number;
    challengerRmse: number;
    championF1: number;
    challengerF1: number;
    regressionSuitePassed: boolean;
  };
  decision: 'PROMOTED' | 'REJECTED' | 'SKIPPED';
  reason: string;
}

export interface ChampionChallengerConfig {
  activeProductionVersion: string;
  activePromptVersion: string;
  activeScoringVersion: string;
  activeDatasetVersion: string;
  canaryEnabled: boolean;
  canaryPercentage: number; // e.g. 5%
  candidateChallengerVersion?: string;
  lastRunTimestamp?: string;
  versionHistory: {
    version: string;
    promotedAt: string;
    datasetSize: number;
    mae: number;
    f1: number;
    notes: string;
  }[];
}
