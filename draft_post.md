# Draft Technical Post: Why AI Implementation Verification Requires Formal Pseudocode

> **STATUS: DRAFT ONLY — DO NOT PUBLISH WITHOUT EXPLICIT USER INSTRUCTION**

---

### Title: The Silent Danger of "Helpful" AI: What Happened When We Audited an AI-Generated Discount Engine

When engineering teams ask AI to implement backend logic from a prompt, the generated code often compiles, passes superficial unit tests, and looks completely clean.

But what happens when you hold AI implementations to a strict formal pseudocode contract?

In our latest pseudocode engineering audit, we tested this exact boundary. We wrote a formal specification for an e-commerce coupon and discount engine, complete with hand-traced boundary states, and handed only the pseudocode to an AI with the prompt: *“Implement this exactly, one function per pseudocode block, no additional behaviour.”*

### The Discovery: Silent Added Behaviour & Boundary Divergence

When we reverse-engineered the AI's code back into pseudocode and performed a side-by-side audit, two critical discrepancies emerged:

#### 1. Added Behavior: Silent Sanitization Instead of Explicit Rejection
- **The Spec**: *“IF couponCode contains non-alphanumeric characters, RETURN error 'INVALID_COUPON_FORMAT'.”*
- **The AI Implementation**: The AI quietly added `.trim().toUpperCase()` before validating, silently accepting dirty input strings that the spec explicitly mandated rejecting.
- **The Consequence**: In an enterprise payment system, silent normalization masks upstream data corruption and creates discrepancies between database lookup keys and client receipts.

#### 2. The Expiry Boundary Condition Divergence
- **The Spec**: *“IF current timestamp is greater than coupon expiration timestamp THEN RETURN 'COUPON_EXPIRED'.”*
- **What Happened**: At the exact millisecond of expiration (`currentTime === expiresAt`), the Human code treated the coupon as valid (`>`), whereas the AI code treated it as expired (`>=`).

### Side-by-Side Comparison

| Feature Aspect | Formal Specification | Human Implementation | AI Implementation | Audit Finding |
| :--- | :--- | :--- | :--- | :--- |
| **Code Normalization** | Strict character validation | Rejects spaces/special chars | Mutates & trims input | **Unrequested Addition** |
| **Exact Millisecond Expiry** | `current > expiry` | Active at exact millisecond | Expired at exact millisecond | **Boundary Interpretation** |
| **Zero Quantity Items** | Immediate early exit | Returns `INVALID_QUANTITY` | Sums then checks spend | **Deferred Validation** |

### Takeaways for Engineering Teams
1. **Never trust AI code without reverse-engineering**: If you don't trace AI code back to its core operational pseudocode, you will inherit silent behavioral drift.
2. **Ambiguity in specs guarantees divergent implementations**: If your specification does not define millisecond boundary equality, different developers (and models) will decide for you.

Explore the complete audit, trace tables, and test runners here:
GitHub Repository: https://github.com/Bami-st/pseudocode-engineering-verification
