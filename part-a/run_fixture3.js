/**
 * Native execution script for Part A1.1 Fixture 3
 * Targets original recoverStuckJobs in Background job/src/jobs.js
 * Database: test_bgjobs | Schema: pseudocode_verify
 */

'use strict';

process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/test_bgjobs?options=-c%20search_path=pseudocode_verify,public';

const { Client } = require('pg');
const { recoverStuckJobs } = require('c:/Users/User/Desktop/Background job/src/jobs.js');

async function runFixture3() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('[Runner] Preparing isolated table in pseudocode_verify for Fixture 3...');
  await client.query('TRUNCATE pseudocode_verify.jobs;');

  const t0 = Date.now();
  console.log(`[Runner] Anchor Reference Time T0 = ${new Date(t0).toISOString()} (${t0})`);

  // Seed Row E
  const startedAt = new Date(t0 - 900000); // 15 minutes ago
  const updatedAt = new Date(t0 - 890000);
  await client.query(`
    INSERT INTO jobs (id, type, status, started_at, attempts, max_attempts, last_error, next_run_at, updated_at, idempotency_key)
    VALUES
      ('e0000000-0000-0000-0000-00000000000e', 'cleanup_logs', 'succeeded', $1, 1, 3, NULL, $1, $2, 'key-e');
  `, [startedAt, updatedAt]);

  console.log('[Runner] Row E seeded. Invoking native recoverStuckJobs(-30000)...');
  const returnedRows = await recoverStuckJobs(-30000);
  console.log('[Runner] Function call returned.');

  // Query database state
  const dbResult = await client.query(`
    SELECT id, type, status, attempts, max_attempts, last_error, next_run_at, started_at, updated_at
    FROM jobs
    WHERE id = 'e0000000-0000-0000-0000-00000000000e';
  `);

  console.log('\n--- EXECUTION REPORT: RETURN VALUE ---');
  console.log(`Is Array: ${Array.isArray(returnedRows)}`);
  console.log(`Returned Row Count: ${returnedRows.length}`);
  console.log('Returned Rows Content:', JSON.stringify(returnedRows, null, 2));

  console.log('\n--- EXECUTION REPORT: DATABASE STATE ---');
  console.log('Database Row E in pseudocode_verify.jobs:', JSON.stringify(dbResult.rows[0], null, 2));

  // Assertions
  const rowUnchanged = (
    dbResult.rows[0].status === 'succeeded' &&
    dbResult.rows[0].attempts === 1 &&
    dbResult.rows[0].last_error === null &&
    new Date(dbResult.rows[0].updated_at).getTime() === updatedAt.getTime()
  );
  console.log(`Row E completely unchanged in DB: ${rowUnchanged}`);

  await client.end();
}

runFixture3().catch(err => {
  console.error('[Runner Error]:', err);
  process.exit(1);
});
