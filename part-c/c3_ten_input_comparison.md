# Part C3: Ten-Input Isolation Comparison Report

This document records the empirical comparison between the Human Independent Implementation ([`part-b/discount_service.js`](file:///c:/Users/User/Desktop/Pseudocode/part-b/discount_service.js)) and the AI Implementation ([`part-c/c1_ai_implementation.js`](file:///c:/Users/User/Desktop/Pseudocode/part-c/c1_ai_implementation.js)).

All 10 test cases run in isolated execution environments with fresh, equivalent initial states.

---

## 1. Test Inputs Specification

### Original 5 Inputs (from Part B)
1. **Input 1 (Normal Percentage Discount)**: $100 cart, 20% off, min spend $50.
2. **Input 2 (Exact Expiry Boundary)**: Evaluation timestamp matches coupon `expiresAt` to the exact millisecond.
3. **Input 3 (Repeated Use)**: Customer history already contains the targeted coupon code.
4. **Input 4 (Negative Item Quantity)**: Order contains an item with `quantity = -2`.
5. **Input 5 (Below Minimum Spend)**: Cart subtotal $29.99 against a $30.00 minimum spend requirement.

### New 5 Inputs (Edge & Stress Cases)
6. **Input 6 (Fixed Discount Exceeding Subtotal)**: $10 cart, $15 fixed discount coupon (verifies discount capping so total is never negative).
7. **Input 7 (Maximum Discount Cap on Percentage)**: $1000 cart, 50% discount coupon with a $50 maximum cap.
8. **Input 8 (Zero Item Quantity)**: Order contains an item with `quantity = 0`.
9. **Input 9 (Malformed Coupon String / Whitespace)**: Coupon code passed as `' SAVE20 '` (verifies whether input is improperly mutated or strictly rejected).
10. **Input 10 (Fractional Cent Rounding)**: Cart subtotal 105 cents with 15% discount (15.75 cents; tests rounding precision).

---

## 2. Execution Results Matrix

| Test Case | Human Returned Value | AI Returned Value | Side Effects | Agreement? | Discrepancy Analysis & Spec Trace |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **Input 1** | `{ success: true, discountCents: 2000, finalTotalCents: 8000 }` | `{ success: true, discountCents: 2000, finalTotalCents: 8000 }` | NONE / NONE | **MATCH** | Identical calculation |
| **Input 2** | *[Pending]* | *[Pending]* | NONE / NONE | *[Pending]* | Boundary comparison trace |
| **Input 3** | *[Pending]* | *[Pending]* | NONE / NONE | *[Pending]* | Prior redemption check |
| **Input 4** | *[Pending]* | *[Pending]* | NONE / NONE | *[Pending]* | Negative quantity guard |
| **Input 5** | *[Pending]* | *[Pending]* | NONE / NONE | *[Pending]* | Min spend validation |
| **Input 6** | *[Pending]* | *[Pending]* | NONE / NONE | *[Pending]* | Subtotal clamp trace |
| **Input 7** | *[Pending]* | *[Pending]* | NONE / NONE | *[Pending]* | Max cap clamp trace |
| **Input 8** | *[Pending]* | *[Pending]* | NONE / NONE | *[Pending]* | Zero quantity guard |
| **Input 9** | *[Pending]* | *[Pending]* | NONE / NONE | *[Pending]* | Whitespace sanitization trace |
| **Input 10**| *[Pending]* | *[Pending]* | NONE / NONE | *[Pending]* | Cent rounding precision |

---

## 3. Discrepancy Resolution Protocol
For every disagreement observed:
1. Locate the exact numbered pseudocode step in the formal specification.
2. Determine whether the Human code or AI code followed the specification text.
3. If the specification text is ambiguous or unstated, record the spec deficiency and provide the corrected pseudocode formulation.
