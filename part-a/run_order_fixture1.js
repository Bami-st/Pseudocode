/**
 * Part A1.2 — Fixture 1: Native Execution Verification
 *
 * Executes the ORIGINAL POST /orders handler from food-delivery-api/index.js
 * against an isolated PostgreSQL schema.
 *
 * Database credentials loaded from .env via shared helpers — never hardcoded.
 */

'use strict';

const {
  TEST_SCHEMA, CUST_A, REST_A, ITEM_A, ITEM_B,
  sendHTTPPost, setup, teardown, SERVER_PORT
} = require('./order_test_helpers');

async function main() {
  const { client, server } = await setup();

  try {
    const fixture1Payload = {
      customerId: CUST_A,
      restaurantId: REST_A,
      items: [
        { menuItemId: ITEM_A, quantity: 2 },
        { menuItemId: ITEM_B, quantity: 1 }
      ]
    };

    console.log('\n=== FIXTURE 1: NORMAL 2-ITEM ORDER ===');
    console.log('[Request] POST /api/v1/orders');
    console.log('[Request] Payload:', JSON.stringify(fixture1Payload, null, 2));

    const response = await sendHTTPPost(SERVER_PORT, '/api/v1/orders', fixture1Payload);

    console.log('\n--- EXECUTION REPORT: HTTP RESPONSE ---');
    console.log(`HTTP Status Code: ${response.statusCode}`);
    console.log('Response Body:', JSON.stringify(response.body, null, 2));

    // Query database for created rows
    console.log('\n--- EXECUTION REPORT: DATABASE STATE ---');

    const orderRows = await client.query(
      `SELECT "id", "customerId", "restaurantId", "status", "totalPriceCents", "currency", "createdAt", "updatedAt"
       FROM "${TEST_SCHEMA}"."Order" ORDER BY "createdAt" ASC`
    );
    console.log(`Order rows created: ${orderRows.rowCount}`);
    console.log('Order rows:', JSON.stringify(orderRows.rows, null, 2));

    const orderItemRows = await client.query(
      `SELECT "id", "orderId", "menuItemId", "quantity", "priceAtOrderCents", "currency", "createdAt", "updatedAt"
       FROM "${TEST_SCHEMA}"."OrderItem" ORDER BY "menuItemId" ASC`
    );
    console.log(`OrderItem rows created: ${orderItemRows.rowCount}`);
    console.log('OrderItem rows:', JSON.stringify(orderItemRows.rows, null, 2));

    // Field-by-field comparison
    console.log('\n=== FIELD-BY-FIELD COMPARISON ===');

    console.log(`${response.statusCode === 201 ? '✓' : '✗'} HTTP Status: ${response.statusCode} (predicted: 201)`);

    const hasData = response.body && response.body.data;
    const hasMeta = response.body && response.body.meta;
    console.log(`${hasData ? '✓' : '✗'} Response has "data" key: ${!!hasData}`);
    console.log(`${!hasMeta ? '✓' : '✗'} Response has no "meta" key: ${!hasMeta} (predicted: no meta)`);

    if (hasData) {
      const order = response.body.data;
      console.log(`${order.totalPriceCents === 2850 ? '✓' : '✗'} totalPriceCents: ${order.totalPriceCents} (predicted: 2850)`);
      console.log(`${order.currency === 'USD' ? '✓' : '✗'} currency: "${order.currency}" (predicted: "USD")`);
      console.log(`${order.status === 'pending' ? '✓' : '✗'} status: "${order.status}" (predicted: "pending")`);
      console.log(`${order.customerId === CUST_A ? '✓' : '✗'} customerId matches CUST-A`);
      console.log(`${order.restaurantId === REST_A ? '✓' : '✗'} restaurantId matches REST-A`);
      console.log(`  id (generated): "${order.id}"`);

      if (order.orderItems && Array.isArray(order.orderItems)) {
        console.log(`${order.orderItems.length === 2 ? '✓' : '✗'} orderItems count: ${order.orderItems.length} (predicted: 2)`);

        const itemA = order.orderItems.find(i => i.menuItemId === ITEM_A);
        const itemB = order.orderItems.find(i => i.menuItemId === ITEM_B);

        if (itemA) {
          console.log(`✓ ITEM-A found`);
          console.log(`${itemA.quantity === 2 ? '✓' : '✗'}   quantity: ${itemA.quantity} (predicted: 2)`);
          console.log(`${itemA.priceAtOrderCents === 1200 ? '✓' : '✗'}   priceAtOrderCents: ${itemA.priceAtOrderCents} (predicted: 1200)`);
          console.log(`${itemA.currency === 'USD' ? '✓' : '✗'}   currency: "${itemA.currency}" (predicted: "USD")`);
        } else { console.log('✗ ITEM-A NOT found'); }

        if (itemB) {
          console.log(`✓ ITEM-B found`);
          console.log(`${itemB.quantity === 1 ? '✓' : '✗'}   quantity: ${itemB.quantity} (predicted: 1)`);
          console.log(`${itemB.priceAtOrderCents === 450 ? '✓' : '✗'}   priceAtOrderCents: ${itemB.priceAtOrderCents} (predicted: 450)`);
          console.log(`${itemB.currency === 'USD' ? '✓' : '✗'}   currency: "${itemB.currency}" (predicted: "USD")`);
        } else { console.log('✗ ITEM-B NOT found'); }
      }
    }

    console.log(`\n${orderRows.rowCount === 1 ? '✓' : '✗'} DB Order rows: ${orderRows.rowCount} (predicted: 1)`);
    console.log(`${orderItemRows.rowCount === 2 ? '✓' : '✗'} DB OrderItem rows: ${orderItemRows.rowCount} (predicted: 2)`);

  } finally {
    await teardown(client, server);
  }
}

main().catch(err => { console.error('[FATAL]', err); process.exit(1); });
