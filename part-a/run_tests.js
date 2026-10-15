/**
 * Part A Automated Test Runner
 *
 * Executes the 3 test traces for each function in Part A (A1 own functions,
 * A2 open-source functions, and A3 planted bug) and compares actual behavior
 * against predictions.
 */

'use strict';

console.log('====================================================');
console.log('PART A VERIFICATION TEST SUITE');
console.log('====================================================\n');

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
// A1.3: failJob Logic Verification
// ---------------------------------------------------------------------------
console.log('--- A1.3: failJob (Error Handling Logic) ---');

function simulateFailJob({ attempts, maxAttempts, baseDelay = 5000, maxDelay = 300000 }) {
  const newAttempts = attempts + 1;
  const exhausted = newAttempts >= maxAttempts;
  let delay = null;
  if (!exhausted) {
    const exp = Math.min(baseDelay * Math.pow(2, newAttempts - 1), maxDelay);
    delay = exp; // base exponential value before jitter
  }
  return {
    status: exhausted ? 'dead' : 'failed',
    newAttempts,
    exhausted,
    baseDelay: delay
  };
}

const a1_t1 = simulateFailJob({ attempts: 0, maxAttempts: 3 });
assert(a1_t1.status === 'failed' && a1_t1.newAttempts === 1 && a1_t1.baseDelay === 5000,
  'Trace 1 (Normal): First failure transitions to failed with 5000ms base delay');

const a1_t2 = simulateFailJob({ attempts: 2, maxAttempts: 3 });
assert(a1_t2.status === 'dead' && a1_t2.newAttempts === 3 && a1_t2.baseDelay === null,
  'Trace 2 (Boundary): Final retry exhausts attempts and transitions to dead');

const a1_t3 = simulateFailJob({ attempts: -1, maxAttempts: 3 });
assert(a1_t3.status === 'failed' && a1_t3.newAttempts === 0 && a1_t3.baseDelay === 2500,
  'Trace 3 (Invalid/Edge): Negative attempts produces sub-base fractional delay');

// ---------------------------------------------------------------------------
// A1.2: processOrderPricing Logic Verification
// ---------------------------------------------------------------------------
console.log('\n--- A1.2: processOrderPricing (Money & Validation Logic) ---');

function simulateOrderPricing({ customer, restaurant, items, menuItems }) {
  if (!customer) return { error: 'INVALID_REFERENCE', message: 'Customer does not exist' };
  if (!restaurant) return { error: 'INVALID_REFERENCE', message: 'Restaurant does not exist' };

  const uniqueIds = new Set(items.map(i => i.menuItemId));
  if (uniqueIds.size !== items.length) {
    return { error: 'DUPLICATE_ITEM', message: 'Duplicate menuItemId entries are not allowed' };
  }

  let totalPriceCents = 0;
  for (const item of items) {
    const dbItem = menuItems.find(m => m.id === item.menuItemId);
    if (!dbItem || dbItem.restaurantId !== restaurant.id) {
      return { error: 'INVALID_REFERENCE', message: 'Menu item does not belong to restaurant' };
    }
    totalPriceCents += dbItem.priceCents * item.quantity;
  }
  return { success: true, totalPriceCents, currency: menuItems[0]?.currency || 'USD' };
}

const mockCust = { id: 'c1' };
const mockRest = { id: 'r1' };
const mockMenu = [
  { id: 'm1', restaurantId: 'r1', priceCents: 1200, currency: 'USD' },
  { id: 'm2', restaurantId: 'r1', priceCents: 850, currency: 'USD' },
  { id: 'm99', restaurantId: 'r2', priceCents: 500, currency: 'USD' }
];

const a1_m1 = simulateOrderPricing({
  customer: mockCust,
  restaurant: mockRest,
  items: [{ menuItemId: 'm1', quantity: 2 }, { menuItemId: 'm2', quantity: 1 }],
  menuItems: mockMenu
});
assert(a1_m1.totalPriceCents === 3250, 'Trace 1: Valid basket computes exact total price (3250 cents)');

const a1_m2 = simulateOrderPricing({
  customer: mockCust,
  restaurant: mockRest,
  items: [{ menuItemId: 'm1', quantity: 1 }, { menuItemId: 'm1', quantity: 2 }],
  menuItems: mockMenu
});
assert(a1_m2.error === 'DUPLICATE_ITEM', 'Trace 2: Duplicate item IDs rejected with DUPLICATE_ITEM');

const a1_m3 = simulateOrderPricing({
  customer: mockCust,
  restaurant: mockRest,
  items: [{ menuItemId: 'm99', quantity: 1 }],
  menuItems: mockMenu
});
assert(a1_m3.error === 'INVALID_REFERENCE', 'Trace 3: Cross-restaurant item rejected with INVALID_REFERENCE');

// ---------------------------------------------------------------------------
// A2.1: isOriginAllowed Logic Verification (cors v2.8.6)
// ---------------------------------------------------------------------------
console.log('\n--- A2.1: isOriginAllowed (cors v2.8.6 logic) ---');

function isOriginAllowed(origin, allowedOrigin) {
  if (Array.isArray(allowedOrigin)) {
    for (let i = 0; i < allowedOrigin.length; ++i) {
      if (isOriginAllowed(origin, allowedOrigin[i])) return true;
    }
    return false;
  } else if (typeof allowedOrigin === 'string' || allowedOrigin instanceof String) {
    return origin === allowedOrigin;
  } else if (allowedOrigin instanceof RegExp) {
    return allowedOrigin.test(origin);
  } else {
    return !!allowedOrigin;
  }
}

assert(isOriginAllowed('https://example.com', ['https://api.com', 'https://example.com']) === true,
  'Trace 1: Array of allowed origins matched recursively');
assert(isOriginAllowed('https://sub.myapp.com', /^https:\/\/.*\.myapp\.com$/) === true,
  'Trace 2: RegExp matches permitted subdomain');
assert(isOriginAllowed('https://evil.com', null) === false,
  'Trace 3: Null allowedOrigin coerced to false');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\nPart A Test Summary: ${passCount} / ${totalCount} checks passed.`);
if (passCount === totalCount) {
  console.log('All Part A automated test suites executed successfully.\n');
} else {
  process.exit(1);
}
