/**
 * Part A1.3 — Fixture 3: Invalid Input / Genuine Failure Condition
 *
 * Executes the ORIGINAL failJob function from Background job/src/jobs.js
 * against the isolated PostgreSQL schema `pseudocode_verify` in database `test_bgjobs`.
 *
 * Case: Invalid UUID syntax ('not-a-valid-uuid') passed as opts.id.
 * The function executes in JavaScript until pool.query, where PostgreSQL
 * rejects with error 22P02 (invalid input syntax for type uuid).
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
    console.log('=== PART A1.3: FIXTURE 3 VERIFICATION (failJob) ===');
    console.log('Target: Original failJob in Background job/src/jobs.js');
    console.log('Database: test_bgjobs | Schema: pseudocode_verify');

    await client.query('TRUNCATE pseudocode_verify.jobs;');

    // Seed a valid job to ensure table is not completely empty
    const VALID_ID = 'f3000000-0000-0000-0000-000000000003';
    const t0 = Date.now();
    await client.query(`
      INSERT INTO pseudocode_verify.jobs (
        id, type, status, attempts, max_attempts,
        last_error, next_run_at, started_at, finished_at,
        updated_at, idempotency_key
      ) VALUES (
        $1, 'cleanup_logs', 'processing', 0, 3,
        NULL, $2, $2, NULL,
        $2, 'key-f3'
      )
    `, [VALID_ID, new Date(t0)]);

    console.log('[Setup] Seeded 1 baseline job in pseudocode_verify.jobs.');

    let thrownError = null;
    let returnedValue = null;

    const originalRandom = Math.random;
    Math.random = () => 0.5;

    try {
      returnedValue = await failJob({
        id: 'not-a-valid-uuid',
        error: 'Unhandled runtime fault',
        attempts: 0,
        maxAttempts: 3
      });
    } catch (err) {
      thrownError = err;
    } finally {
      Math.random = originalRandom; // Restore RNG
    }

    console.log('\n--- EXECUTION REPORT: FUNCTION ERROR / RETURN ---');
    console.log(`Did failJob throw? ${thrownError !== null}`);
    if (thrownError) {
      console.log(`Error name: ${thrownError.name}`);
      console.log(`Error code (PostgreSQL SQLSTATE): ${thrownError.code}`);
      console.log(`Error message: "${thrownError.message}"`);
    } else {
      console.log(`Returned value: ${returnedValue}`);
    }

    console.log('\n--- EXECUTION REPORT: DATABASE STATE ---');
    const { rows } = await client.query(`
      SELECT id, status, attempts, last_error, updated_at
      FROM pseudocode_verify.jobs
    `);
    console.log(`Total rows in table: ${rows.length}`);
    const baselineUnchanged = rows.length === 1 &&
      rows[0].id === VALID_ID &&
      rows[0].status === 'processing' &&
      rows[0].attempts === 0;
    console.log('Baseline row unchanged:', baselineUnchanged);

    console.log('\n=== FIELD-BY-FIELD COMPARISON ===');
    const didThrow = thrownError !== null;
    console.log(`${didThrow ? '✓' : '✗'} Rejection caught: ${didThrow}`);

    const codeMatch = thrownError && thrownError.code === '22P02';
    console.log(`${codeMatch ? '✓' : '✗'} SQLSTATE code: "${thrownError ? thrownError.code : ''}" (predicted: "22P02")`);

    const expectedMsg = 'invalid input syntax for type uuid: "not-a-valid-uuid"';
    const msgMatch = thrownError && thrownError.message === expectedMsg;
    console.log(`${msgMatch ? '✓' : '✗'} Error message: "${thrownError ? thrownError.message : ''}" (predicted: "${expectedMsg}")`);

    console.log(`${baselineUnchanged ? '✓' : '✗'} Database state unmodified (0 rows affected): ${baselineUnchanged}`);

  } finally {
    await client.end();
    await pool.end();
  }
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
