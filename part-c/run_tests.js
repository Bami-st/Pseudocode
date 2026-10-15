/**
 * Part C Automated Test Runner (10-Input Isolation Suite)
 *
 * Runs 10 test cases (5 original Part B inputs + 5 new boundary/stress inputs)
 * against both Human and AI implementations under isolated states.
 */

'use strict';

const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('PART C VERIFICATION TEST SUITE (Human vs AI Verification)');
console.log('====================================================\n');

const humanPath = path.join(__dirname, '../part-b/discount_service.js');
const aiPath = path.join(__dirname, 'c1_ai_implementation.js');

const humanExists = fs.existsSync(humanPath);
const aiExists = fs.existsSync(aiPath);

if (!humanExists || !aiExists) {
  console.log('STATUS: [PENDING PREREQUISITES]');
  console.log(`- Human implementation (part-b/discount_service.js): ${humanExists ? 'FOUND' : 'PENDING USER CREATION'}`);
  console.log(`- AI implementation (part-c/c1_ai_implementation.js): ${aiExists ? 'FOUND' : 'PENDING ISOLATED GENERATION'}`);
  console.log('Both implementations must be present before executing side-by-side 10-input comparison.\n');
  process.exit(0);
}

const { applyDiscount: humanApply } = require(humanPath);
const { applyDiscount: aiApply } = require(aiPath);

// The 10 test fixtures
const testCases = [
  {
    name: 'Input 1: Standard Percentage Discount',
    payload: {
      order: { id: 'ord-1', customerId: 'cust-1', items: [{ itemId: 'item-1', unitPriceCents: 2500, quantity: 2 }, { itemId: 'item-2', unitPriceCents: 5000, quantity: 1 }] },
      coupon: { code: 'SAVE20', discountType: 'PERCENTAGE', discountValue: 20, minSpendCents: 5000, expiresAt: '2026-10-31T23:59:59Z', maxDiscountCents: null },
      customerHistory: { redeemedCoupons: [] },
      currentTimestamp: '2026-10-15T12:00:00Z'
    }
  },
  {
    name: 'Input 2: Exact Expiry Millisecond Boundary',
    payload: {
      order: { id: 'ord-2', customerId: 'cust-1', items: [{ itemId: 'item-1', unitPriceCents: 10000, quantity: 1 }] },
      coupon: { code: 'DEADLINE', discountType: 'PERCENTAGE', discountValue: 10, minSpendCents: 1000, expiresAt: '2026-10-15T12:00:00.000Z', maxDiscountCents: null },
      customerHistory: { redeemedCoupons: [] },
      currentTimestamp: '2026-10-15T12:00:00.000Z'
    }
  },
  {
    name: 'Input 3: Repeated Coupon Use',
    payload: {
      order: { id: 'ord-3', customerId: 'cust-2', items: [{ itemId: 'item-1', unitPriceCents: 5000, quantity: 1 }] },
      coupon: { code: 'WELCOME10', discountType: 'FIXED', discountValue: 1000, minSpendCents: 2000, expiresAt: '2026-12-31T23:59:59Z', maxDiscountCents: null },
      customerHistory: { redeemedCoupons: ['WELCOME10', 'SPRING25'] },
      currentTimestamp: '2026-10-15T12:00:00Z'
    }
  },
  {
    name: 'Input 4: Negative Item Quantity',
    payload: {
      order: { id: 'ord-4', customerId: 'cust-3', items: [{ itemId: 'item-1', unitPriceCents: 2000, quantity: -2 }, { itemId: 'item-2', unitPriceCents: 5000, quantity: 1 }] },
      coupon: { code: 'SAVE10', discountType: 'PERCENTAGE', discountValue: 10, minSpendCents: 1000, expiresAt: '2026-12-31T23:59:59Z', maxDiscountCents: null },
      customerHistory: { redeemedCoupons: [] },
      currentTimestamp: '2026-10-15T12:00:00Z'
    }
  },
  {
    name: 'Input 5: Subtotal Below Minimum Spend',
    payload: {
      order: { id: 'ord-5', customerId: 'cust-4', items: [{ itemId: 'item-1', unitPriceCents: 2999, quantity: 1 }] },
      coupon: { code: 'BIGSPENDER', discountType: 'FIXED', discountValue: 500, minSpendCents: 3000, expiresAt: '2026-12-31T23:59:59Z', maxDiscountCents: null },
      customerHistory: { redeemedCoupons: [] },
      currentTimestamp: '2026-10-15T12:00:00Z'
    }
  },
  {
    name: 'Input 6: Fixed Discount Exceeding Subtotal (Subtotal Clamp)',
    payload: {
      order: { id: 'ord-6', customerId: 'cust-5', items: [{ itemId: 'item-1', unitPriceCents: 1000, quantity: 1 }] },
      coupon: { code: 'GIFT15', discountType: 'FIXED', discountValue: 1500, minSpendCents: 500, expiresAt: '2026-12-31T23:59:59Z', maxDiscountCents: null },
      customerHistory: { redeemedCoupons: [] },
      currentTimestamp: '2026-10-15T12:00:00Z'
    }
  },
  {
    name: 'Input 7: Maximum Discount Cap Enforcement',
    payload: {
      order: { id: 'ord-7', customerId: 'cust-6', items: [{ itemId: 'item-1', unitPriceCents: 100000, quantity: 1 }] },
      coupon: { code: 'HALF', discountType: 'PERCENTAGE', discountValue: 50, minSpendCents: 1000, expiresAt: '2026-12-31T23:59:59Z', maxDiscountCents: 5000 },
      customerHistory: { redeemedCoupons: [] },
      currentTimestamp: '2026-10-15T12:00:00Z'
    }
  },
  {
    name: 'Input 8: Zero Item Quantity',
    payload: {
      order: { id: 'ord-8', customerId: 'cust-7', items: [{ itemId: 'item-1', unitPriceCents: 2000, quantity: 0 }] },
      coupon: { code: 'SAVE10', discountType: 'PERCENTAGE', discountValue: 10, minSpendCents: 1000, expiresAt: '2026-12-31T23:59:59Z', maxDiscountCents: null },
      customerHistory: { redeemedCoupons: [] },
      currentTimestamp: '2026-10-15T12:00:00Z'
    }
  },
  {
    name: 'Input 9: Malformed Coupon String with Whitespace',
    payload: {
      order: { id: 'ord-9', customerId: 'cust-8', items: [{ itemId: 'item-1', unitPriceCents: 5000, quantity: 1 }] },
      coupon: { code: '  SAVE20  ', discountType: 'PERCENTAGE', discountValue: 20, minSpendCents: 1000, expiresAt: '2026-12-31T23:59:59Z', maxDiscountCents: null },
      customerHistory: { redeemedCoupons: [] },
      currentTimestamp: '2026-10-15T12:00:00Z'
    }
  },
  {
    name: 'Input 10: Cent Rounding Precision (15% on 105 cents)',
    payload: {
      order: { id: 'ord-10', customerId: 'cust-9', items: [{ itemId: 'item-1', unitPriceCents: 105, quantity: 1 }] },
      coupon: { code: 'FIFTEEN', discountType: 'PERCENTAGE', discountValue: 15, minSpendCents: 50, expiresAt: '2026-12-31T23:59:59Z', maxDiscountCents: null },
      customerHistory: { redeemedCoupons: [] },
      currentTimestamp: '2026-10-15T12:00:00Z'
    }
  }
];

console.log('Running 10 side-by-side test cases...\n');
testCases.forEach((tc, idx) => {
  const humanOut = humanApply(JSON.parse(JSON.stringify(tc.payload)));
  const aiOut = aiApply(JSON.parse(JSON.stringify(tc.payload)));
  const match = JSON.stringify(humanOut) === JSON.stringify(aiOut);

  console.log(`[Case ${idx + 1}] ${tc.name}: ${match ? 'MATCH' : 'DIVERGENCE'}`);
  if (!match) {
    console.log(`  Human: ${JSON.stringify(humanOut)}`);
    console.log(`  AI:    ${JSON.stringify(aiOut)}`);
  }
});
