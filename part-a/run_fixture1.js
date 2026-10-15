/**
 * Native execution script for Part A1.1 Fixture 1
 * Targets original recoverStuckJobs in Background job/src/jobs.js
 * Database: test_bgjobs | Schema: pseudocode_verify
 */

'use strict';

process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/test_bgjobs?options=-c%20search_path=pseudocode_verify,public';

const { Client } = require('pg');
const { recoverStuckJobs } = require('c:/Users/User/Desktop/Background job/src/jobs.js');

async function runFixture1() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('[Runner] Preparing isolated table in pseudocode_verify...');
  await client.query('TRUNCATE pseudocode_verify.jobs;');

  const t0 = Date.now();
  console.log(`[Runner] Anchor Reference Time T0 = ${new Date(t0).toISOString()} (${t0})`);

  // Seed initial rows
  await client.query(`
    INSERT INTO jobs (id, type, status, started_at, attempts, max_attempts, last_error, next_run_at, updated_at, idempotency_key)
    VALUES
      ('a0000000-0000-0000-0000-00000000000a', 'send_email', 'processing', $1, 1, 3, 'Network timeout', $1, $1, 'key-a'),
      ('b0000000-0000-0000-0000-00000000000b', 'generate_report', 'processing', $2, 0, 3, NULL, $2, $2, 'key-b'),
      ('c0000000-0000-0000-0000-00000000000c', 'process_webhook', 'pending', NULL, 0, 3, NULL, $3, $3, 'key-c');
  `, [
    new Date(t0 - 180000), // Row A: 3 minutes ago
    new Date(t0 - 30000),  // Row B: 30 seconds ago
    new Date(t0 - 300000)  // Row C: 5 minutes ago
  ]);

  console.log('[Runner] Initial rows seeded. Invoking native recoverStuckJobs(60000)...');
  const returnedRows = await recoverStuckJobs(60000);
  console.log('[Runner] Function call returned.');

  // Query database state for all three rows
  const dbResult = await client.query(`
    SELECT id, type, status, attempts, max_attempts, last_error, next_run_at, started_at, updated_at
    FROM jobs
    ORDER BY id ASC;
  `);

  console.log('\n--- EXECUTION REPORT: RETURN VALUE ---');
  console.log(`Is Array: ${Array.isArray(returnedRows)}`);
  console.log(`Returned Row Count: ${returnedRows.length}`);
  console.log('Returned Rows Content:', JSON.stringify(returnedRows, null, 2));

  console.log('\n--- EXECUTION REPORT: DATABASE STATE ---');
  console.log('Database Rows in pseudocode_verify.jobs:', JSON.stringify(dbResult.rows, null, 2));

  await client.end();
}

runFixture1().catch(err => {
  console.error('[Runner Error]:', err);
  process.exit(1);
});
