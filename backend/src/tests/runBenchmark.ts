import { BenchmarkRunner } from '../services/atsEngine/benchmarkSuite';
import { AtsScoringEngine } from '../services/atsEngine/scoringEngine';

const res = BenchmarkRunner.runAll();
console.log('BENCHMARK RESULTS SUMMARY:');
res.results.forEach(r => {
  console.log(`- [${r.scorePassed ? 'PASS' : 'FAIL'}] ${r.name}`);
  console.log(`  Actual Score: ${r.actualScore} | Expected Range: [${r.expectedScoreRange.join(', ')}]`);
  console.log(`  Breakdown:`, r.breakdown);
});
