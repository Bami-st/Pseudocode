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

## Pseudocode Specification (Standard Compliance)

```markdown
FUNCTION failJob
INPUTS:
  id: String, unique identifier of the failing job
  error: String, error description or stack trace captured from failure
  attempts: Integer, count of attempts completed prior to this failure
  maxAttempts: Integer, maximum allowed attempts before job is considered exhausted
OUTPUT:
  result: Object, containing final status ('failed' or 'dead'), newAttempts count, and scheduled nextRunAt date or null
SIDE EFFECTS:
  WRITE database: updates job record with new status, incremented attempts, last_error, updated_at timestamp, optional finished_at timestamp, and rescheduled next_run_at
FAILS WHEN:
  CALL database fails, or inputs are not valid numbers or strings

1. ADD 1 to attempts and assign to newAttempts.
2. EVALUATE whether newAttempts is greater than or equal to maxAttempts and assign boolean result to exhausted.
3. INITIALISE nextRunAt to null.
4. IF exhausted is false:
   a. READ baseDelay from environment or default to 5000 milliseconds.
   b. READ maxDelay from environment or default to 300000 milliseconds.
   c. CALCULATE exponential delay as baseDelay multiplied by 2 raised to the power of (newAttempts minus 1).
   d. CLAMP exponential delay to not exceed maxDelay.
   e. GENERATE random floating point number between -1 and 1.
   f. MULTIPLY exponential delay by 0.25 and by random float to calculate jitter.
   g. ADD exponential delay and jitter to current system time to construct nextRunAt Date.
5. IF exhausted is true:
   a. ASSIGN status as 'dead'.
   b. ASSIGN finished_at as current system time.
6. OTHERWISE:
   a. ASSIGN status as 'failed'.
   b. ASSIGN finished_at as null.
7. CALL database query to update job record:
   WRITE status, newAttempts, last_error to error, next_run_at, finished_at, and updated_at.
8. RETURN object containing status, newAttempts, and nextRunAt.
```

---

## Human Hand Traces (User Action Required)

### Trace 1: Normal Input (First failure, retriable)
- **Input**:
  - `id`: `'job-101'`
  - `error`: `'Connection timeout'`
  - `attempts`: `0`
  - `maxAttempts`: `3`
  - Env: `baseDelay = 5000`, `maxDelay = 300000`
- **User Hand-Traced Prediction**:
  - `newAttempts = 1`, `exhausted = false`
  - `exp = 5000 * 2^0 = 5000ms`. Jitter between -1250ms and +1250ms (window: 3750ms to 6250ms).
  - Returned Status: `'failed'`. `nextRunAt` scheduled ~5s ahead. `finished_at = null`.
  - Execution Result: *[Pending execution]*
  - Discrepancy / Correction: *[Pending verification]*

### Trace 2: Edge Case (Exhaustion boundary on final retry)
- **Input**:
  - `id`: `'job-102'`
  - `error`: `'Out of memory'`
  - `attempts`: `2`
  - `maxAttempts`: `3`
- **User Hand-Traced Prediction**:
  - `newAttempts = 3`, `exhausted = (3 >= 3) = true`.
  - Status: `'dead'`. `nextRunAt = null` (retains previous or null). `finished_at = NOW()`.
  - Execution Result: *[Pending execution]*
  - Discrepancy / Correction: *[Pending verification]*

### Trace 3: Invalid Input (Negative attempts counter)
- **Input**:
  - `id`: `'job-103'`
  - `error`: `'Unexpected crash'`
  - `attempts`: `-1`
  - `maxAttempts`: `3`
- **User Hand-Traced Prediction**:
  - `newAttempts = 0`, `exhausted = false`.
  - `exp = 5000 * 2^(-1) = 2500ms`.
  - Status: `'failed'`.
  - Execution Result: *[Pending execution]*
  - Discrepancy / Correction: *[Pending verification]*
