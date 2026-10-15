# Part C2: Side-by-Side Difference Table & Specification Ambiguity Analysis

This document provides a side-by-side comparison between the original human specification ([`part-b/feature_specification.md`](file:///c:/Users/User/Desktop/Pseudocode/part-b/feature_specification.md)) and the behavior exhibited by the AI-generated implementation ([`part-c/c1_ai_implementation.js`](file:///c:/Users/User/Desktop/Pseudocode/part-c/c1_ai_implementation.js)), based on the reverse-engineered pseudocode.

---

## 1. Complete Difference Table

| Original Step | Corresponding AI Behaviour | Classification (Addition / Omission / Different Interpretation) | Consequence | Evidence | Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Input Sanitization** (Validate code format) | AI added `.trim().toUpperCase()` before validation | **Addition** | Unspecified code mutation; accepts malformed whitespace strings silently | `c1_ai_implementation.js:L12` | Flag as added behavior violating strict spec |
| **Expiry Timestamp Comparison** | AI used `>=` instead of `>` on millisecond comparison | **Different Interpretation** | At exact expiration millisecond, AI expires coupon; human allows it | `c1_ai_implementation.js:L28` | Spec ambiguity resolved by adopting `>=` |
| **Quantity Validation Loop** | AI deferred quantity validation until after subtotal accumulation | **Different Interpretation** | Negative quantities could cancel positive items if not caught early | `c1_ai_implementation.js:L35` | Spec ordering enforced: validate items prior to math |
| **Fractional Cent Rounding** | AI used `Math.round()` | **Different Interpretation** | Half-cent edge cases handled via standard JS round instead of half-up/bankers | `c1_ai_implementation.js:L42` | Document rounding convention explicitly in spec |

---

## 2. Specification Ambiguity Analysis

For every item classified as a **Different Interpretation**:
1. **Ambiguity Assessment**: Was the original specification sufficiently precise?
2. **Original Wording**: Record exact wording from the original specification.
3. **Clarified Revision**: Provide the revised pseudocode eliminating the ambiguity.
4. **Resolution Decision**: State whether the AI interpretation or human interpretation is adopted, with engineering justification.
