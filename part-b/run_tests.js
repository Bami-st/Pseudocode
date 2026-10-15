/**
 * Part B Automated Test Runner
 *
 * Runs the 5 inputs from hand_traces.md against the independent human implementation
 * in discount_service.js and compares execution output with hand traces.
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('PART B VERIFICATION TEST SUITE (Independent Implementation)');
console.log('====================================================\n');

const implPath = path.join(__dirname, 'discount_service.js');

if (!fs.existsSync(implPath)) {
  console.log('STATUS: [PENDING USER IMPLEMENTATION]');
  console.log('part-b/discount_service.js has not been authored yet.');
  console.log('As mandated by project integrity rules, the user must implement this feature independently without AI generation.');
  console.log('Once discount_service.js is authored, re-run this script to verify the 5 hand-traced test cases.\n');
  process.exit(0);
}

const { applyDiscount } = require('./discount_service');

let passCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Trace 1: Normal Discount Application
// ---------------------------------------------------------------------------
const t1_res = applyDiscount({
  order: {
    id: 'ord-1',
    customerId: 'cust-1',
    items: [
      { itemId: 'item-1', unitPriceCents: 2500, quantity: 2 },
      { itemId: 'item-2', unitPriceCents: 5000, quantity: 1 }
    ]
  },
  coupon: {
    code: 'SAVE20',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minSpendCents: 5000,
    expiresAt: '2026-10-31T23:59:59Z',
    maxDiscountCents: null
  },
  customerHistory: { redeemedCoupons: [] },
  currentTimestamp: '2026-10-15T12:00:00Z'
});

assert(t1_res.success === true && t1_res.subtotalCents === 10000 && t1_res.discountCents === 2000 && t1_res.finalTotalCents === 8000,
  'Trace 1 (Normal): 20% discount on 10,000 cents yields 2000 discount and 8000 final total');

// ---------------------------------------------------------------------------
// Trace 2: Expiry Boundary Condition
// ---------------------------------------------------------------------------
const t2_res = applyDiscount({
  order: {
    id: 'ord-2',
    customerId: 'cust-1',
    items: [{ itemId: 'item-1', unitPriceCents: 10000, quantity: 1 }]
  },
  coupon: {
    code: 'DEADLINE',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minSpendCents: 1000,
    expiresAt: '2026-10-15T12:00:00.000Z',
    maxDiscountCents: null
  },
  customerHistory: { redeemedCoupons: [] },
  currentTimestamp: '2026-10-15T12:00:00.000Z'
});

assert(t2_res.success === false && t2_res.errorCode === 'COUPON_EXPIRED',
  'Trace 2 (Boundary): Expiration on exact millisecond timestamp rejected as COUPON_EXPIRED');

// ---------------------------------------------------------------------------
// Trace 3: Repeated Use
// ---------------------------------------------------------------------------
const t3_res = applyDiscount({
  order: {
    id: 'ord-3',
    customerId: 'cust-2',
    items: [{ itemId: 'item-1', unitPriceCents: 5000, quantity: 1 }]
  },
  coupon: {
    code: 'WELCOME10',
    discountType: 'FIXED',
    discountValue: 1000,
    minSpendCents: 2000,
    expiresAt: '2026-12-31T23:59:59Z',
    maxDiscountCents: null
  },
  customerHistory: { redeemedCoupons: ['WELCOME10', 'SPRING25'] },
  currentTimestamp: '2026-10-15T12:00:00Z'
});

assert(t3_res.success === false && t3_res.errorCode === 'COUPON_ALREADY_USED',
  'Trace 3 (Repeated Use): Prior redemption rejected as COUPON_ALREADY_USED');

// ---------------------------------------------------------------------------
// Trace 4: Negative / Zero Item Quantity
// ---------------------------------------------------------------------------
const t4_res = applyDiscount({
  order: {
    id: 'ord-4',
    customerId: 'cust-3',
    items: [
      { itemId: 'item-1', unitPriceCents: 2000, quantity: -2 },
      { itemId: 'item-2', unitPriceCents: 5000, quantity: 1 }
    ]
  },
  coupon: {
    code: 'SAVE10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minSpendCents: 1000,
    expiresAt: '2026-12-31T23:59:59Z',
    maxDiscountCents: null
  },
  customerHistory: { redeemedCoupons: [] },
  currentTimestamp: '2026-10-15T12:00:00Z'
});

assert(t4_res.success === false && t4_res.errorCode === 'INVALID_QUANTITY',
  'Trace 4 (Awkward / Negative Quantity): Non-positive quantity rejected as INVALID_QUANTITY');

// ---------------------------------------------------------------------------
// Trace 5: Subtotal Below Minimum Spend
// ---------------------------------------------------------------------------
const t5_res = applyDiscount({
  order: {
    id: 'ord-5',
    customerId: 'cust-4',
    items: [{ itemId: 'item-1', unitPriceCents: 2999, quantity: 1 }]
  },
  coupon: {
    code: 'BIGSPENDER',
    discountType: 'FIXED',
    discountValue: 500,
    minSpendCents: 3000,
    expiresAt: '2026-12-31T23:59:59Z',
    maxDiscountCents: null
  },
  customerHistory: { redeemedCoupons: [] },
  currentTimestamp: '2026-10-15T12:00:00Z'
});

assert(t5_res.success === false && t5_res.errorCode === 'MINIMUM_SPEND_NOT_MET',
  'Trace 5 (Below Min Spend): 2999 cents against 3000 min spend rejected as MINIMUM_SPEND_NOT_MET');

console.log(`\nPart B Test Summary: ${passCount} / ${totalCount} checks passed.`);
