# Part B: Hand Traces vs. Native Execution Comparison

This document compares the 5 pre-implementation hand traces from [`part-b/hand_traces.md`](file:///c:/Users/User/Desktop/Pseudocode/part-b/hand_traces.md) directly against the native execution results of the user's independent implementation in [`part-b/discount_service.js`](file:///c:/Users/User/Desktop/Pseudocode/part-b/discount_service.js).

---

## Trace Comparison Matrix

| Trace # | Scenario / Input | Hand-Traced Predicted Output | Native Execution Output | Match Status | Discrepancies & Root Cause Notes |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **Trace 1** | Normal percentage discount (`SAVE20`, 20% off $100) | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending user implementation]* |
| **Trace 2** | Expiry millisecond boundary (exact match) | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending user implementation]* |
| **Trace 3** | Repeated coupon use (one-use enforcement) | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending user implementation]* |
| **Trace 4** | Awkward input (zero/negative quantity) | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending user implementation]* |
| **Trace 5** | Boundary input (subtotal below min spend) | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending user implementation]* |

---

## Verification Summary
- **Execution Harness**: [`part-b/run_tests.js`](file:///c:/Users/User/Desktop/Pseudocode/part-b/run_tests.js)
- **Total Traces Evaluated**: 5
- **Concordance**: *[Pending]*
