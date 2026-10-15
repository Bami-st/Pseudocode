# Part A1.1: Most Complex Function from Own Work

## Provenance
- **Project**: Background Job System (`c:\Users\User\Desktop\Background job`)
- **Commit**: `69f3e5d` (*feat: background job system with evidence package*)
- **Source File**: `src/jobs.js` (lines 235-267)
- **Function Name**: `recoverStuckJobs`

---

## Source Implementation Reference
```javascript
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

## Pseudocode Specification (Standard Compliance)

```markdown
FUNCTION recoverStuckJobs
INPUTS:
  timeoutMs: Integer, representing the threshold duration in milliseconds after which a job in processing status is deemed stuck
OUTPUT:
  recoveredJobs: Array of Object, the list of job records that were transitioned out of processing state
SIDE EFFECTS:
  WRITE database updates: increments attempts, appends timestamped recovery notice to last_error, transitions status to 'dead' or 'failed', updates next_run_at, and sets updated_at to current timestamp for all locked candidate rows
FAILS WHEN:
  timeoutMs is not a valid number, or CALL database query throws an error or connection fails

1. CALL current system time in milliseconds.
2. SUBTRACT timeoutMs from current system time to calculate cutoff timestamp.
3. CALL database with atomic transaction query passing cutoff timestamp:
   a. SELECT job ids with status equal to 'processing' and started_at earlier than cutoff timestamp, acquiring row-level locks and skipping locked rows.
   b. FOR EACH candidate job row:
      i. INCREMENT attempts by 1.
      ii. IF new attempts is greater than or equal to max_attempts:
          WRITE status to 'dead'.
          KEEP next_run_at unchanged.
      iii. OTHERWISE:
          WRITE status to 'failed'.
          WRITE next_run_at to current time plus 1 minute.
      iv. CONCATENATE existing last_error (or empty string if null) with recovery notice containing current timestamp and WRITE to last_error.
      v. WRITE updated_at to current timestamp.
   c. RETURN updated job records.
4. RETURN recoveredJobs array.
```

---

## Human Hand Traces (User Action Required)

*Instructions: The user must personally complete the prediction rows before test execution.*

### Trace 1: Normal Input
- **Input**: `timeoutMs = 60000` (1 minute). Database contains one stuck job: `status = 'processing'`, `attempts = 1`, `max_attempts = 3`, `started_at = NOW() - 120000ms`.
- **User Hand-Traced Prediction**:
  - Returned Value: `[ { id: '...', status: 'failed', attempts: 2 } ]`
  - Side Effects: DB row updated with `status = 'failed'`, `attempts = 2`, `next_run_at = NOW() + 60s`.
  - Execution Result: *[Pending execution]*
  - Discrepancy / Correction: *[Pending verification]*

### Trace 2: Edge Case (Max Attempts Boundary)
- **Input**: `timeoutMs = 60000`. Database contains one stuck job: `status = 'processing'`, `attempts = 2`, `max_attempts = 3` (so `attempts + 1 = 3 == max_attempts`), `started_at = NOW() - 90000ms`.
- **User Hand-Traced Prediction**:
  - Returned Value: `[ { id: '...', status: 'dead', attempts: 3 } ]`
  - Side Effects: Status becomes `'dead'`, `next_run_at` remains unchanged.
  - Execution Result: *[Pending execution]*
  - Discrepancy / Correction: *[Pending verification]*

### Trace 3: Invalid Input / Zero Match Edge
- **Input**: `timeoutMs = -1000` (negative threshold) or no matching jobs.
- **User Hand-Traced Prediction**:
  - Returned Value: `[]` (empty array)
  - Side Effects: NONE (no rows locked or updated).
  - Execution Result: *[Pending execution]*
  - Discrepancy / Correction: *[Pending verification]*
