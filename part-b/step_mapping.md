# Part B: Pseudocode-to-Implementation Step Mapping

This document links each numbered step in the Part B pseudocode specification ([`feature_specification.md`](file:///c:/Users/User/Desktop/Pseudocode/part-b/feature_specification.md)) directly to its corresponding lines of code in the independent human implementation ([`discount_service.js`](file:///c:/Users/User/Desktop/Pseudocode/part-b/discount_service.js)).

---

## Mapping Table

| Pseudocode Step # | Step Description / Operation | Code File & Line Range | Notes & Implementation Realization |
| :---: | :--- | :--- | :--- |
| **Step 1** | Validate order structure & non-empty items | `part-b/discount_service.js:L...` | Checks `!order || !order.items || order.items.length === 0` |
| **Step 2** | Loop over items to check quantity > 0 | `part-b/discount_service.js:L...` | Guard against negative or zero quantities |
| **Step 3** | Compute subtotal in cents | `part-b/discount_service.js:L...` | Accumulate `item.quantity * item.unitPriceCents` |
| **Step 4** | Validate current timestamp against expiry | `part-b/discount_service.js:L...` | Temporal comparison `Date.parse(current) > Date.parse(expiry)` |
| **Step 5** | Check customer prior redemptions | `part-b/discount_service.js:L...` | `redeemedCoupons.includes(coupon.code)` |
| **Step 6** | Verify subtotal meets minSpendCents | `part-b/discount_service.js:L...` | Guard `subtotalCents < coupon.minSpendCents` |
| **Step 7** | Compute raw discount (PERCENT vs FIXED) | `part-b/discount_service.js:L...` | Math calculation with rounding or floor |
| **Step 8** | Apply maximum discount cap if present | `part-b/discount_service.js:L...` | `Math.min(discountCents, coupon.maxDiscountCents)` |
| **Step 9** | Clamp discount so it never exceeds subtotal | `part-b/discount_service.js:L...` | Guard `discountCents = Math.min(discountCents, subtotalCents)` |
| **Step 10**| Calculate final total and return payload | `part-b/discount_service.js:L...` | Returns `{ success: true, subtotalCents, discountCents, finalTotalCents }` |

*(Line ranges will be updated once the user finishes writing `discount_service.js`)*
