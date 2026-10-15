# Part A1.1: Most Complex Function from Own Work

## Provenance
- **Project**: Background Job System (`c:\Users\User\Desktop\Background job`)
- **Commit**: `69f3e5d` (*feat: background job system with evidence package*)
- **Source File**: `src/jobs.js` (lines 235-267)
- **Function Name**: `recoverStuckJobs`

---

## Source Implementation Reference
```javascript
/**
 * Find jobs that have been in `processing` status longer than `timeoutMs` and
 * reset them back to `failed` (or `dead` if exhausted) so they can be retried.
 *
 * CONCURRENT SAFETY
 * -----------------
 * The candidate selection uses FOR UPDATE SKIP LOCKED inside a CTE (the same
 * pattern as claimJobs). When two workers run this sweep at the same time,
 * each one locks a disjoint set of rows: worker A acquires a row-level lock and
 * worker B skips that row entirely. This guarantees that each stuck job has its
 * `attempts` counter incremented by exactly one worker, so retry limits and
 * dead-letter transitions remain accurate even under concurrent sweeps.
 *
 * @param {number} timeoutMs - how long (ms) before a processing job is considered stuck
 * @returns {Promise<object[]>} - recovered job rows
 */
async function recoverStuckJobs(timeoutMs) {
  const cutoff = new Date(Date.now() - timeoutMs);

  const { rows } = await pool.query(
    `WITH candidates AS (
       SELECT id
       FROM   jobs
       WHERE  status = 'processing'
         AND  started_at < $1
       FOR UPDATE SKIP LOCKED
     )
     UPDATE jobs
     SET  status     = CASE
                         WHEN attempts + 1 >= max_attempts THEN 'dead'
                         ELSE 'failed'
                       END,
          attempts   = attempts + 1,
          last_error = CONCAT(
                         COALESCE(last_error, ''),
                         ' | [recovered from stuck processing state at ',
                         NOW()::text, ']'
                       ),
          next_run_at = CASE
                          WHEN attempts + 1 < max_attempts
                          THEN NOW() + interval '1 minute'
                          ELSE next_run_at
                        END,
          updated_at = NOW()
     FROM candidates
     WHERE jobs.id = candidates.id
     RETURNING jobs.*`,
    [cutoff]
  );
  return rows;
}
```

---

## Supporting Definitions & Database Schema
- **Database Connection**: `pool` is an instance of `pg.Pool` executing PostgreSQL queries.
- **Verification Environment**: Dedicated test database `test_bgjobs`, isolated schema `pseudocode_verify` (`SET search_path = pseudocode_verify, public`).
- **Table Definition**:
  ```sql
  CREATE TABLE jobs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type             TEXT NOT NULL,
    payload          JSONB NOT NULL DEFAULT '{}',
    status           TEXT NOT NULL CHECK (status IN ('pending','processing','succeeded','failed','dead')),
    attempts         INTEGER NOT NULL DEFAULT 0,
    max_attempts     INTEGER NOT NULL DEFAULT 3,
    last_error       TEXT,
    next_run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at       TIMESTAMPTZ,
    finished_at      TIMESTAMPTZ,
    idempotency_key  TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id          TEXT NOT NULL DEFAULT 'anonymous'
  );
  ```

---

## Corrected Pseudocode Specification (Standard Compliance)

```markdown
FUNCTION recoverStuckJobs
INPUTS:
  timeoutMs: Integer or Number, duration in milliseconds after which a job in processing status is deemed stuck
OUTPUT:
  recoveredJobs: Array of Object, the list of job records updated and returned by the database
SIDE EFFECTS:
  WRITE database updates: for all qualifying candidate rows, increments attempts, appends timestamped recovery message to last_error, transitions status to 'dead' or 'failed', conditionally updates next_run_at, and sets updated_at to database NOW()
FAILS WHEN:
  CALL database query fails (e.g. connection lost or database error).
  NOTE: The code performs no input validation or parameter guards on timeoutMs. If an uncoercible input produces an Invalid Date in JavaScript, the function fails only downstream when PostgreSQL rejects the parameter during query execution.

1. CALL current system time in milliseconds.
2. SUBTRACT timeoutMs from current system time to calculate cutoff timestamp.
3. CALL database query passing cutoff timestamp as parameter $1:
   a. WITH candidates AS:
      SELECT id FROM jobs WHERE status is 'processing' AND started_at is earlier than $1, locking selected rows and skipping any already locked.
   b. UPDATE jobs for each candidate row:
      i. INCREMENT attempts by 1.
      ii. IF new attempts is greater than or equal to max_attempts:
          WRITE status to 'dead'.
          KEEP next_run_at unchanged.
      iii. OTHERWISE:
          WRITE status to 'failed'.
          WRITE next_run_at to database NOW() plus 1 minute.
      iv. CONCATENATE existing last_error (or empty string if null) with recovery message containing database NOW() and WRITE to last_error.
      v. WRITE updated_at to database NOW().
   c. RETURN all columns of all updated job rows.
4. RETURN recoveredJobs array.
```

---

## Concrete Input Fixtures (Executable & Isolated)

*Anchor Clock Reference: Execution timestamp `T0 = Date.now()` (and database `NOW()`)*

### Fixture 1: Normal Input (Standard Processing Timeout)
- **Function Call Argument**: `timeoutMs = 60000` (60 seconds)
- **Computed Cutoff**: `T0 - 60000ms` (1 minute before execution)
- **Initial Database State (`pseudocode_verify.jobs`)**:
  - **Row A** (`id: 'a0000000-0000-0000-0000-00000000000a'`, `type: 'send_email'`):
    - `status`: `'processing'`
    - `started_at`: `T0 - 180000ms` (3 minutes before T0)
    - `attempts`: `1`
    - `max_attempts`: `3`
    - `last_error`: `'Network timeout'`
    - `next_run_at`: `T0 - 180000ms`
    - `updated_at`: `T0 - 180000ms`
  - **Row B** (`id: 'b0000000-0000-0000-0000-00000000000b'`, `type: 'generate_report'`):
    - `status`: `'processing'`
    - `started_at`: `T0 - 30000ms` (30 seconds before T0)
    - `attempts`: `0`
    - `max_attempts`: `3`
    - `last_error`: `null`
    - `next_run_at`: `T0 - 30000ms`
    - `updated_at`: `T0 - 30000ms`
  - **Row C** (`id: 'c0000000-0000-0000-0000-00000000000c'`, `type: 'process_webhook'`):
    - `status`: `'pending'`
    - `started_at`: `null`
    - `attempts`: `0`
    - `max_attempts`: `3`
    - `last_error`: `null`
    - `next_run_at`: `T0 - 300000ms`
    - `updated_at`: `T0 - 300000ms`

---

### Fixture 2: Edge Case (Retry Limit Exhaustion Boundary)
- **Function Call Argument**: `timeoutMs = 60000` (60 seconds)
- **Computed Cutoff**: `T0 - 60000ms` (1 minute before execution)
- **Initial Database State (`pseudocode_verify.jobs`)**:
  - **Row D** (`id: 'd0000000-0000-0000-0000-00000000000d'`, `type: 'sync_inventory'`):
    - `status`: `'processing'`
    - `started_at`: `T0 - 600000ms` (10 minutes before T0)
    - `attempts`: `2`
    - `max_attempts`: `3`
    - `last_error`: `'Prior fatal crash'`
    - `next_run_at`: `T0 - 600000ms`
    - `updated_at`: `T0 - 600000ms`

---

### Fixture 3: Invalid / Non-Matching Edge Input
- **Function Call Argument**: `timeoutMs = -30000` (Negative duration)
- **Computed Cutoff**: `T0 - (-30000ms) = T0 + 30000ms` (Future timestamp)
- **Initial Database State (`pseudocode_verify.jobs`)**:
  - **Row E** (`id: 'e0000000-0000-0000-0000-00000000000e'`, `type: 'cleanup_logs'`):
    - `status`: `'succeeded'`
    - `started_at`: `T0 - 900000ms` (15 minutes before T0)
    - `attempts`: `1`
    - `max_attempts`: `3`
    - `last_error`: `null`
    - `next_run_at`: `T0 - 900000ms`
    - `updated_at`: `T0 - 890000ms`

---

## User Hand-Traced Predictions

### Prediction for Fixture 1 (Normal Input: timeoutMs = 60000):
- **Trace Mode**: Guided trace completed with AI assistance (not an unaided prediction).
- **Preserved Initial Mistakes & Corrections**:
  - *Mistake 1 (Attempts Counter)*: Initially kept `attempts` at 1. Correction: Step 3.b.i explicitly increments `attempts = attempts + 1`, so `attempts` increases from 1 to 2.
  - *Mistake 2 (Elapsed Duration vs Retry Time)*: Initially confused the 180,000ms elapsed duration (`started_at`) with the retry schedule. Correction: Step 3.b.iii calculates `next_run_at` forward from database `NOW() + interval '1 minute'`, so retry is scheduled at ~12:01 rather than relative to the elapsed time.
- **Recorded Trace So Far**:
  - **Cutoff Calculation**: Current time 12:00 minus 60,000ms yields cutoff timestamp 11:59.
  - **Candidate Qualification**: Only Row A qualifies (`status = 'processing'` AND `started_at` 11:57 < 11:59). Row B is excluded because its `started_at` (11:59:30) is not earlier than cutoff; Row C is excluded because its `status` is `'pending'`.
  - **Row A Status Transition**: Evaluates `attempts + 1 = 2 < max_attempts (3)` -> transitions to `'failed'`.
  - **Row A Attempts**: Increments from 1 to 2.
  - **Row A Next Run Time**: Updated to database time + 1 minute (approximately 12:01).
  - **Rows B and C**: Unchanged in the database.
- **Completed User Prediction**:
  - **Path Traced**: Step 1 (`Date.now()`) -> Step 2 (`cutoff = 11:59`) -> Step 3.a (locks Row A; excludes Row B & Row C) -> Step 3.b (increments Row A attempts to 2; status to `'failed'`; next_run_at to ~12:01; appends recovery notice to last_error; updated_at to ~12:00) -> Step 3.c / Step 4 (returns modified rows).
  - **Database Mutations**:
    - Row A (`a0000000-0000-0000-0000-00000000000a`): `status: 'failed'`, `attempts: 2`, `next_run_at: ~12:01` (NOW + 1 minute), `last_error: 'Network timeout | [recovered from stuck processing state at ...]'`, `updated_at: ~12:00` (NOW).
    - Row B (`b0000000-0000-0000-0000-00000000000b`): Unchanged (`status: 'processing'`, `attempts: 0`, `last_error: null`).
    - Row C (`c0000000-0000-0000-0000-00000000000c`): Unchanged (`status: 'pending'`, `attempts: 0`, `last_error: null`).
  - **Returned Value**:
    - Data structure: JavaScript `Array` of row objects.
    - Included rows: Exactly 1 item — Row A only (`id: 'a0000000-0000-0000-0000-00000000000a'`).
    - Value state: Newly updated values (`status: 'failed'`, `attempts: 2`, updated `last_error`, `next_run_at`, etc.).
- **Actual Execution Result (Native Run in `test_bgjobs.pseudocode_verify`)**:
  - **Function Return Value**:
    - Data structure: `Array` of length 1 (`[ { ... } ]`).
    - Row included: Only Row A (`id: 'a0000000-0000-0000-0000-00000000000a'`).
    - Values: `status: 'failed'`, `attempts: 2`, `last_error: 'Network timeout | [recovered from stuck processing state at 2026-10-15 14:31:04.934496+01]'`, `next_run_at: 2026-10-15T13:32:04.934Z` (NOW + 1 min), `updated_at: 2026-10-15T13:31:04.934Z`.
  - **Database State (`pseudocode_verify.jobs`)**:
    - Row A: Updated to `status: 'failed'`, `attempts: 2`, `last_error` appended, `next_run_at` advanced by 1 min.
    - Row B: Unchanged (`status: 'processing'`, `attempts: 0`, `last_error: null`).
    - Row C: Unchanged (`status: 'pending'`, `attempts: 0`, `last_error: null`).
- **Discrepancy / Tolerance Analysis**:
  - **Logic Discrepancy**: NONE (0 discrepancies). User hand-traced predictions matched actual execution across all fields.
  - **Timestamp Tolerances**:
    - Database `NOW()` evaluated at `14:31:04.934496+01` (~512ms after JavaScript $T_0$).
    - `next_run_at` scheduled by PostgreSQL via `NOW() + interval '1 minute'` produced exact 60-second forward jump with zero interval drift.
    - `last_error` formatting in PostgreSQL includes microsecond precision and timezone offset (`YYYY-MM-DD HH:MM:SS.UUUUUU+TZ`).

### Prediction for Fixture 2 (Edge Case: Exhaustion Boundary, timeoutMs = 60000):
- **Trace Mode**: Hand-traced prediction by user.
- **Completed User Prediction**:
  - **Path Traced**: Step 1 (`Date.now() = 12:00`) -> Step 2 (`cutoff = 11:59`) -> Step 3.a (Qualification: Row D qualifies because `status = 'processing'` and `started_at = 11:50 < 11:59`) -> Step 3.b (increments `attempts: 2 -> 3`; evaluates `3 >= max_attempts (3)` -> status transitions to `'dead'`; `next_run_at` remains unchanged at `11:50` because exhausted jobs are not rescheduled; appends timestamped recovery notice to `'Prior fatal crash'`; updates `updated_at` to ~`12:00`) -> Step 3.c / Step 4 (returns updated row).
  - **Database Mutations**:
    - Row D (`d0000000-0000-0000-0000-00000000000d`): `status: 'dead'`, `attempts: 3`, `next_run_at: 11:50` (unchanged), `last_error: 'Prior fatal crash | [recovered from stuck processing state at ...]'`, `updated_at: ~12:00` (database NOW).
  - **Returned Value**:
    - Data structure: JavaScript `Array` of length 1.
    - Included row: Row D only (`id: 'd0000000-0000-0000-0000-00000000000d'`).
    - Values: Newly updated values (`status: 'dead'`, `attempts: 3`, unchanged `next_run_at`, updated `last_error` and `updated_at`).
- **Actual Execution Result (Native Run in `test_bgjobs.pseudocode_verify`)**:
  - **Function Return Value**:
    - Data structure: `Array` of length 1 (`[ { ... } ]`).
    - Row included: Only Row D (`id: 'd0000000-0000-0000-0000-00000000000d'`).
    - Values: `status: 'dead'`, `attempts: 3`, `next_run_at: 2026-10-15T13:24:22.604Z` (unchanged), `last_error: 'Prior fatal crash | [recovered from stuck processing state at 2026-10-15 14:34:22.79375+01]'`, `updated_at: 2026-10-15T13:34:22.793Z`.
  - **Database State (`pseudocode_verify.jobs`)**:
    - Row D: Updated to `status: 'dead'`, `attempts: 3`, `last_error` appended, `next_run_at` retained original value (not scheduled for retry).
- **Discrepancy / Tolerance Analysis**:
  - **Logic Discrepancy**: NONE (0 discrepancies). Hand-traced prediction matched native execution on every field.
  - **Exhaustion Boundary Behavior**: Confirmed that `attempts + 1 >= max_attempts` branch triggers `'dead'` status and leaves `next_run_at` unchanged, preventing dead jobs from re-entering active worker sweeps.
  - **Timestamp Tolerances**:
    - `next_run_at` retained exact millisecond equality with initial timestamp (`13:24:22.604Z`).
    - `updated_at` was set to database transaction timestamp `NOW()` (`13:34:22.793Z`).

### Prediction for Fixture 3 (Invalid / Non-Matching Edge Input: timeoutMs = -30000):
- **Trace Mode**: Guided trace completed with AI assistance.
- **Completed User Prediction**:
  - **Path Traced**: Step 1 (`Date.now() = 12:00:00`) -> Step 2 (`cutoff = 12:00:30` because subtracting a negative duration advances the timestamp forward) -> Step 3.a (Qualification check: Row E has `status = 'succeeded'`, failing the predicate `status = 'processing'`; 0 rows locked into `candidates` CTE) -> Step 3.b (no rows to update) -> Step 3.c / Step 4 (returns empty rows array).
  - **Database Mutations**: Row E remains completely unchanged in the database (`status: 'succeeded'`, `attempts: 1`, `last_error: null`, `next_run_at: 11:45:00`). Zero rows modified.
  - **Returned Value**:
    - Data structure: JavaScript `Array`.
    - Content: Empty array `[]` (length 0).
- **Actual Execution Result (Native Run in `test_bgjobs.pseudocode_verify`)**:
  - **Function Return Value**:
    - Data structure: `Array` of length 0 (`[]`).
    - Row count: 0 (no items in array).
  - **Database State (`pseudocode_verify.jobs`)**:
    - Row E: Completely unchanged (`status: 'succeeded'`, `attempts: 1`, `last_error: null`, `updated_at: 2026-10-15T13:23:51.451Z`).
    - Verified `rowUnchanged === true`.
- **Discrepancy / Tolerance Analysis**:
  - **Logic Discrepancy**: NONE (0 discrepancies). Hand-traced prediction matched native execution.
  - **Predicate Selectivity**: Even though negative `timeoutMs` moves the cutoff parameter into the future (`12:00:30`), the status predicate `status = 'processing'` strictly filters out non-processing jobs (`status: 'succeeded'`), ensuring that completed or failed jobs are never erroneously reset.
  - **Timestamp Tolerances**:
    - `updated_at` retained exact millisecond identity with the initial timestamp (`13:23:51.451Z`), proving zero database write operations were triggered.
