/**
 * Native execution script for Part A1.1 Fixture 2
 * Targets original recoverStuckJobs in Background job/src/jobs.js
 * Database: test_bgjobs | Schema: pseudocode_verify
 */

'use strict';

process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/test_bgjobs?options=-c%20search_path=pseudocode_verify,public';

const { Client } = require('pg');
const { recoverStuckJobs } = require('c:/Users/User/Desktop/Background job/src/jobs.js');

async function runFixture2() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('[Runner] Preparing isolated table in pseudocode_verify for Fixture 2...');
  await client.query('TRUNCATE pseudocode_verify.jobs;');

  const t0 = Date.now();
  console.log(`[Runner] Anchor Reference Time T0 = ${new Date(t0).toISOString()} (${t0})`);

  // Seed Row D
  const startedAt = new Date(t0 - 600000); // 10 minutes ago
  await client.query(`
    INSERT INTO jobs (id, type, status, started_at, attempts, max_attempts, last_error, next_run_at, updated_at, idempotency_key)
    VALUES
      ('d0000000-0000-0000-0000-00000000000d', 'sync_inventory', 'processing', $1, 2, 3, 'Prior fatal crash', $1, $1, 'key-d');
  `, [startedAt]);

  console.log('[Runner] Row D seeded. Invoking native recoverStuckJobs(60000)...');
  const returnedRows = await recoverStuckJobs(60000);
  console.log('[Runner] Function call returned.');

  // Query database state
  const dbResult = await client.query(`
    SELECT id, type, status, attempts, max_attempts, last_error, next_run_at, started_at, updated_at
    FROM jobs
    WHERE id = 'd0000000-0000-0000-0000-00000000000d';
  `);

  console.log('\n--- EXECUTION REPORT: RETURN VALUE ---');
  console.log(`Is Array: ${Array.isArray(returnedRows)}`);
  console.log(`Returned Row Count: ${returnedRows.length}`);
  console.log('Returned Rows Content:', JSON.stringify(returnedRows, null, 2));

  console.log('\n--- EXECUTION REPORT: DATABASE STATE ---');
  console.log('Database Row D in pseudocode_verify.jobs:', JSON.stringify(dbResult.rows[0], null, 2));

  // Check if next_run_at remained identical to startedAt
  const nextRunMatchesInitial = new Date(dbResult.rows[0].next_run_at).getTime() === startedAt.getTime();
  console.log(`next_run_at remained unchanged: ${nextRunMatchesInitial}`);

  await client.end();
}

runFixture2().catch(err => {
  console.error('[Runner Error]:', err);
  process.exit(1);
});
