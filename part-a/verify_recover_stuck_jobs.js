/**
 * Part A1.1 Verification Harness for recoverStuckJobs
 *
 * Runs the ORIGINAL recoverStuckJobs function from `Background job/src/jobs.js`
 * against the isolated schema `pseudocode_verify` in database `test_bgjobs`.
 *
 * Zero mutations to application records.
 */

'use strict';

// Direct connection to isolated test schema
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/test_bgjobs?options=-c%20search_path=pseudocode_verify,public';

const { Client } = require('pg');
const { recoverStuckJobs } = require('c:/Users/User/Desktop/Background job/src/jobs.js');

async function runFixtureVerification() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();

  console.log('====================================================');
  console.log('PART A1.1 NATIVE EXECUTION VERIFICATION: recoverStuckJobs');
  console.log('Target: Original source in Background job/src/jobs.js');
  console.log('Database: test_bgjobs | Schema: pseudocode_verify');
  console.log('====================================================\n');

  // Helper to reset and seed
  async function resetTable() {
    await client.query('TRUNCATE pseudocode_verify.jobs;');
  }

  // --- Fixture 1 ---
  console.log('>>> Executing Fixture 1 (Normal Input: timeoutMs = 60000)...');
  await resetTable();
  const t0_1 = Date.now();
  await client.query(`
    INSERT INTO jobs (id, type, status, started_at, attempts, max_attempts, last_error, next_run_at, updated_at, idempotency_key)
    VALUES
      ('a0000000-0000-0000-0000-00000000000a', 'send_email', 'processing', $1, 1, 3, 'Network timeout', $1, $1, 'key-a'),
      ('b0000000-0000-0000-0000-00000000000b', 'generate_report', 'processing', $2, 0, 3, NULL, $2, $2, 'key-b'),
      ('c0000000-0000-0000-0000-00000000000c', 'process_webhook', 'pending', NULL, 0, 3, NULL, $3, $3, 'key-c');
  `, [
    new Date(t0_1 - 180000),
    new Date(t0_1 - 30000),
    new Date(t0_1 - 300000)
  ]);

  const f1_returned = await recoverStuckJobs(60000);
  const f1_db = (await client.query('SELECT id, status, attempts, last_error, next_run_at FROM jobs ORDER BY id;')).rows;

  console.log('Fixture 1 Execution Finished.');

  // --- Fixture 2 ---
  console.log('\n>>> Executing Fixture 2 (Edge Case: Exhaustion Boundary, timeoutMs = 60000)...');
  await resetTable();
  const t0_2 = Date.now();
  await client.query(`
    INSERT INTO jobs (id, type, status, started_at, attempts, max_attempts, last_error, next_run_at, updated_at, idempotency_key)
    VALUES
      ('d0000000-0000-0000-0000-00000000000d', 'sync_inventory', 'processing', $1, 2, 3, 'Prior fatal crash', $1, $1, 'key-d');
  `, [new Date(t0_2 - 600000)]);

  const f2_returned = await recoverStuckJobs(60000);
  const f2_db = (await client.query('SELECT id, status, attempts, last_error, next_run_at FROM jobs ORDER BY id;')).rows;

  console.log('Fixture 2 Execution Finished.');

  // --- Fixture 3 ---
  console.log('\n>>> Executing Fixture 3 (Edge/Invalid Case: timeoutMs = -30000)...');
  await resetTable();
  const t0_3 = Date.now();
  await client.query(`
    INSERT INTO jobs (id, type, status, started_at, attempts, max_attempts, last_error, next_run_at, updated_at, idempotency_key)
    VALUES
      ('e0000000-0000-0000-0000-00000000000e', 'cleanup_logs', 'succeeded', $1, 1, 3, NULL, $1, $1, 'key-e');
  `, [new Date(t0_3 - 900000)]);

  const f3_returned = await recoverStuckJobs(-30000);
  const f3_db = (await client.query('SELECT id, status, attempts, last_error, next_run_at FROM jobs ORDER BY id;')).rows;

  console.log('Fixture 3 Execution Finished.\n');

  await resetTable();
  await client.end();

  return {
    fixture1: { returned: f1_returned, dbState: f1_db },
    fixture2: { returned: f2_returned, dbState: f2_db },
    fixture3: { returned: f3_returned, dbState: f3_db }
  };
}

if (require.main === module) {
  runFixtureVerification().then(results => {
    console.log('Execution verification harness ready.');
  }).catch(err => {
    console.error('Harness execution failed:', err);
    process.exit(1);
  });
}

module.exports = { runFixtureVerification };
