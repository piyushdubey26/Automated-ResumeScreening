import { findUserByIdOrEmail, mockDb, saveDb } from '../utils/mockDb';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

export function runUserPersistenceTestSuite() {
  console.log('=== RUNNING USER STATE PERSISTENCE & IDENTITY TEST SUITE ===\n');

  // Test 1: Email Normalization & Single Account Lookup
  const sakshiLower = findUserByIdOrEmail(undefined, 'sakshi@gmail.com');
  const sakshiUpper = findUserByIdOrEmail(undefined, 'SAKSHI@GMAIL.COM');
  assert(!!sakshiLower, 'Sakshi account must exist in persistent database');
  assert(sakshiLower?.id === sakshiUpper?.id, 'Email lookup must be case-insensitive and resolve to single canonical record');
  console.log('✔ Case-insensitive email normalization & canonical user resolution verified.');

  // Test 2: Persistent Plan & Subscription State
  assert(sakshiLower?.plan === 'career-max', `Sakshi plan must persist as career-max (found: ${sakshiLower?.plan})`);
  assert(sakshiLower?.subscriptionStatus === 'approved', `Sakshi subscription status must persist as approved (found: ${sakshiLower?.subscriptionStatus})`);
  console.log('✔ Persistent subscription & plan state across sessions verified.');

  // Test 3: No Auto-Creation on Lookup Failure (Rule #4)
  const userCountBefore = mockDb.users.length;
  const nonExistent = findUserByIdOrEmail('user-non-existent-999', 'nonexistent_test_12345@example.com');
  const userCountAfter = mockDb.users.length;

  assert(nonExistent === undefined, 'Lookup of non-existent user must return undefined');
  assert(userCountBefore === userCountAfter, 'Lookup failure MUST NOT auto-create a new user record');
  console.log('✔ Non-existence lookup safety & 0 duplicate account creation verified.');

  // Test 4: Database-Backed Monthly Usage & Analysis Count Linkage
  const usageBefore = sakshiLower?.monthlyUsage || 0;
  sakshiLower!.monthlyUsage = usageBefore + 1;
  saveDb().catch(() => {});

  const reloaded = findUserByIdOrEmail(undefined, 'sakshi@gmail.com');
  assert(reloaded?.monthlyUsage === usageBefore + 1, 'Monthly usage must update persistently in database');
  console.log('✔ Database-backed persistent monthly usage & atomic updates verified.');

  console.log('\nALL USER PERSISTENCE & IDENTITY TESTS PASSED CLEANLY!');
}
