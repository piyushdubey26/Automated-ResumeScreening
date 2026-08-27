import { ContinuousLearningEngine, DriftDetector, QualityFilter } from '../services/continuousLearning';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

export function runContinuousLearningTestSuite() {
  console.log('=== RUNNING CONTROLLED CONTINUOUS-LEARNING TEST SUITE ===\n');

  // Test 1: Anonymization & Quality Filter
  const hash1 = QualityFilter.generateHash('Candidate Resume Text', 'Data Analyst JD');
  const hash2 = QualityFilter.generateHash('Candidate Resume Text', 'Data Analyst JD');
  assert(hash1 === hash2, 'Identical content must generate identical anonymized hash');
  console.log('✔ Anonymization hashing & privacy protection verified.');

  // Test 2: Ingest Production Records & Quality Filtering
  const rec1 = ContinuousLearningEngine.recordAnalysis(
    'Alex Rivera. Software Engineer with 5 years experience building scalable systems.',
    'Senior Software Engineer. Build high-scale microservices in Node.js and AWS.',
    'sde',
    85,
    { requiredSkills: 25, responsibilities: 18, experience: 14, keywords: 8, evidence: 8, education: 4, formatting: 8, totalScore: 85 },
    300,
    5
  );

  assert(rec1.isTrainingCandidate, 'Clean record > 100 words with exact component sum must be accepted');

  // Test Duplicate Rejection
  const recDup = ContinuousLearningEngine.recordAnalysis(
    'Alex Rivera. Software Engineer with 5 years experience building scalable systems.',
    'Senior Software Engineer. Build high-scale microservices in Node.js and AWS.',
    'sde',
    85,
    { requiredSkills: 25, responsibilities: 18, experience: 14, keywords: 8, evidence: 8, education: 4, formatting: 8, totalScore: 85 },
    300,
    5
  );
  assert(!recDup.isTrainingCandidate, 'Duplicate analysis must be rejected from training set');
  console.log('✔ Data Quality Filter & Deduplication verified.');

  // Test 3: Emerging Term Drift Discovery & Admin Promotion
  DriftDetector.inspectTextForEmergingTerms('Job requirement: Experience building RAG pipelines and LangChain AI agents.', 'Job Description');
  const candidates = DriftDetector.getCandidateSkills();
  const ragTerm = candidates.find(c => c.term.toLowerCase() === 'rag');
  assert(!!ragTerm, 'Emerging technology RAG must be discovered');
  assert(ragTerm?.status === 'pending_validation', 'Discovered terms must be pending validation before promotion');

  const promoteSuccess = DriftDetector.promoteCandidateSkill('rag');
  assert(promoteSuccess, 'Admin must be able to promote candidate terms');
  console.log('✔ Drift Detector & Admin Term Promotion verified.');

  // Test 4: Daily Learning Cycle Execution & Insufficient Data Handling
  const skipLog = ContinuousLearningEngine.runDailyLearningCycle(10);
  assert(skipLog.decision === 'SKIPPED', 'Learning cycle must output SKIPPED when candidate volume is below threshold');
  console.log('✔ Daily Learning Cycle threshold & SKIPPED state verified.');

  // Test 5: Champion vs Challenger Evaluation Run
  for (let i = 0; i < 3; i++) {
    ContinuousLearningEngine.recordAnalysis(
      `Unique Candidate ${i} Resume Text with high quality accomplishments and metrics in Node.js, Python, SQL, Docker, and AWS over 4 years.`,
      `Unique JD ${i} for Senior Software Engineer requiring Node.js, Python, SQL, Docker, and AWS.`,
      'sde',
      88,
      { requiredSkills: 26, responsibilities: 18, experience: 14, keywords: 9, evidence: 8, education: 5, formatting: 8, totalScore: 88 },
      350,
      4
    );
  }

  const runLog = ContinuousLearningEngine.runDailyLearningCycle(2);
  assert(runLog.decision === 'PROMOTED' || runLog.decision === 'REJECTED', 'Learning cycle must generate evaluation decision');
  console.log(`✔ Champion vs Challenger Benchmark Evaluation verified (Decision: ${runLog.decision}).`);

  // Test 6: Rollback Capability
  const rollbackRes = ContinuousLearningEngine.rollbackToVersion('ATS-Engine-v2.0');
  assert(rollbackRes.success, 'Admin must be able to rollback to previous production version');
  console.log('✔ Historical Version Rollback verified.');

  console.log('\nALL CONTROLLED CONTINUOUS-LEARNING TESTS PASSED CLEANLY!');
}
