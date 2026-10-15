/**
 * Part A1.3 — Fixture 1: Normal Failure with Retries Remaining
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

// Configure DATABASE_URL for Background job's db.js pool before requiring jobs.js
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
    console.log('=== PART A1.3: FIXTURE 1 VERIFICATION (failJob) ===');
    console.log('Target: Original failJob in Background job/src/jobs.js');
    console.log('Database: test_bgjobs | Schema: pseudocode_verify');

    // Reset table
    await client.query('TRUNCATE pseudocode_verify.jobs;');

    const FIXTURE_ID = 'f1000000-0000-0000-0000-000000000001';
    const t0 = Date.now();
    const initialStartedAt = new Date(t0 - 10000);
    const initialNextRunAt = new Date(t0 - 60000);
    const initialUpdatedAt = new Date(t0 - 10000);

    // Seed fixture 1 record
    await client.query(`
      INSERT INTO pseudocode_verify.jobs (
        id, type, status, attempts, max_attempts,
        last_error, next_run_at, started_at, finished_at,
        updated_at, idempotency_key
      ) VALUES (
        $1, 'process_image', 'processing', 0, 3,
        NULL, $2, $3, NULL,
        $4, 'key-f1'
      )
    `, [FIXTURE_ID, initialNextRunAt, initialStartedAt, initialUpdatedAt]);

    console.log('[Setup] Seeded initial job in "processing" state with attempts = 0, max_attempts = 3.');

    // Control RNG to verify exact 0-jitter case, then restore
    const originalRandom = Math.random;
    Math.random = () => 0.5; // (0.5 * 2 - 1) = 0 -> zero jitter

    let returnedValue;
    let callTime;
    try {
      callTime = Date.now();
      returnedValue = await failJob({
        id: FIXTURE_ID,
        error: 'ECONNRESET: socket hang up',
        attempts: 0,
        maxAttempts: 3
      });
    } finally {
      Math.random = originalRandom; // Always restore
    }

    console.log('\n--- EXECUTION REPORT: FUNCTION RETURN VALUE ---');
    console.log(`typeof returnedValue: ${typeof returnedValue}`);
    console.log(`returnedValue: ${returnedValue}`);

    // Query database state
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

    // Field-by-field comparison
    console.log('\n=== FIELD-BY-FIELD COMPARISON ===');

    const returnMatch = returnedValue === undefined;
    console.log(`${returnMatch ? '✓' : '✗'} Return value: ${returnedValue} (predicted: undefined)`);

    const statusMatch = row.status === 'failed';
    console.log(`${statusMatch ? '✓' : '✗'} status: "${row.status}" (predicted: "failed")`);

    const attemptsMatch = row.attempts === 1;
    console.log(`${attemptsMatch ? '✓' : '✗'} attempts: ${row.attempts} (predicted: 1)`);

    const errorMatch = row.last_error === 'ECONNRESET: socket hang up';
    console.log(`${errorMatch ? '✓' : '✗'} last_error: "${row.last_error}" (predicted: "ECONNRESET: socket hang up")`);

    const finishedMatch = row.finished_at === null;
    console.log(`${finishedMatch ? '✓' : '✗'} finished_at: ${row.finished_at} (predicted: null)`);

    // started_at should remain unchanged
    const startedMatch = new Date(row.started_at).getTime() === initialStartedAt.getTime();
    console.log(`${startedMatch ? '✓' : '✗'} started_at unchanged: ${startedMatch}`);

    // next_run_at check with Math.random fixed at 0.5 -> exactly callTime + 5000ms
    const nextRunTime = new Date(row.next_run_at).getTime();
    const expectedZeroJitterTime = callTime + 5000;
    const timingDiffMs = Math.abs(nextRunTime - expectedZeroJitterTime);
    // Allow up to 100ms tolerance for clock resolution between callTime capture and Date.now() inside failJob
    const timingMatch = timingDiffMs <= 100;
    console.log(`${timingMatch ? '✓' : '✗'} next_run_at timing: actual=${new Date(row.next_run_at).toISOString()}, expected ~=${new Date(expectedZeroJitterTime).toISOString()} (diff: ${timingDiffMs}ms, tolerance: <=100ms)`);

    // Jitter bounds verification
    const minBound = callTime + 3750;
    const maxBound = callTime + 6250;
    const withinBounds = nextRunTime >= minBound && nextRunTime <= maxBound;
    console.log(`${withinBounds ? '✓' : '✗'} next_run_at within [3750ms, 6250ms] bounds: ${withinBounds}`);

    // updated_at was refreshed
    const updatedTime = new Date(row.updated_at).getTime();
    const updatedFresh = updatedTime >= t0 && updatedTime <= Date.now() + 1000;
    console.log(`${updatedFresh ? '✓' : '✗'} updated_at refreshed to database NOW(): ${updatedFresh}`);

  } finally {
    await client.end();
    await pool.end();
  }
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
