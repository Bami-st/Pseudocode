/**
 * Test Database Verifier
 * Verifies that test_bgjobs is accessible and has the required schema.
 */
'use strict';

const { Client } = require('pg');

async function checkTestDb() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/test_bgjobs'
  });

  await client.connect();
  console.log('Connected to test_bgjobs successfully.');

  // Run migration DDL if table does not exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type             TEXT        NOT NULL,
      payload          JSONB       NOT NULL DEFAULT '{}',
      status           TEXT        NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','processing','succeeded','failed','dead')),
      attempts         INTEGER     NOT NULL DEFAULT 0,
      max_attempts     INTEGER     NOT NULL DEFAULT 3,
      last_error       TEXT,
      next_run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      started_at       TIMESTAMPTZ,
      finished_at      TIMESTAMPTZ,
      idempotency_key  TEXT        NOT NULL,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_id          TEXT        NOT NULL DEFAULT 'anonymous'
    );
  `);
  console.log('Verified jobs table in test_bgjobs.');

  const res = await client.query('SELECT COUNT(*) FROM jobs;');
  console.log(`Current rows in test_bgjobs.jobs: ${res.rows[0].count}`);

  await client.end();
}

checkTestDb().catch(err => {
  console.error('Test DB setup error:', err);
  process.exit(1);
});
