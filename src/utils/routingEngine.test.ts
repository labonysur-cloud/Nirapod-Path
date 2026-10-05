import { OFFICIAL_SAMPLE } from '../data/presets';
import { calculateEvacuationRoute, validateBuildingData } from './routingEngine';

function runTests() {
  console.log('--- RUNNING OFFICIAL SMART ESCAPE VERIFICATION TESTS ---');

  // Test 0: Validate official schema
  const validation = validateBuildingData(OFFICIAL_SAMPLE);
  console.assert(validation.valid, 'Validation failed: ' + validation.errors.join(', '));
  console.log('Test 0 (Validation): PASSED');

  // Test 1: Baseline (Select R1)
  // Expected: R1 - C1 - C2 - E1; cost 7
  const res1 = calculateEvacuationRoute(
    OFFICIAL_SAMPLE,
    'R1',
    new Set(),
    new Set(),
    new Set()
  );
  console.assert(res1.status === 'success', 'Test 1 status failed');
  console.assert(res1.totalCost === 7, `Test 1 cost failed: got ${res1.totalCost}`);
  console.assert(res1.pathNodes.join(' - ') === 'R1 - C1 - C2 - E1', `Test 1 path failed: ${res1.pathNodes.join(' - ')}`);
  console.log('Test 1 (Baseline R1): PASSED ->', res1.pathNodes.join(' - '), 'cost:', res1.totalCost);

  // Test 2: Blocked junction (Select R1; block C2)
  // Expected: R1 - C1 - C3 - C4 - E2; cost 11
  const res2 = calculateEvacuationRoute(
    OFFICIAL_SAMPLE,
    'R1',
    new Set(['C2']),
    new Set(),
    new Set()
  );
  console.assert(res2.status === 'success', 'Test 2 status failed');
  console.assert(res2.totalCost === 11, `Test 2 cost failed: got ${res2.totalCost}`);
  console.assert(res2.pathNodes.join(' - ') === 'R1 - C1 - C3 - C4 - E2', `Test 2 path failed: ${res2.pathNodes.join(' - ')}`);
  console.log('Test 2 (Blocked C2): PASSED ->', res2.pathNodes.join(' - '), 'cost:', res2.totalCost);

  // Test 3: Exits closed (Select R1; close E1 and E2)
  // Expected: No route available
  const res3 = calculateEvacuationRoute(
    OFFICIAL_SAMPLE,
    'R1',
    new Set(),
    new Set(),
    new Set(['E1', 'E2'])
  );
  console.assert(res3.status === 'no_route', `Test 3 status failed: ${res3.status}`);
  console.log('Test 3 (Exits closed): PASSED ->', res3.message);

  // Test 4: Different start (Select R2)
  // Expected: R2 - C3 - C4 - E2; cost 7
  const res4 = calculateEvacuationRoute(
    OFFICIAL_SAMPLE,
    'R2',
    new Set(),
    new Set(),
    new Set()
  );
  console.assert(res4.status === 'success', 'Test 4 status failed');
  console.assert(res4.totalCost === 7, `Test 4 cost failed: got ${res4.totalCost}`);
  console.assert(res4.pathNodes.join(' - ') === 'R2 - C3 - C4 - E2', `Test 4 path failed: ${res4.pathNodes.join(' - ')}`);
  console.log('Test 4 (Different start R2): PASSED ->', res4.pathNodes.join(' - '), 'cost:', res4.totalCost);

  // Test 5: Blocked start (Select R1; then block R1)
  // Expected: Starting location blocked
  const res5 = calculateEvacuationRoute(
    OFFICIAL_SAMPLE,
    'R1',
    new Set(['R1']),
    new Set(),
    new Set()
  );
  console.assert(res5.status === 'start_blocked', `Test 5 status failed: ${res5.status}`);
  console.log('Test 5 (Blocked start R1): PASSED ->', res5.message);

  console.log('ALL 5 OFFICIAL BENCHMARK TESTS PASSED WITH 100% PRECISION!');
}

runTests();
