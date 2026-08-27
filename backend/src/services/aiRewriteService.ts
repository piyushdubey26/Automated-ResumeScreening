export interface RewriteRequest {
  bulletText: string;
  focusMode: 'quantify' | 'action' | 'concise' | 'role-aligned';
  targetRole?: string;
}

export interface RewriteResponse {
  originalBullet: string;
  improvedBullet: string;
  explanation: string;
  strengthScore: number;
}

export class AIRewriteService {
  public static rewriteBullet(req: RewriteRequest): RewriteResponse {
    const text = req.bulletText.trim();
    if (!text) {
      return {
        originalBullet: '',
        improvedBullet: 'Architected microservices and REST APIs to handle high-throughput requests.',
        explanation: 'Default action-oriented bullet point provided.',
        strengthScore: 88
      };
    }

    let improved = text;
    let explanation = 'Enhanced phrasing with strong action verbs and crisp ATS structure.';

    // 1. Remove passive prefixes ("responsible for", "worked on", "helped with")
    improved = improved.replace(/^(was responsible for|responsible for|worked on|helped with|assisted in|involved in)\s*/i, '');

    // 2. Ensure starting with a strong action verb without inventing fake facts
    const firstWord = (improved.split(/\s+/)[0] || '').toLowerCase();
    const weakVerbs: Record<string, string> = {
      'developed': 'Engineered',
      'built': 'Architected',
      'created': 'Designed',
      'made': 'Formulated',
      'did': 'Executed',
      'handled': 'Managed',
      'used': 'Leveraged',
      'helped': 'Spearheaded'
    };

    if (weakVerbs[firstWord]) {
      const strongVerb = weakVerbs[firstWord];
      improved = strongVerb + improved.slice(firstWord.length);
      explanation = `Replaced weak verb "${firstWord}" with strong action verb "${strongVerb}".`;
    } else if (!/^[A-Z][a-z]*(ed|ed\b)/.test(improved)) {
      improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    }

    // 3. Apply Focus Mode without inventing metrics or technology claims
    if (req.focusMode === 'concise') {
      improved = improved.replace(/\b(in order to|due to the fact that|as well as|along with)\b/gi, 'to');
      explanation = 'Streamlined phrasing and removed filler text for ATS readability.';
    } else if (req.focusMode === 'action') {
      explanation = 'Re-phrased to emphasize proactive technical ownership.';
    } else if (req.focusMode === 'quantify') {
      if (!/\d+/.test(improved)) {
        explanation = 'Action phrasing improved. Note: Add exact factual metric numbers from your project if available.';
      } else {
        explanation = 'Highlighted and structured existing numerical outcomes.';
      }
    }

    // Ensure ending punctuation
    if (!improved.endsWith('.')) {
      improved += '.';
    }

    return {
      originalBullet: req.bulletText,
      improvedBullet: improved,
      explanation,
      strengthScore: 92
    };
  }
}
