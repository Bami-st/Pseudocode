# Part B: Feature Specification — Discount & Coupon Engine

## 1. Feature Overview
A promotional coupon and discount evaluation engine for e-commerce checkout.
The engine calculates order discounts based on active coupon codes, enforcing strict eligibility rules:
- **Coupon Expiry**: Coupons expire at a designated ISO timestamp.
- **Minimum Spend**: The eligible order subtotal must meet or exceed a threshold.
- **One-Use-Per-Customer**: Customers cannot redeem the same coupon code more than once.
- **Discount Types**:
  - `PERCENTAGE`: e.g. 15% off eligible items, subject to an optional max cap.
  - `FIXED`: e.g. $10.00 (1000 cents) off eligible subtotal.
- **Item Integrity**: Reject orders with zero or negative item quantities.
- **Safe Output**: Discount cannot exceed the eligible subtotal (no negative final price).

---

## 2. Formal Pseudocode Specification (Standard Compliance)
*(To be authored independently by the user adhering strictly to the contract)*

```markdown
FUNCTION applyDiscount
INPUTS:
  order: Object containing:
    id: String
    customerId: String
    items: Array of Object (each with itemId: String, unitPriceCents: Integer, quantity: Integer)
  coupon: Object containing:
    code: String
    discountType: String ('PERCENTAGE' or 'FIXED')
    discountValue: Integer (percentage points e.g. 15, or fixed cents e.g. 1000)
    minSpendCents: Integer
    expiresAt: String (ISO 8601 timestamp)
    maxDiscountCents: Integer or null
  customerHistory: Object containing:
    redeemedCoupons: Array of String (coupon codes previously used by customer)
  currentTimestamp: String (ISO 8601 timestamp representing current evaluation time)
OUTPUT:
  result: Object containing:
    success: Boolean
    subtotalCents: Integer
    discountCents: Integer
    finalTotalCents: Integer
    errorCode: String or null
    errorMessage: String or null
SIDE EFFECTS:
  NONE (pure calculation and validation function; persistent redemption is handled by checkout caller)
FAILS WHEN:
  order items list is empty or contains non-positive quantities; coupon code is expired; order subtotal is below minSpendCents; customer has already redeemed coupon; coupon discountType is invalid

[User to write numbered steps here in plain English and present tense]
```
