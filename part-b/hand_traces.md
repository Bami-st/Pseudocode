# Part B: Pre-Implementation Hand Traces

*CRITICAL RULE: These hand traces must be completed personally by the user BEFORE writing any code.*

---

## Trace Matrix (5 Awkward / Edge Case Inputs)

### Trace 1: Normal Discount Application (Standard Percentage)
- **Input Context**:
  - `order`: `subtotal = $100.00` (10,000 cents), 2 valid items (qty 2 @ 2500, qty 1 @ 5000).
  - `coupon`: `code = 'SAVE20'`, `discountType = 'PERCENTAGE'`, `discountValue = 20`, `minSpendCents = 5000`, `expiresAt = '2026-10-31T23:59:59Z'`.
  - `customerHistory`: `redeemedCoupons = []`.
  - `currentTimestamp`: `'2026-10-15T12:00:00Z'`.
- **Hand-Traced State & Step Progression**:
  - Step 1: Validate items ...
  - Step 2: Compute subtotal: `(2 * 2500) + (1 * 5000) = 10000`.
  - Step 3: Check expiry: `currentTimestamp < expiresAt` -> valid.
  - Step 4: Check history: `'SAVE20'` in `[]` -> false.
  - Step 5: Check min spend: `10000 >= 5000` -> valid.
  - Step 6: Compute discount: `10000 * 0.20 = 2000`.
  - Step 7: Final total: `10000 - 2000 = 8000`.
- **Predicted Output**: `{ success: true, subtotalCents: 10000, discountCents: 2000, finalTotalCents: 8000, errorCode: null }`
- **Actual Execution Result**: *[Pending implementation]*
- **Discrepancy / Gap**: *[Pending verification]*

---

### Trace 2: Expiry Boundary Condition (Exact Timestamp Match)
- **Input Context**:
  - `order`: valid items totaling 10,000 cents.
  - `coupon`: `expiresAt = '2026-10-15T12:00:00.000Z'`.
  - `currentTimestamp`: `'2026-10-15T12:00:00.000Z'` (Exact equality).
- **Hand-Traced State & Step Progression**:
  - *[User to hand-trace whether exact equality expires the coupon or keeps it active]*
- **Predicted Output**:
- **Actual Execution Result**: *[Pending implementation]*
- **Discrepancy / Gap**: *[Pending verification]*

---

### Trace 3: Repeated Use (One-Use-Per-Customer Enforcement)
- **Input Context**:
  - `order`: valid items totaling 10,000 cents.
  - `coupon`: `code = 'WELCOME10'`, `minSpendCents = 2000`.
  - `customerHistory`: `redeemedCoupons = ['WELCOME10', 'SPRING25']`.
  - `currentTimestamp`: `'2026-10-15T12:00:00Z'`.
- **Hand-Traced State & Step Progression**:
  - *[User to hand-trace customer history lookup and early error return]*
- **Predicted Output**:
- **Actual Execution Result**: *[Pending implementation]*
- **Discrepancy / Gap**: *[Pending verification]*

---

### Trace 4: Awkward Input — Zero or Negative Item Quantity
- **Input Context**:
  - `order`: items contains `{ itemId: 'item-1', unitPriceCents: 2000, quantity: -2 }` and `{ itemId: 'item-2', unitPriceCents: 5000, quantity: 1 }`.
  - `coupon`: valid coupon.
- **Hand-Traced State & Step Progression**:
  - *[User to hand-trace item validation loop and early return]*
- **Predicted Output**:
- **Actual Execution Result**: *[Pending implementation]*
- **Discrepancy / Gap**: *[Pending verification]*

---

### Trace 5: Boundary Input — Subtotal Below Minimum Spend Threshold
- **Input Context**:
  - `order`: 1 item @ 2999 cents.
  - `coupon`: `minSpendCents = 3000`.
- **Hand-Traced State & Step Progression**:
  - *[User to hand-trace subtotal calculation and min spend comparison]*
- **Predicted Output**:
- **Actual Execution Result**: *[Pending implementation]*
- **Discrepancy / Gap**: *[Pending verification]*
