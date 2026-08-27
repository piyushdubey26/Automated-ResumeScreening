import { AtsScoringEngine, BenchmarkRunner, SkillNormalizer } from '../services/atsEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

export function runAtsTestSuite() {
  console.log('=== RUNNING ATS ENGINE v2.0 SUITE & VERIFICATIONS ===\n');

  // Test 1: Skill Normalizer
  assert(SkillNormalizer.normalize('JS') === 'javascript', 'JS should normalize to javascript');
  assert(SkillNormalizer.normalize('AWS') === 'amazon web services', 'AWS should normalize to amazon web services');
  assert(!SkillNormalizer.areEquivalent('Java', 'JavaScript'), 'Java must NOT be equivalent to JavaScript');
  assert(!SkillNormalizer.areEquivalent('React', 'React Native'), 'React must NOT be equivalent to React Native');
  console.log('✔ Skill Normalizer & Anti-Equivalence Guard verified.');

  // Test 2: Deterministic Score Calculation & Sum Check
  const eval1 = AtsScoringEngine.evaluate(
    'Alex Rivera. Built microservices in Node.js, TypeScript, React, PostgreSQL, Docker, AWS. 6 years experience.',
    'Senior Engineer. Requires TypeScript, Node.js, React, PostgreSQL, Docker, AWS. 5+ years experience.'
  );
  const eval2 = AtsScoringEngine.evaluate(
    'Alex Rivera. Built microservices in Node.js, TypeScript, React, PostgreSQL, Docker, AWS. 6 years experience.',
    'Senior Engineer. Requires TypeScript, Node.js, React, PostgreSQL, Docker, AWS. 5+ years experience.'
  );

  assert(eval1.overallScore === eval2.overallScore, 'Repeated runs must produce identical score');
  const breakdownSum = eval1.breakdown.requiredSkills +
    eval1.breakdown.responsibilities +
    eval1.breakdown.experience +
    eval1.breakdown.keywords +
    eval1.breakdown.evidence +
    eval1.breakdown.education +
    eval1.breakdown.formatting;

  assert(breakdownSum === eval1.overallScore, 'Score breakdown components must sum exactly to totalScore');
  console.log('✔ Deterministic Scoring & Exact Sum Integrity verified.');

  // Test 3: Benchmark Suite on Held-out Dataset
  const benchmarkResult = BenchmarkRunner.runAll();
  assert(benchmarkResult.passed, 'Benchmark dataset suite must pass 100% of test cases');
  console.log(`✔ Benchmark Dataset Suite verified (${benchmarkResult.passCount}/${benchmarkResult.totalTests} passed). MAE: ${benchmarkResult.metrics.mae}`);

  console.log('\nALL ATS ENGINE v2.0 TESTS PASSED CLEANLY!');
}
