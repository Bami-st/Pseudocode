# Part A2: Open-Source Library Selection

## 1. Selected Library
- **Library Name**: `cors`
- **Version**: `2.8.6` (confirmed via `package.json` in local project `c:\Users\User\Desktop\Consumable API\food-delivery-api`)
- **Upstream Repository**: https://github.com/expressjs/cors
- **Source File**: `lib/index.js`
- **Rationale**: An established, production-grade Node.js middleware library actively used in the author's local projects.

---

## 2. Identified Functions

As mandated by project integrity rules, **no explanations, pseudocode drafts, or behavioral hints are provided here**. The user must examine the raw function signatures and source lines below and submit unaided first drafts.

### Function 1: Short
- **Name**: `isOriginAllowed`
- **Location**: `lib/index.js:19-34`
- **Signature**: `isOriginAllowed(origin, allowedOrigin)`

### Function 2: Medium
- **Name**: `configureOrigin`
- **Location**: `lib/index.js:36-69`
- **Signature**: `configureOrigin(options, req)`

### Function 3: Difficult
- **Name**: `cors` (main middleware export)
- **Location**: `lib/index.js:154-200`
- **Signature**: `cors(options, req, res, next)` (including preflight and async option evaluation)

---

## 3. Human Task Protocol
1. Read the source code in `cors/lib/index.js` without consulting documentation or AI.
2. In `a2_lib_short_draft.md`, `a2_lib_medium_draft.md`, and `a2_lib_difficult_draft.md`, write your unaided first-draft pseudocode strictly following the project pseudocode standard.
3. For each function, hand-trace 3 inputs (normal, edge case, invalid).
4. Once your drafts and traces are submitted and preserved, the AI will provide a separate explanation and generate the comparative discrepancy report in `a2_comparison_notes.md`.
