# Requirement-to-Evidence Verification Checklist

This checklist tracks every deliverable, requirement, and verification artifact across Part A, Part B, Part C, and Packaging.

**Status Legend:**
- `[COMPLETED]` — Artifact exists, fully verified, independently authored where required, and matches code execution.
- `[PENDING USER ACTION]` — Waiting for human independent input/trace/draft as mandated by project integrity rules.
- `[IN PROGRESS]` — Scaffolding or automated verification ready, waiting on prerequisite human work.

---

## 1. Project Infrastructure & Packaging
| Requirement | Status | Evidence Location | Description / Verification |
| :--- | :--- | :--- | :--- |
| Fresh Git Repository initialized | `[COMPLETED]` | [`.git/`](file:///c:/Users/User/Desktop/Pseudocode/.git) | Git repo initialized, commits recorded incrementally. |
| `.gitignore` security safeguards | `[COMPLETED]` | [`.gitignore`](file:///c:/Users/User/Desktop/Pseudocode/.gitignore) | Protects `.env`, credentials, logs, and `node_modules`. |
| `.env.example` with zero secrets | `[COMPLETED]` | [`.env.example`](file:///c:/Users/User/Desktop/Pseudocode/.env.example) | Example environment configurations with placeholders only. |
| Master `README.md` | `[IN PROGRESS]` | [`README.md`](file:///c:/Users/User/Desktop/Pseudocode/README.md) | Pseudocode standard, architecture, reproducibility, lessons. |
| Defense Notes (`defense_notes.md`) | `[IN PROGRESS]` | [`defense_notes.md`](file:///c:/Users/User/Desktop/Pseudocode/defense_notes.md) | Four required defense categories prepared for user rehearsal. |
| Draft Social / Technical Post | `[IN PROGRESS]` | [`draft_post.md`](file:///c:/Users/User/Desktop/Pseudocode/draft_post.md) | Draft technical summary of Part C discovery (not published). |
| Fresh-Clone Reproducibility | `[IN PROGRESS]` | [`package.json`](file:///c:/Users/User/Desktop/Pseudocode/package.json) | Node.js verification scripts running test runners. |

---

## 2. Part A: Existing Code (9 Required Files + Traces & Execution)
### A1: Three Functions from Own Work
| Item | Status | Evidence Location | Details |
| :--- | :--- | :--- | :--- |
| A1.1 Most Complex Function Pseudocode | `[COMPLETED]` | [`part-a/a1_complex_pseudocode.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a1_complex_pseudocode.md) | `recoverStuckJobs` from `Background job` (commit `69f3e5d`). |
| A1.1 Hand Traces (3 inputs: normal, edge, invalid) | `[COMPLETED]` | [`part-a/a1_complex_pseudocode.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a1_complex_pseudocode.md) | Hand traces completed for Fixtures 1, 2, 3 preserving corrections. |
| A1.1 Execution Comparison | `[COMPLETED]` | [`part-a/run_fixture1.js`](file:///c:/Users/User/Desktop/Pseudocode/part-a/run_fixture1.js), [`run_fixture2.js`](file:///c:/Users/User/Desktop/Pseudocode/part-a/run_fixture2.js), [`run_fixture3.js`](file:///c:/Users/User/Desktop/Pseudocode/part-a/run_fixture3.js) | Native execution against isolated schema `pseudocode_verify` verified. |
| A1.2 Money / Authorisation Function Pseudocode | `[PENDING USER ACTION]` | [`part-a/a1_money_auth_pseudocode.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a1_money_auth_pseudocode.md) | Candidate: Order calculation & transaction from `food-delivery-api`. |
| A1.2 Hand Traces (3 inputs: normal, edge, invalid) | `[PENDING USER ACTION]` | [`part-a/a1_money_auth_pseudocode.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a1_money_auth_pseudocode.md) | Must be personally hand-traced by the user. |
| A1.2 Execution Comparison | `[IN PROGRESS]` | [`part-a/run_tests.js`](file:///c:/Users/User/Desktop/Pseudocode/part-a/run_tests.js) | Discrepancy & side-effect verification. |
| A1.3 Error Handling Function Pseudocode | `[PENDING USER ACTION]` | [`part-a/a1_error_handling_pseudocode.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a1_error_handling_pseudocode.md) | Candidate: `failJob` with exponential backoff & jitter. |
| A1.3 Hand Traces (3 inputs: normal, edge, invalid) | `[PENDING USER ACTION]` | [`part-a/a1_error_handling_pseudocode.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a1_error_handling_pseudocode.md) | Must be personally hand-traced by the user. |
| A1.3 Execution Comparison | `[IN PROGRESS]` | [`part-a/run_tests.js`](file:///c:/Users/User/Desktop/Pseudocode/part-a/run_tests.js) | Verifies actual behavior vs predicted trace. |

### A2: Three Open-Source Functions
| Item | Status | Evidence Location | Details |
| :--- | :--- | :--- | :--- |
| Selection of Library & Functions (Short, Med, Diff) | `[COMPLETED]` | [`part-a/a2_library_selection.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a2_library_selection.md) | Exact version and source locations recorded. |
| User Unaided First Drafts (No AI hints) | `[PENDING USER ACTION]` | [`part-a/a2_lib_short_draft.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a2_lib_short_draft.md) | Preserved separately before AI explanation. |
| AI Explanation & Discrepancy Analysis | `[IN PROGRESS]` | [`part-a/a2_comparison_notes.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a2_comparison_notes.md) | Evaluates user interpretation vs AI explanation vs source truth. |
| Corrected Pseudocode & Execution Verification | `[IN PROGRESS]` | [`part-a/a2_lib_short.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a2_lib_short.md) | 3 library files with hand traces and real test runner. |

### A3: Planted Bug
| Item | Status | Evidence Location | Details |
| :--- | :--- | :--- | :--- |
| Obtain undisclosed bug from partner/reviewer | `[PENDING USER ACTION]` | [`part-a/a3_source.js`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a3_source.js) | Partner/reviewer code with single planted bug. |
| User Actual Behaviour Pseudocode | `[PENDING USER ACTION]` | [`part-a/a3_planted_bug_actual.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a3_planted_bug_actual.md) | Pseudocode describing what the code actually does. |
| User Intended Behaviour Pseudocode | `[PENDING USER ACTION]` | [`part-a/a3_planted_bug_intended.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a3_planted_bug_intended.md) | Pseudocode describing what the code was supposed to do. |
| Bug Identification & Difference Report | `[PENDING USER ACTION]` | [`part-a/a3_planted_bug_identification.md`](file:///c:/Users/User/Desktop/Pseudocode/part-a/a3_planted_bug_identification.md) | Pinpointing the exact discrepancy and mechanism. |
| Execution Verification of Planted Bug | `[IN PROGRESS]` | [`part-a/run_tests.js`](file:///c:/Users/User/Desktop/Pseudocode/part-a/run_tests.js) | Concrete test proving bug manifestation. |

---

## 3. Part B: Independent Specification & Implementation
| Item | Status | Evidence Location | Details |
| :--- | :--- | :--- | :--- |
| Feature Selection & Pseudocode Specification | `[PENDING USER ACTION]` | [`part-b/feature_specification.md`](file:///c:/Users/User/Desktop/Pseudocode/part-b/feature_specification.md) | Candidate: Discount engine (expiry, min spend, one-use). |
| Hand Traces (>= 5 awkward/edge inputs) | `[PENDING USER ACTION]` | [`part-b/hand_traces.md`](file:///c:/Users/User/Desktop/Pseudocode/part-b/hand_traces.md) | Traces produced BEFORE any implementation is written. |
| AI Review of Specification Gaps | `[IN PROGRESS]` | [`part-b/spec_review.md`](file:///c:/Users/User/Desktop/Pseudocode/part-b/spec_review.md) | Non-destructive gap analysis (does not write code). |
| User Independent Implementation (Zero AI) | `[PENDING USER ACTION]` | [`part-b/discount_service.js`](file:///c:/Users/User/Desktop/Pseudocode/part-b/discount_service.js) | Implemented solely by human user. |
| Step Mapping & Revisions Record | `[PENDING USER ACTION]` | [`part-b/step_mapping.md`](file:///c:/Users/User/Desktop/Pseudocode/part-b/step_mapping.md) | Maps pseudocode steps 1-to-1 with code statements. |
| Execution Comparison of the 5 Traces | `[IN PROGRESS]` | [`part-b/run_tests.js`](file:///c:/Users/User/Desktop/Pseudocode/part-b/run_tests.js) | Compares predicted traces with actual execution. |

---

## 4. Part C: AI Implementation & Verification
| Item | Status | Evidence Location | Details |
| :--- | :--- | :--- | :--- |
| Clean Handoff (Final Pseudocode Only) | `[IN PROGRESS]` | [`part-c/c1_handoff_prompt.md`](file:///c:/Users/User/Desktop/Pseudocode/part-c/c1_handoff_prompt.md) | Isolated prompt with no Part B human code. |
| AI Implementation Generated & Preserved | `[IN PROGRESS]` | [`part-c/c1_ai_implementation.js`](file:///c:/Users/User/Desktop/Pseudocode/part-c/c1_ai_implementation.js) | AI implementation produced from prompt. |
| User Reverse-Engineered Pseudocode | `[PENDING USER ACTION]` | [`part-c/c2_reverse_engineered_pseudocode.md`](file:///c:/Users/User/Desktop/Pseudocode/part-c/c2_reverse_engineered_pseudocode.md) | Reverse-engineered by user without viewing spec. |
| Side-by-Side Difference Table & Ambiguity Resolution | `[IN PROGRESS]` | [`part-c/c2_difference_table.md`](file:///c:/Users/User/Desktop/Pseudocode/part-c/c2_difference_table.md) | Classifications: addition, omission, different interpretation. |
| 10-Input Isolation Test Runner (5 original + 5 new) | `[IN PROGRESS]` | [`part-c/run_tests.js`](file:///c:/Users/User/Desktop/Pseudocode/part-c/run_tests.js) | Compares Human vs AI implementation side-by-side. |
| Presentation Preparation Notes | `[IN PROGRESS]` | [`part-c/c4_recording_prep.md`](file:///c:/Users/User/Desktop/Pseudocode/part-c/c4_recording_prep.md) | 5-minute explanation script using pseudocode notes only. |
| User Recording & Actual Listener Feedback | `[PENDING USER ACTION]` | [`part-c/c4_listener_feedback.md`](file:///c:/Users/User/Desktop/Pseudocode/part-c/c4_listener_feedback.md) | Nontechnical person's explanation back to the user. |
