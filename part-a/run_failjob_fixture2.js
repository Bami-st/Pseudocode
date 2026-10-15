/**
 * Part A1.3 — Fixture 2: Exhaustion Boundary on Final Retry (Edge Case)
 *
 * Executes the ORIGINAL failJob function from Background job/src/jobs.js
 * against the isolated PostgreSQL schema `pseudocode_verify` in database `test_bgjobs`.
 *
 * Credentials loaded from .env — never hardcoded.
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const host = process.env.TEST_DB_HOST || 'localhost';
const port = parseInt(process.env.TEST_DB_PORT || '5432', 10);
const user = process.env.TEST_DB_USER || 'postgres';
const password = process.env.TEST_DB_PASSWORD || 'postgres';
const encodedPassword = encodeURIComponent(password);

process.env.DATABASE_URL = `postgresql://${user}:${encodedPassword}@${host}:${port}/test_bgjobs?options=-c%20search_path=pseudocode_verify,public`;

const { Client } = require('pg');
const { failJob } = require('c:/Users/User/Desktop/Background job/src/jobs.js');
const pool = require('c:/Users/User/Desktop/Background job/src/db.js');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();

  try {
    console.log('=== PART A1.3: FIXTURE 2 VERIFICATION (failJob) ===');
    console.log('Target: Original failJob in Background job/src/jobs.js');
    console.log('Database: test_bgjobs | Schema: pseudocode_verify');

    await client.query('TRUNCATE pseudocode_verify.jobs;');

    const FIXTURE_ID = 'f2000000-0000-0000-0000-000000000002';
    const t0 = Date.now();
    const initialStartedAt = new Date(t0 - 60000);
    const initialNextRunAt = new Date(t0 - 60000);
    const initialUpdatedAt = new Date(t0 - 60000);

    await client.query(`
      INSERT INTO pseudocode_verify.jobs (
        id, type, status, attempts, max_attempts,
        last_error, next_run_at, started_at, finished_at,
        updated_at, idempotency_key
      ) VALUES (
        $1, 'generate_invoice', 'processing', 2, 3,
        'Prior transient failure', $2, $3, NULL,
        $4, 'key-f2'
      )
    `, [FIXTURE_ID, initialNextRunAt, initialStartedAt, initialUpdatedAt]);

    console.log('[Setup] Seeded initial job in "processing" state with attempts = 2, max_attempts = 3.');

    // Instrument Math.random to verify it is NOT called on the exhausted path
    const originalRandom = Math.random;
    let randomCallCount = 0;
    Math.random = () => {
      randomCallCount++;
      return originalRandom();
    };

    let returnedValue;
    const callTime = Date.now();
    try {
      returnedValue = await failJob({
        id: FIXTURE_ID,
        error: 'Fatal memory exhaustion',
        attempts: 2,
        maxAttempts: 3
      });
    } finally {
      Math.random = originalRandom; // Restore original
    }

    console.log('\n--- EXECUTION REPORT: FUNCTION RETURN VALUE ---');
    console.log(`typeof returnedValue: ${typeof returnedValue}`);
    console.log(`returnedValue: ${returnedValue}`);
    console.log(`Math.random calls: ${randomCallCount}`);

    console.log('\n--- EXECUTION REPORT: DATABASE STATE ---');
    const { rows } = await client.query(`
      SELECT id, type, status, attempts, max_attempts,
             last_error, next_run_at, started_at, finished_at,
             updated_at, idempotency_key
      FROM pseudocode_verify.jobs
      WHERE id = $1
    `, [FIXTURE_ID]);

    if (rows.length === 0) {
      throw new Error('Job record not found in database!');
    }

    const row = rows[0];
    console.log('Updated DB Row:', JSON.stringify(row, null, 2));

    console.log('\n=== FIELD-BY-FIELD COMPARISON ===');

    const returnMatch = returnedValue === undefined;
    console.log(`${returnMatch ? '✓' : '✗'} Return value: ${returnedValue} (predicted: undefined)`);

    const statusMatch = row.status === 'dead';
    console.log(`${statusMatch ? '✓' : '✗'} status: "${row.status}" (predicted: "dead")`);

    const attemptsMatch = row.attempts === 3;
    console.log(`${attemptsMatch ? '✓' : '✗'} attempts: ${row.attempts} (predicted: 3)`);

    const errorMatch = row.last_error === 'Fatal memory exhaustion';
    console.log(`${errorMatch ? '✓' : '✗'} last_error: "${row.last_error}" (predicted: "Fatal memory exhaustion")`);

    // finished_at set to database NOW()
    const finishedMatch = row.finished_at !== null;
    console.log(`${finishedMatch ? '✓' : '✗'} finished_at set: ${row.finished_at} (predicted: non-null NOW())`);

    // next_run_at retained initial value via COALESCE($4, next_run_at) where $4 is null
    const nextRunTime = new Date(row.next_run_at).getTime();
    const nextRunRetained = nextRunTime === initialNextRunAt.getTime();
    console.log(`${nextRunRetained ? '✓' : '✗'} next_run_at unchanged (COALESCE retained): ${nextRunRetained} (${new Date(row.next_run_at).toISOString()})`);

    // started_at should remain unchanged
    const startedMatch = new Date(row.started_at).getTime() === initialStartedAt.getTime();
    console.log(`${startedMatch ? '✓' : '✗'} started_at unchanged: ${startedMatch}`);

    // updated_at refreshed
    const updatedTime = new Date(row.updated_at).getTime();
    const updatedFresh = updatedTime >= t0 && updatedTime <= Date.now() + 1000;
    console.log(`${updatedFresh ? '✓' : '✗'} updated_at refreshed to database NOW(): ${updatedFresh}`);

    // Math.random call count check
    const randomNotCalled = randomCallCount === 0;
    console.log(`${randomNotCalled ? '✓' : '✗'} Math.random called: ${randomCallCount} times (predicted: 0)`);

  } finally {
    await client.end();
    await pool.end();
  }
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
