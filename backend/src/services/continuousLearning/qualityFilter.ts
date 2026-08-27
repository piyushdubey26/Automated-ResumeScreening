import { AnonymizedAnalysisRecord } from './types';
import crypto from 'crypto';

export class QualityFilter {
  /**
   * Generates a privacy-preserving anonymized hash for resume & JD content deduplication
   */
  public static generateHash(resumeText: string, jdText: string): string {
    const raw = (resumeText.trim().toLowerCase() + ':::' + jdText.trim().toLowerCase()).replace(/\s+/g, ' ');
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 24);
  }

  /**
   * Evaluates an analysis record against quality standards & anti-poisoning criteria
   */
  public static filterRecord(
    record: AnonymizedAnalysisRecord,
    existingHashes: Set<string>
  ): { accepted: boolean; record: AnonymizedAnalysisRecord; reason?: string } {
    // 1. Deduplication check
    if (existingHashes.has(record.anonymizedResumeHash)) {
      record.isTrainingCandidate = false;
      record.qualityScore = 0;
      record.rejectionReason = 'Duplicate analysis record';
      return { accepted: false, record, reason: record.rejectionReason };
    }

    // 2. Word count & parsing minimum quality check
    if (record.wordCount < 100) {
      record.isTrainingCandidate = false;
      record.qualityScore = 0.1;
      record.rejectionReason = 'Low word count (<100 words), uninformative parsing candidate';
      return { accepted: false, record, reason: record.rejectionReason };
    }

    // 3. Score Breakdown Sum Integrity Check
    const breakdownSum = record.breakdown.requiredSkills +
      record.breakdown.responsibilities +
      record.breakdown.experience +
      record.breakdown.keywords +
      record.breakdown.evidence +
      record.breakdown.education +
      record.breakdown.formatting;

    if (Math.abs(breakdownSum - record.overallScore) > 1) {
      record.isTrainingCandidate = false;
      record.qualityScore = 0;
      record.rejectionReason = 'Score component sum mismatch, possible malformed output';
      return { accepted: false, record, reason: record.rejectionReason };
    }

    // 4. Quality Scoring & Priority Assignment
    let qualityScore = 0.6; // baseline for clean validated output

    // Priority 1: Human-reviewed ground truth
    if (record.humanLabel) {
      if (record.humanLabel.status === 'correct') {
        qualityScore = 1.0;
      } else if (record.humanLabel.status === 'partially_correct') {
        qualityScore = 0.85;
      } else {
        // Human marked incorrect -> reject candidate from positive training set
        record.isTrainingCandidate = false;
        record.qualityScore = 0.2;
        record.rejectionReason = 'Flagged as incorrect by human reviewer';
        return { accepted: false, record, reason: record.rejectionReason };
      }
    }

    // Priority 2: User feedback weak supervision signals
    if (record.userFeedbackSignal) {
      if (record.userFeedbackSignal === 'accepted' || record.userFeedbackSignal === 'edited') {
        qualityScore = Math.min(1.0, qualityScore + 0.15);
      } else if (record.userFeedbackSignal === 'reported_error') {
        record.isTrainingCandidate = false;
        record.qualityScore = 0.2;
        record.rejectionReason = 'Reported error by user feedback signal';
        return { accepted: false, record, reason: record.rejectionReason };
      }
    }

    record.isTrainingCandidate = true;
    record.qualityScore = Math.round(qualityScore * 100) / 100;
    existingHashes.add(record.anonymizedResumeHash);

    return { accepted: true, record };
  }
}
