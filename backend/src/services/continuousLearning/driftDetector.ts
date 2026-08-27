import { DiscoveredSkillTerm } from './types';
import { SkillNormalizer } from '../atsEngine/skillNormalizer';

const RECOGNIZED_TECH_DICTIONARY = new Set([
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'react', 'node.js',
  'express', 'next.js', 'postgresql', 'mongodb', 'redis', 'aws', 'gcp', 'azure',
  'docker', 'kubernetes', 'graphql', 'rest api', 'sql', 'git', 'figma', 'excel',
  'power bi', 'tableau', 'pytorch', 'tensorflow', 'pandas', 'numpy', 'scikit-learn'
]);

export class DriftDetector {
  private static candidateTermsMap: Map<string, DiscoveredSkillTerm> = new Map();

  /**
   * Scans text for un-cataloged potential tech skills / emerging industry terms
   */
  public static inspectTextForEmergingTerms(text: string, contextSource = 'Job Description'): DiscoveredSkillTerm[] {
    if (!text) return [];

    const words = text.match(/\b[A-Za-z0-9.#+-]{3,20}\b/g) || [];
    const discovered: DiscoveredSkillTerm[] = [];

    words.forEach(word => {
      const lower = word.toLowerCase();
      const norm = SkillNormalizer.normalize(lower);

      // Filter out recognized skills and common English words
      if (RECOGNIZED_TECH_DICTIONARY.has(norm) || RECOGNIZED_TECH_DICTIONARY.has(lower)) {
        return;
      }

      // Check if term looks like a technical keyword (e.g., contains numbers, dots, camelCase, uppercase acronym)
      const isTechPattern = /^[A-Z0-9.+-]{3,12}$/.test(word) ||
        /\b(rag|langchain|llm|agentic|fastapi|astro|vector|chromadb|pinecone|qdrant|supa)\b/i.test(word);

      if (isTechPattern) {
        const key = norm;
        const now = new Date().toISOString();
        let existing = DriftDetector.candidateTermsMap.get(key);

        if (!existing) {
          existing = {
            term: word,
            normalizedTerm: norm,
            possibleCategory: lower.includes('db') || lower.includes('vector') ? 'database' : lower.includes('llm') || lower.includes('rag') ? 'ai' : 'tool',
            frequency: 1,
            confidence: 0.65,
            status: 'pending_validation',
            firstSeen: now,
            lastSeen: now,
            sampleContext: `Discovered in ${contextSource}: "${text.substring(0, 80)}..."`
          };
        } else {
          existing.frequency += 1;
          existing.lastSeen = now;
          existing.confidence = Math.min(0.95, Math.round((existing.confidence + 0.05) * 100) / 100);
        }

        DriftDetector.candidateTermsMap.set(key, existing);
        discovered.push(existing);
      }
    });

    return discovered;
  }

  /**
   * Gets list of candidate skill terms awaiting Admin review & promotion
   */
  public static getCandidateSkills(): DiscoveredSkillTerm[] {
    return Array.from(DriftDetector.candidateTermsMap.values()).sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Admin promotes candidate term to catalog
   */
  public static promoteCandidateSkill(term: string): boolean {
    const norm = SkillNormalizer.normalize(term.toLowerCase());
    const existing = DriftDetector.candidateTermsMap.get(norm);
    if (existing) {
      existing.status = 'promoted';
      RECOGNIZED_TECH_DICTIONARY.add(norm);
      return true;
    }
    return false;
  }
}
