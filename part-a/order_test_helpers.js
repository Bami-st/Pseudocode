/**
 * Shared configuration and helpers for Part A1.2 fixture verification.
 * Loads database credentials from .env — never hardcodes secrets.
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { Client } = require('pg');
const { spawn } = require('child_process');
const http = require('http');

// --- Database config from environment ---
const DB_CONFIG = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_NAME || 'postgres',
  ...(process.env.TEST_DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {})
};

const TEST_SCHEMA = 'test_food_orders';
const SERVER_PORT = 3099;
const FOOD_API_DIR = path.resolve('c:/Users/User/Desktop/Consumable API/food-delivery-api');

// --- Fixture UUIDs ---
const CUST_A = 'a1b2c3d4-1111-4000-a000-000000000001';
const REST_A = 'b2c3d4e5-2222-4000-a000-000000000001';
const REST_B = 'b2c3d4e5-2222-4000-a000-000000000002';
const ITEM_A = 'c3d4e5f6-3333-4000-a000-000000000001';
const ITEM_B = 'c3d4e5f6-3333-4000-a000-000000000002';
const ITEM_C = 'c3d4e5f6-3333-4000-a000-000000000003';

// --- DDL: Create tables matching Prisma schema ---
const CREATE_TABLES_SQL = `
  CREATE SCHEMA IF NOT EXISTS "${TEST_SCHEMA}";
  SET search_path TO "${TEST_SCHEMA}";

  CREATE TABLE IF NOT EXISTS "Customer" (
    "id"        TEXT PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName"  TEXT NOT NULL,
    "email"     TEXT NOT NULL UNIQUE,
    "phone"     TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "Restaurant" (
    "id"          TEXT PRIMARY KEY,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "address"     TEXT NOT NULL,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "MenuItem" (
    "id"           TEXT PRIMARY KEY,
    "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"("id") ON DELETE CASCADE,
    "name"         TEXT NOT NULL,
    "description"  TEXT,
    "priceCents"   INTEGER NOT NULL,
    "currency"     TEXT NOT NULL,
    "isAvailable"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "Order" (
    "id"              TEXT PRIMARY KEY,
    "customerId"      TEXT NOT NULL REFERENCES "Customer"("id"),
    "restaurantId"    TEXT NOT NULL REFERENCES "Restaurant"("id"),
    "status"          TEXT NOT NULL DEFAULT 'pending',
    "totalPriceCents" INTEGER NOT NULL,
    "currency"        TEXT NOT NULL,
    "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id"                TEXT PRIMARY KEY,
    "orderId"           TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "menuItemId"        TEXT NOT NULL REFERENCES "MenuItem"("id"),
    "quantity"          INTEGER NOT NULL,
    "priceAtOrderCents" INTEGER NOT NULL,
    "currency"          TEXT NOT NULL,
    "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

// --- Seed fixture data ---
async function seedFixtureData(client) {
  await client.query(`SET search_path TO "${TEST_SCHEMA}"`);
  await client.query(`TRUNCATE "OrderItem", "Order", "MenuItem", "Restaurant", "Customer" CASCADE`);

  await client.query(
    `INSERT INTO "Customer" ("id", "firstName", "lastName", "email", "phone") VALUES ($1, 'Alice', 'Tester', 'alice.fixture@test.local', NULL)`,
    [CUST_A]
  );
  await client.query(
    `INSERT INTO "Restaurant" ("id", "name", "description", "address") VALUES ($1, 'Fixture Grill', 'Test restaurant for fixture verification', '1 Test Lane')`,
    [REST_A]
  );
  await client.query(
    `INSERT INTO "Restaurant" ("id", "name", "description", "address") VALUES ($1, 'Other Kitchen', 'Second restaurant for cross-ownership test', '2 Test Lane')`,
    [REST_B]
  );
  await client.query(
    `INSERT INTO "MenuItem" ("id", "restaurantId", "name", "priceCents", "currency", "isAvailable") VALUES ($1, $2, 'Classic Burger', 1200, 'USD', true)`,
    [ITEM_A, REST_A]
  );
  await client.query(
    `INSERT INTO "MenuItem" ("id", "restaurantId", "name", "priceCents", "currency", "isAvailable") VALUES ($1, $2, 'Fries', 450, 'USD', true)`,
    [ITEM_B, REST_A]
  );
  await client.query(
    `INSERT INTO "MenuItem" ("id", "restaurantId", "name", "priceCents", "currency", "isAvailable") VALUES ($1, $2, 'Sushi Roll', 1800, 'USD', true)`,
    [ITEM_C, REST_B]
  );
}

// --- Build DATABASE_URL for the food-delivery-api server ---
function buildServerDbUrl() {
  const { host, port, user, password, database } = DB_CONFIG;
  // URL-encode password in case it contains special characters
  const encodedPassword = encodeURIComponent(password);
  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${database}?schema=${TEST_SCHEMA}`;
}

// --- Send HTTP POST and return { statusCode, body } ---
function sendHTTPPost(port, urlPath, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(body) }); }
        catch (e) { resolve({ statusCode: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// --- Wait for server to accept requests ---
function waitForServer(port, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${port}/api/v1/restaurants?limit=1`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve());
      });
      req.on('error', () => {
        if (attempts >= maxAttempts) return reject(new Error('Server failed to start'));
        setTimeout(check, 1000);
      });
    };
    check();
  });
}

// --- Start the food-delivery-api server ---
function startServer() {
  const dbUrl = buildServerDbUrl();
  const serverProcess = spawn('node', ['index.js'], {
    cwd: FOOD_API_DIR,
    env: {
      ...process.env,
      PORT: String(SERVER_PORT),
      DATABASE_URL: dbUrl,
      DIRECT_URL: dbUrl,
      RATE_LIMIT_WINDOW_MS: '60000',
      RATE_LIMIT_MAX: '1000'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  serverProcess.stdout.on('data', (data) => console.log(`[Server stdout] ${data.toString().trim()}`));
  serverProcess.stderr.on('data', (data) => console.log(`[Server stderr] ${data.toString().trim()}`));
  return serverProcess;
}

// --- Setup: create schema, seed, start server ---
async function setup() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('[Setup] Connected to PostgreSQL.');

  console.log('[Setup] Creating test schema and tables...');
  await client.query(CREATE_TABLES_SQL);
  console.log('[Setup] Schema and tables created.');

  console.log('[Setup] Seeding fixture data...');
  await seedFixtureData(client);
  console.log('[Setup] Fixture data seeded.');

  const server = startServer();
  console.log(`[Server] Starting food-delivery-api on port ${SERVER_PORT}...`);
  await waitForServer(SERVER_PORT);
  console.log('[Server] Server is ready.');

  return { client, server };
}

// --- Teardown: drop schema, stop server ---
async function teardown(client, server) {
  console.log('\n[Cleanup] Dropping test schema...');
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${TEST_SCHEMA}" CASCADE`);
    console.log('[Cleanup] Schema dropped.');
  } catch (e) {
    console.error('[Cleanup] Failed to drop schema:', e.message);
  }
  await client.end();

  if (server) {
    console.log('[Cleanup] Stopping server...');
    server.kill('SIGTERM');
    await new Promise(r => setTimeout(r, 1000));
    if (!server.killed) server.kill('SIGKILL');
    console.log('[Cleanup] Server stopped.');
  }
}

module.exports = {
  DB_CONFIG, TEST_SCHEMA, SERVER_PORT,
  CUST_A, REST_A, REST_B, ITEM_A, ITEM_B, ITEM_C,
  sendHTTPPost, waitForServer, setup, teardown
};
