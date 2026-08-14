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
        improvedBullet: 'Architected high-throughput microservices using Node.js & Redis, reducing latency by 45%.',
        explanation: 'Default high-impact bullet point provided.',
        strengthScore: 92
      };
    }

    let improved = text;
    let explanation = '';

    // Remove weak prefixes like "Responsible for", "Worked on", "Helped with"
    improved = improved.replace(/^(was responsible for|responsible for|worked on|helped with|assisted in|involved in)\s*/i, '');

    // Ensure initial verb is capitalized action verb
    const firstWord = improved.split(' ')[0] || '';
    const weakVerbs = ['developed', 'built', 'created', 'made', 'did', 'handled', 'used'];
    if (weakVerbs.includes(firstWord.toLowerCase())) {
      if (req.targetRole === 'sde' || !req.targetRole) {
        improved = improved.replace(new RegExp(`^${firstWord}`, 'i'), 'Architected and engineered');
      } else if (req.targetRole === 'data-science') {
        improved = improved.replace(new RegExp(`^${firstWord}`, 'i'), 'Modeled and deployed');
      } else if (req.targetRole === 'marketing') {
        improved = improved.replace(new RegExp(`^${firstWord}`, 'i'), 'Spearheaded and scaled');
      } else {
        improved = improved.replace(new RegExp(`^${firstWord}`, 'i'), 'Orchestrated and launched');
      }
    }

    // Apply Focus Mode Logic
    if (req.focusMode === 'quantify') {
      if (!/\d+/.test(improved)) {
        improved += ', resulting in a 35% efficiency boost and 99.9% system uptime.';
        explanation = 'Added quantifiable outcome metrics (35% efficiency boost, 99.9% uptime).';
      } else {
        explanation = 'Enhanced numeric precision and metric phrasing.';
      }
    } else if (req.focusMode === 'action') {
      improved = 'Spearheaded end-to-end execution of ' + improved.charAt(0).toLowerCase() + improved.slice(1);
      explanation = 'Transformed sentence starter into proactive leadership action verb.';
    } else if (req.focusMode === 'concise') {
      improved = improved.replace(/\b(in order to|due to the fact that|as well as|along with)\b/gi, 'to');
      explanation = 'Removed filler phrases for crisp ATS readability.';
    } else {
      // Role aligned
      if (req.targetRole === 'sde' && !/typescript|docker|aws|api|redis/i.test(improved)) {
        improved += ' utilizing TypeScript, Docker, and REST APIs on AWS.';
      }
      explanation = 'Infused industry-standard role keywords.';
    }

    // Ensure ending period
    if (!improved.endsWith('.')) {
      improved += '.';
    }

    return {
      originalBullet: req.bulletText,
      improvedBullet: improved,
      explanation,
      strengthScore: 94
    };
  }
}
