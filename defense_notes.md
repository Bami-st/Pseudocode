# Evidence-Based Defense Notes

These notes prepare the developer for an oral technical defense, panel review, or engineering audit. Each section links directly to empirical evidence gathered throughout the project.

---

## Defense Item 1: Predicting a Part A Function's Output From an Input

### Strategy & Technique
1. **Trace State Line-by-Line**:
   - Begin at `FUNCTION` entry, write out the initial input values in a trace table.
   - For every branch condition (`IF` / `OTHERWISE`), write out the evaluated boolean condition explicitly.
   - Keep a running column for state changes marked `WRITE` and external operations marked `CALL`.
   - Never skip forward to the expected return; compute intermediate values sequentially.
2. **Empirical Reference (A1.3 Error Backoff Calculation)**:
   - When given `attempts = 2`, `maxAttempts = 3`, `baseDelay = 5000`, `maxDelay = 300000`:
     - Step 1: `newAttempts = 2 + 1 = 3`.
     - Step 2: `exhausted = (3 >= 3) = true`.
     - Step 3: Branch `IF exhausted IS true` fires immediately; delay calculation is skipped entirely.
     - Predicted return: Status `'dead'`, `nextRunAt: null`.
     - Verified in: [`part-a/a1_error_handling_pseudocode.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a1_error_handling_pseudocode.md).

---

## Defense Item 2: Real Specification Ambiguity and Its Correction

### Incident Analysis
- **The Ambiguity**: In the Part B discount specification, the rule for expiry originally stated:
  `IF current timestamp is greater than coupon expiration timestamp THEN reject as expired.`
- **The Dilemma (Boundary Condition)**:
  What happens when `current timestamp == coupon expiration timestamp` down to the exact millisecond?
  - Does the coupon expire strictly *after* the timestamp, or is the expiration timestamp the exact deadline (inclusive)?
- **The Empirical Divergence**:
  - The Human implementation interpreted boundary equality as *valid* (`current > expiry`).
  - The AI implementation interpreted boundary equality as *expired* (`current >= expiry`).
- **The Correction**:
  - Clarified pseudocode specification:
    `IF current timestamp IS GREATER THAN OR EQUAL TO coupon expiration timestamp THEN RETURN error 'COUPON_EXPIRED'.`
  - Documented in: [`part-c/c2_difference_table.md`](file:///c:/Users/User/Desktop/Pseudocode/part-c/c2_difference_table.md) and [`part-b/spec_revisions.md`](file:///c:/Users/User/Desktop/Pseudocode/part-b/spec_revisions.md).

---

## Defense Item 3: Implementation Disagreement and How Tracing Resolved It

### Incident Analysis
- **The Disagreement**: Handling of order total with zero-value items or negative quantities.
- **Human Implementation Behavior**:
  Rejects immediately if any item quantity is `<= 0` before computing line totals.
- **AI Implementation Behavior**:
  Computed `total = sum(qty * price)` first, then validated whether `total < minSpend`.
- **How Tracing Resolved It**:
  - Step-by-step tracing through the Part B pseudocode revealed:
    - Step 3 explicitly specified: *“FOR EACH item in order items, IF item quantity is less than or equal to zero, RETURN error 'INVALID_QUANTITY'.”*
  - The trace confirmed the Human implementation followed the exact step order of the specification, whereas the AI deferred the validation until after arithmetic operations, exposing the system to potential overflow or negative total edge cases.
  - Resolution: The specification step ordering was confirmed authoritative, and the AI implementation was flagged for deferred validation divergence.
  - Documented in: [`part-c/c3_ten_input_comparison.md`](file:///c:/Users/User/Desktop/Pseudocode/part-c/c3_ten_input_comparison.md).

---

## Defense Item 4: Practicing Aloud with an Unfamiliar Function (Oral Drill Protocol)

When presented with an unfamiliar code snippet in a live defense:
1. **Identify the Inputs and Boundary Domain**:
   - State aloud: *"The function accepts two inputs: X of type integer and Y of type array. Valid bounds are X >= 0 and non-empty Y."*
2. **Scan for Pre-conditions and Early Returns**:
   - State aloud: *"Lines 2-4 check guard clauses. If Y is empty, it returns immediately with null."*
3. **Trace the Loop Invariant**:
   - State aloud: *"On iteration 1, accumulator is initialized to ... The loop terminates when index equals length."*
4. **Identify Side Effects**:
   - State aloud: *"Notice line 18 calls an external database write; this means the function is not pure and has side effects."*
5. **State the Concluding Output**:
   - State aloud: *"For input [1, 2, 3], the final computed output returned at line 25 is 6."*
