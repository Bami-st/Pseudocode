# Part A1.3: Error Handling Function from Own Work

## Provenance
- **Project**: Background Job System (`c:\Users\User\Desktop\Background job`)
- **Commit**: `69f3e5d` (*feat: background job system with evidence package*)
- **Source File**: `src/jobs.js` (lines 180-215)
- **Function Name**: `failJob`

---

## Source Implementation Reference
```javascript
async function failJob({ id, error, attempts, maxAttempts }) {
  const newAttempts = attempts + 1;
  const exhausted = newAttempts >= maxAttempts;

  let nextRunAt = null;
  if (!exhausted) {
    const baseDelay = parseInt(process.env.JOB_BASE_DELAY_MS || '5000', 10);
    const maxDelay  = parseInt(process.env.JOB_MAX_DELAY_MS  || '300000', 10);
    // Exponential backoff: base * 2^(newAttempts-1), capped, plus ±25% jitter.
    const exp = Math.min(baseDelay * Math.pow(2, newAttempts - 1), maxDelay);
    const jitter = exp * 0.25 * (Math.random() * 2 - 1);
    nextRunAt = new Date(Date.now() + exp + jitter);
  }

  await pool.query(
    `UPDATE jobs
     SET  status      = $1,
          attempts    = $2,
          last_error  = $3,
          next_run_at = COALESCE($4, next_run_at),
          finished_at = CASE WHEN $1 = 'dead' THEN NOW() ELSE NULL END,
          updated_at  = NOW()
     WHERE id = $5`,
    [exhausted ? 'dead' : 'failed', newAttempts, error, nextRunAt, id]
  );
}
```

---

## Pseudocode Specification (Standard Compliance & Actual Behaviour)

> [!NOTE]
> **Audit Discrepancy Note**: The initial draft of this specification incorrectly listed an object return value (`{ status, newAttempts, nextRunAt }`). As confirmed by [`src/jobs.js` (lines 180–215)](file:///c:/Users/User/Desktop/Background%20job/src/jobs.js#L180-L215), `failJob` does not contain a `return` statement after `await pool.query(...)`. The function therefore evaluates to `undefined` (`Promise<void>`).

```markdown
FUNCTION failJob
INPUTS:
  opts.id: String (UUID), unique identifier of the job
  opts.error: String, error description or stack trace to record
  opts.attempts: Integer, count of attempts completed prior to this failure
  opts.maxAttempts: Integer, maximum allowed attempts before job exhaustion
OUTPUT:
  None (Promise resolves to undefined)
SIDE EFFECTS:
  WRITE database UPDATE on jobs table for row where id = opts.id:
    - status: 'dead' if (attempts + 1) >= maxAttempts, else 'failed'
    - attempts: attempts + 1
    - last_error: opts.error
    - next_run_at: scheduled Date if retriable, or left unchanged via COALESCE if exhausted
    - finished_at: database NOW() if status is 'dead', else NULL
    - updated_at: database NOW()
FAILS WHEN:
  - Database pool query fails (e.g., connection lost, invalid UUID syntax)
  - Parameter destructuring fails (e.g., opts is null or undefined)

1. CALCULATE newAttempts = attempts + 1.
2. EVALUATE exhausted = (newAttempts >= maxAttempts).
3. SET nextRunAt = null.
4. IF exhausted is false:
   a. READ baseDelay from process.env.JOB_BASE_DELAY_MS (default 5000).
   b. READ maxDelay from process.env.JOB_MAX_DELAY_MS (default 300000).
   c. CALCULATE exp = MIN(baseDelay * 2^(newAttempts - 1), maxDelay).
   d. CALCULATE jitter = exp * 0.25 * (random float in range [-1.0, 1.0)).
   e. CONSTRUCT nextRunAt = Date(current system time + exp + jitter).
5. EXECUTE database UPDATE query on jobs WHERE id = id:
   - status = (exhausted ? 'dead' : 'failed')
   - attempts = newAttempts
   - last_error = error
   - next_run_at = COALESCE(nextRunAt, next_run_at)
   - finished_at = CASE WHEN status = 'dead' THEN NOW() ELSE NULL END
   - updated_at = NOW()
6. RETURN (implicit undefined).
```

---

## Concrete Input Fixtures (Isolated Test Schema)

Target: Database `test_bgjobs`, schema `pseudocode_verify.jobs`.

---

## Human Hand Traces

### Fixture 1 — Normal Failure with Retries Remaining

**Initial Database Record (`pseudocode_verify.jobs`):**
- `id`: `'f1000000-0000-0000-0000-000000000001'`
- `type`: `'process_image'`
- `status`: `'processing'`
- `attempts`: `0`
- `max_attempts`: `3`
- `last_error`: `null`
- `next_run_at`: `T0 - 60000ms`
- `finished_at`: `null`
- `started_at`: `T0 - 10000ms`
- `updated_at`: `T0 - 10000ms`

**Function Input Arguments:**
```javascript
{
  id: 'f1000000-0000-0000-0000-000000000001',
  error: 'ECONNRESET: socket hang up',
  attempts: 0,
  maxAttempts: 3
}
```

**Prediction (user-authored with AI guidance):**
- Return value: `undefined` (no return statement in source).
- Database `status`: `'failed'` (new attempts `1 < 3`).
- `attempts`: `1` (incremented from 0).
- Retry scheduling (`next_run_at`):
  - `exp = MIN(5000 * 2^0, 300000) = 5000ms`.
  - Jitter window: `[-1250ms, +1250ms]`, producing mathematical retry delay between `3750ms` inclusive and `6250ms` exclusive.
  - With `Math.random` fixed at `0.5`, jitter is `0`, yielding exactly `Date.now() + 5000ms`.
- Stored fields:
  - `finished_at`: `null`.
  - `updated_at`: current database time `NOW()`.
  - `last_error`: `'ECONNRESET: socket hang up'`.
  - `started_at`: unchanged.
- Execution path: Steps 1–3, Step 4 (branches a–e), Step 5 (database update), Step 6 (implicit undefined).

**Native Execution Result (original function in `Background job/src/jobs.js`):**

Verification script: [`run_failjob_fixture1.js`](file:///c:/Users/User/Desktop/Pseudocode/part-a/run_failjob_fixture1.js)

```json
Updated DB Row: {
  "id": "f1000000-0000-0000-0000-000000000001",
  "type": "process_image",
  "status": "failed",
  "attempts": 1,
  "max_attempts": 3,
  "last_error": "ECONNRESET: socket hang up",
  "next_run_at": "2026-10-15T17:47:02.263Z",
  "started_at": "2026-10-15T17:46:47.224Z",
  "finished_at": null,
  "updated_at": "2026-10-15T17:46:57.361Z",
  "idempotency_key": "key-f1"
}
```

**Field-by-Field Comparison:**

| Field | Predicted | Actual | Match |
| :--- | :--- | :--- | :--- |
| Return Value | `undefined` | `undefined` | ✓ |
| `status` | `"failed"` | `"failed"` | ✓ |
| `attempts` | `1` | `1` | ✓ |
| `last_error` | `"ECONNRESET: socket hang up"` | `"ECONNRESET: socket hang up"` | ✓ |
| `finished_at` | `null` | `null` | ✓ |
| `started_at` | Unchanged | Unchanged | ✓ |
| `next_run_at` (zero-jitter offset) | `callTime + 5000ms` | `callTime + 5000ms` (diff: 0ms) | ✓ |
| `next_run_at` within `[3750ms, 6250ms]` | yes | yes | ✓ |
| `updated_at` | Database `NOW()` | Database `NOW()` | ✓ |

**Result: 9/9 fields match. Zero discrepancies.**

---

### Distinction: Directly Observed External Behavior vs. Source-Traced Internal Behavior (Fixture 1)

1. **Directly Observed Externally (JavaScript Return & Database Row State)**:
   - Call evaluates to `undefined`.
   - In database `pseudocode_verify.jobs`: `status` transitioned to `'failed'`, `attempts` became `1`, `last_error` was updated to `'ECONNRESET: socket hang up'`, `finished_at` remained `null`, `next_run_at` advanced by 5000ms, and `updated_at` was stamped with PostgreSQL `NOW()`.
2. **Source-Traced Internal Behavior (In-Memory Math & Logic Flow)**:
   - `newAttempts = 0 + 1 = 1`.
   - `exhausted = 1 >= 3 = false`.
   - `nextRunAt` was computed as `new Date(Date.now() + 5000 + 0)`.
   - Parameter array passed to `pool.query`: `['failed', 1, 'ECONNRESET: socket hang up', nextRunAt, 'f1000000-0000-0000-0000-000000000001']`.
   - SQL evaluated `CASE WHEN $1 = 'dead' THEN NOW() ELSE NULL END` which selected `NULL` because `$1` is `'failed'`.

---

### Fixture 2 — Edge Case: Exhaustion Boundary on Final Retry

**Initial Database Record (`pseudocode_verify.jobs`):**
- `id`: `'f2000000-0000-0000-0000-000000000002'`
- `type`: `'generate_invoice'`
- `status`: `'processing'`
- `attempts`: `2`
- `max_attempts`: `3`
- `last_error`: `'Prior transient failure'`
- `next_run_at`: `T0 - 60000ms`
- `finished_at`: `null`
- `started_at`: `T0 - 60000ms`
- `updated_at`: `T0 - 60000ms`

**Function Input Arguments:**
```javascript
{
  id: 'f2000000-0000-0000-0000-000000000002',
  error: 'Fatal memory exhaustion',
  attempts: 2,
  maxAttempts: 3
}
```

**Prediction (user-authored with AI guidance):**
- Return value: `undefined`.
- Status: `"dead"`, because the new attempt count reaches maxAttempts (`2 + 1 = 3 >= 3`).
- Attempts: increase from 2 to 3.
- Retry scheduling:
  - `nextRunAt` remains `null` in memory.
  - Step 4's backoff and jitter calculations are skipped; `Math.random` is called 0 times.
  - SQL `COALESCE($4, next_run_at)` preserves the database's existing `next_run_at` value (`T0 - 60000ms`), rather than replacing it with `NULL`.
- Timestamp fields:
  - `finished_at`: current database time `NOW()`.
  - `updated_at`: current database time `NOW()`.
  - `started_at`: remains unchanged.
- `last_error`: overwritten with `"Fatal memory exhaustion"`.
- Execution path: Steps 1–3, evaluate Step 4 condition and skip its body, execute Step 5 database update, resolve to undefined at Step 6.

**Native Execution Result (original function in `Background job/src/jobs.js`):**

Verification script: [`run_failjob_fixture2.js`](file:///c:/Users/User/Desktop/Pseudocode/part-a/run_failjob_fixture2.js)

```json
Updated DB Row: {
  "id": "f2000000-0000-0000-0000-000000000002",
  "type": "generate_invoice",
  "status": "dead",
  "attempts": 3,
  "max_attempts": 3,
  "last_error": "Fatal memory exhaustion",
  "next_run_at": "2026-10-15T18:08:49.275Z",
  "started_at": "2026-10-15T18:08:49.275Z",
  "finished_at": "2026-10-15T18:09:49.388Z",
  "updated_at": "2026-10-15T18:09:49.388Z",
  "idempotency_key": "key-f2"
}
```

**Field-by-Field Comparison:**

| Field | Predicted | Actual | Match |
| :--- | :--- | :--- | :--- |
| Return Value | `undefined` | `undefined` | ✓ |
| `status` | `"dead"` | `"dead"` | ✓ |
| `attempts` | `3` | `3` | ✓ |
| `last_error` | `"Fatal memory exhaustion"` | `"Fatal memory exhaustion"` | ✓ |
| `finished_at` | Database `NOW()` (non-null) | Database `NOW()` (non-null) | ✓ |
| `next_run_at` | Retained via `COALESCE` (`T0 - 60s`) | Retained via `COALESCE` (`T0 - 60s`) | ✓ |
| `started_at` | Unchanged | Unchanged | ✓ |
| `updated_at` | Database `NOW()` | Database `NOW()` | ✓ |
| `Math.random` invocations | 0 | 0 | ✓ |

**Result: 9/9 fields match. Zero discrepancies.**

---

### Distinction: Directly Observed External Behavior vs. Source-Traced Internal Behavior (Fixture 2)

1. **Directly Observed Externally (JavaScript Return & Database Row State)**:
   - Call evaluates to `undefined`.
   - `status` transitioned to `'dead'`, `attempts` reached `3`, `last_error` was overwritten, `finished_at` was populated with PostgreSQL `NOW()`, and `next_run_at` retained its prior value.
2. **Source-Traced Internal Behavior (In-Memory Math & Logic Flow)**:
   - `newAttempts = 2 + 1 = 3`.
   - `exhausted = 3 >= 3 = true`.
   - In-memory `nextRunAt` was never assigned, remaining `null`.
   - Step 4 was skipped entirely; neither `Date.now()` nor `Math.random()` was called for backoff computation.
   - Parameter array passed to `pool.query`: `['dead', 3, 'Fatal memory exhaustion', null, 'f2000000-0000-0000-0000-000000000002']`.
   - In PostgreSQL, `CASE WHEN $1 = 'dead' THEN NOW() ELSE NULL END` evaluated to `NOW()`, setting `finished_at`.
   - In PostgreSQL, `COALESCE($4, next_run_at)` evaluated to `COALESCE(NULL, next_run_at) = next_run_at`, preserving the existing column value.

---

### Fixture 3 — Invalid Input / Genuine Failure Condition (Database Driver Rejection)

**Initial Database Record (`pseudocode_verify.jobs`):**
- Baseline row `f3000000-0000-0000-0000-000000000003` (`type: 'cleanup_logs'`, `status: 'processing'`, `attempts: 0`, `max_attempts: 3`).

**Function Input Arguments:**
```javascript
{
  id: 'not-a-valid-uuid',
  error: 'Unhandled runtime fault',
  attempts: 0,
  maxAttempts: 3
}
```

**Prediction (user-authored with AI guidance):**
- Outcome: Promise rejects rather than resolving normally. PostgreSQL raises invalid UUID syntax with SQLSTATE code `"22P02"`, surfaced as an error by `pg`. Expected message: `invalid input syntax for type uuid: "not-a-valid-uuid"`.
- Failure origin: Step 5, when PostgreSQL executes the parameterized query. There is no application-level UUID validation or internal catch block.
- Database mutations: None. The UPDATE statement fails and the baseline row remains unchanged.
- In-memory state: Calculations happen first (Steps 1–4): `newAttempts = 1`, `exhausted = false`, `exp = 5000ms`, `nextRunAt` constructed in memory before query execution.

**Native Execution Result (original function in `Background job/src/jobs.js`):**

Verification script: [`run_failjob_fixture3.js`](file:///c:/Users/User/Desktop/Pseudocode/part-a/run_failjob_fixture3.js)

```
Did failJob throw? true
Error name: error
Error code (PostgreSQL SQLSTATE): 22P02
Error message: "invalid input syntax for type uuid: \"not-a-valid-uuid\""
Total rows in table: 1
Baseline row unchanged: true
```

**Field-by-Field Comparison:**

| Field | Predicted | Actual | Match |
| :--- | :--- | :--- | :--- |
| Outcome | Promise Rejection | Promise Rejection | ✓ |
| Error Code (SQLSTATE) | `"22P02"` | `"22P02"` | ✓ |
| Error Message | `"invalid input syntax for type uuid: \"not-a-valid-uuid\""` | `"invalid input syntax for type uuid: \"not-a-valid-uuid\""` | ✓ |
| Database Rows Modified | `0` | `0` | ✓ |
| Baseline Row Preservation | Unchanged (`processing`, `attempts: 0`) | Unchanged (`processing`, `attempts: 0`) | ✓ |

**Result: 5/5 fields match. Zero discrepancies.**

---

### Distinction: Directly Observed External Behavior vs. Source-Traced Internal Behavior (Fixture 3)

1. **Directly Observed Externally (JavaScript Rejection & Database Row State)**:
   - Calling `await failJob(...)` rejected with a PostgreSQL driver error object (`code: '22P02'`).
   - The error was unhandled inside `failJob` and bubbled directly up to the caller.
   - Database queries confirmed that 0 rows were updated, and existing rows were completely untouched.
2. **Source-Traced Internal Behavior (In-Memory Math & Logic Flow)**:
   - JavaScript execution proceeded normally through Steps 1–4:
     - `newAttempts = 0 + 1 = 1`.
     - `exhausted = 1 >= 3 = false`.
     - `exp = Math.min(5000 * 2^0, 300000) = 5000ms`.
     - `nextRunAt` Date object was successfully allocated in memory.
   - The failure did **not** happen in JavaScript arithmetic or parameter destructuring; it happened strictly at Step 5 when the `pg` client sent `$5 = 'not-a-valid-uuid'` to PostgreSQL, which rejected the string during query parsing against the table's `UUID` type definition.

---

## Part A1.3 Summary & Trace Audit

Across all three fixtures for `failJob`:
1. **Fixture 1 (Normal Failure)**: 9/9 fields matched. Confirmed status transition to `'failed'`, retry backoff calculation (`callTime + 5000ms`), and database `NOW()` timestamping.
2. **Fixture 2 (Exhaustion Boundary)**: 9/9 fields matched. Confirmed status transition to `'dead'`, `COALESCE` retention of previous `next_run_at`, setting of `finished_at`, and zero invocations of `Math.random()`.
3. **Fixture 3 (Invalid Input / Rejection)**: 5/5 fields matched. Confirmed that lack of application validation allows invalid UUIDs to reach PostgreSQL, triggering SQLSTATE `22P02` rejection without database mutation.

**Total Part A1.3 Field Matches: 23/23 fields (100% concordance, zero discrepancies).**
