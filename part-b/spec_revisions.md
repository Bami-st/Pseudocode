# Part B: Specification Revisions Record

This document records all modifications, clarifications, or adjustments made to the Part B pseudocode specification during the course of independent implementation and verification.

---

## Revision Log

### Revision 1: Millisecond Expiry Boundary Condition
- **Original Wording**:
  `IF current timestamp is greater than coupon expiration timestamp THEN RETURN error 'COUPON_EXPIRED'.`
- **Ambiguity Identified**:
  When `current timestamp == expiresAt` down to the exact millisecond, does the coupon remain active or expire immediately?
- **Clarified Revision**:
  `IF current timestamp IS GREATER THAN OR EQUAL TO coupon expiration timestamp THEN RETURN error 'COUPON_EXPIRED'.`
- **Rationale**: Promotional coupons are valid strictly up until the expiration second; evaluating equal or past timestamp as expired prevents race-condition redemptions after promotion end.

### Revision 2: Currency Subunit Precision & Rounding
- **Original Wording**:
  `CALCULATE discount as subtotal multiplied by percentage divided by 100.`
- **Ambiguity Identified**:
  In integer-cent systems, percentage discounts can yield fractions of a cent (e.g. 15% of 105 cents = 15.75 cents).
- **Clarified Revision**:
  `CALCULATE discount as ROUND_HALF_UP(subtotal multiplied by percentage divided by 100).`
- **Rationale**: Financial transactions in integer currency require an explicit rounding standard (such as Banker's Rounding or Half-Up) to prevent fractional cent truncation drift.
