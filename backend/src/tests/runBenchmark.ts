import { runAtsTestSuite } from './atsEngine.test';
import { runContinuousLearningTestSuite } from './continuousLearning.test';
import { runUserPersistenceTestSuite } from './userPersistence.test';

console.log('====================================================');
console.log(' RESUMOVA AI - AUTOMATED REGRESSION & BENCHMARK SUITE');
console.log('====================================================\n');

runAtsTestSuite();
console.log('\n----------------------------------------------------\n');
runContinuousLearningTestSuite();
console.log('\n----------------------------------------------------\n');
runUserPersistenceTestSuite();
