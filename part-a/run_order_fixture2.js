/**
 * Part A1.2 — Fixture 2: Duplicate menuItemId (Edge Case)
 *
 * Executes the ORIGINAL POST /orders handler from food-delivery-api/index.js
 * against an isolated PostgreSQL schema.
 *
 * Expected: HTTP 422, code DUPLICATE_ITEM, no database rows created.
 * Database credentials loaded from .env via shared helpers — never hardcoded.
 */

'use strict';

const {
  TEST_SCHEMA, CUST_A, REST_A, ITEM_A,
  sendHTTPPost, setup, teardown, SERVER_PORT
} = require('./order_test_helpers');

async function main() {
  const { client, server } = await setup();

  try {
    const fixture2Payload = {
      customerId: CUST_A,
      restaurantId: REST_A,
      items: [
        { menuItemId: ITEM_A, quantity: 1 },
        { menuItemId: ITEM_A, quantity: 3 }  // duplicate menuItemId
      ]
    };

    console.log('\n=== FIXTURE 2: DUPLICATE menuItemId ===');
    console.log('[Request] POST /api/v1/orders');
    console.log('[Request] Payload:', JSON.stringify(fixture2Payload, null, 2));

    const response = await sendHTTPPost(SERVER_PORT, '/api/v1/orders', fixture2Payload);

    console.log('\n--- EXECUTION REPORT: HTTP RESPONSE ---');
    console.log(`HTTP Status Code: ${response.statusCode}`);
    console.log('Response Body:', JSON.stringify(response.body, null, 2));

    // Query database — should be empty
    console.log('\n--- EXECUTION REPORT: DATABASE STATE ---');

    const orderRows = await client.query(
      `SELECT "id" FROM "${TEST_SCHEMA}"."Order"`
    );
    console.log(`Order rows created: ${orderRows.rowCount}`);

    const orderItemRows = await client.query(
      `SELECT "id" FROM "${TEST_SCHEMA}"."OrderItem"`
    );
    console.log(`OrderItem rows created: ${orderItemRows.rowCount}`);

    // Field-by-field comparison
    console.log('\n=== FIELD-BY-FIELD COMPARISON ===');

    console.log(`${response.statusCode === 422 ? '✓' : '✗'} HTTP Status: ${response.statusCode} (predicted: 422)`);

    const hasError = response.body && response.body.error;
    console.log(`${hasError ? '✓' : '✗'} Response has "error" envelope: ${!!hasError}`);

    if (hasError) {
      const err = response.body.error;
      const expectedCode = 'DUPLICATE_ITEM';
      const expectedMessage = 'Duplicate menuItemId entries are not allowed. Each menu item may only appear once per order.';

      console.log(`${err.code === expectedCode ? '✓' : '✗'} error.code: "${err.code}" (predicted: "${expectedCode}")`);
      console.log(`${err.message === expectedMessage ? '✓' : '✗'} error.message matches expected`);
      if (err.message !== expectedMessage) {
        console.log(`  Actual:   "${err.message}"`);
        console.log(`  Expected: "${expectedMessage}"`);
      }
    }

    const hasData = response.body && response.body.data;
    console.log(`${!hasData ? '✓' : '✗'} Response has no "data" key: ${!hasData}`);

    console.log(`${orderRows.rowCount === 0 ? '✓' : '✗'} DB Order rows: ${orderRows.rowCount} (predicted: 0)`);
    console.log(`${orderItemRows.rowCount === 0 ? '✓' : '✗'} DB OrderItem rows: ${orderItemRows.rowCount} (predicted: 0)`);

  } finally {
    await teardown(client, server);
  }
}

main().catch(err => { console.error('[FATAL]', err); process.exit(1); });
