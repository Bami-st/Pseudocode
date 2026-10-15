# Part A1.2: Money & Authorisation — Order Creation Handler

## Provenance

- **Project**: Food Delivery API (`c:\Users\User\Desktop\Consumable API\food-delivery-api`)
- **Source File**: [`index.js`](file:///c:/Users/User/Desktop/Pseudocode/source_index.js), lines 292–370
- **Identity**: Anonymous `async` callback registered as `router.post('/orders', ...)`.
  This is **not** a standalone named function. The label `processOrderPricingAndCreation` used in an earlier draft was a descriptive convenience; no function of that name exists in the source code.
- **Framework**: Express 5 route handler receiving `(req, res, next)`.
- **Database**: Prisma Client ORM over PostgreSQL (Supabase-hosted).
- **Schema models used**: `Customer`, `Restaurant`, `MenuItem`, `Order`, `OrderItem` — see [`schema.prisma`](file:///c:/Users/User/Desktop/Pseudocode/source_schema.prisma).

---

## Complete Original Source Code

The handler spans lines 292–370 of `index.js`. It also depends on two helper functions defined at lines 40–48:

### Helper functions (lines 40–48)

```javascript
// line 40
const sendSuccess = (res, data, meta = null, statusCode = 200) => {
  const payload = { data };
  if (meta) payload.meta = meta;
  res.status(statusCode).json(payload);
};

// line 46
const sendError = (res, statusCode, code, message) => {
  res.status(statusCode).json({ error: { code, message } });
};
```

### POST /orders handler (lines 292–370)

```javascript
router.post('/orders', async (req, res, next) => {
  try {
    const schema = Joi.object({
      customerId: Joi.string().uuid().required(),
      restaurantId: Joi.string().uuid().required(),
      items: Joi.array().items(Joi.object({
        menuItemId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required()
      })).min(1).required()
    });

    const { error, value: body } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const message = error.details.map(d => d.message).join(', ');
      return sendError(res, 422, 'UNPROCESSABLE_ENTITY', message);
    }

    const { customerId, restaurantId, items } = body;

    // Validations: check customer exists, restaurant exists, items exist and belong to restaurant
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return sendError(res, 422, 'INVALID_REFERENCE', 'Customer does not exist');

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return sendError(res, 422, 'INVALID_REFERENCE', 'Restaurant does not exist');

    const menuItemIds = items.map(i => i.menuItemId);

    // Reject duplicate menuItemId entries upfront — combining quantities silently would
    // hide client mistakes; a clear 422 tells callers to deduplicate before retrying.
    const uniqueMenuItemIds = new Set(menuItemIds);
    if (uniqueMenuItemIds.size !== menuItemIds.length) {
      return sendError(res, 422, 'DUPLICATE_ITEM',
        'Duplicate menuItemId entries are not allowed. Each menu item may only appear once per order.');
    }

    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });

    if (menuItems.length !== uniqueMenuItemIds.size) {
      return sendError(res, 422, 'INVALID_REFERENCE', 'One or more menu items do not exist');
    }

    let totalPriceCents = 0;
    const orderItemsData = items.map(reqItem => {
      const dbItem = menuItems.find(m => m.id === reqItem.menuItemId);
      if (dbItem.restaurantId !== restaurantId) {
        throw { status: 422, code: 'INVALID_REFERENCE',
          message: `Menu item ${dbItem.id} does not belong to restaurant ${restaurantId}` };
      }
      totalPriceCents += dbItem.priceCents * reqItem.quantity;
      return {
        menuItemId: dbItem.id,
        quantity: reqItem.quantity,
        priceAtOrderCents: dbItem.priceCents,
        currency: dbItem.currency
      };
    });

    // Atomic transaction for order creation
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId,
          restaurantId,
          totalPriceCents,
          currency: menuItems[0].currency, // assuming uniform currency
          orderItems: {
            create: orderItemsData
          }
        },
        include: { orderItems: true }
      });
      return order;
    });

    sendSuccess(res, newOrder, null, 201);
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.code, error.message);
    next(error);
  }
});
```

### Express error-handling middleware (lines 409–424)

If `next(error)` is called, this middleware handles the error:

```javascript
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2023') {
      return sendError(res, 400, 'BAD_REQUEST', 'Malformed identifier in request');
    }
    if (err.code === 'P2025') {
      return sendError(res, 404, 'NOT_FOUND', 'Record not found');
    }
  }
  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred.');
});
```

---

## Joi Validation Rules (Code-Enforced)

The handler defines an inline Joi schema at lines 294–301. These rules are enforced **before** any database query:

| Field | Rule | Joi Method |
| :--- | :--- | :--- |
| `customerId` | Required string, must be valid UUID format | `Joi.string().uuid().required()` |
| `restaurantId` | Required string, must be valid UUID format | `Joi.string().uuid().required()` |
| `items` | Required array, minimum 1 element | `Joi.array().min(1).required()` |
| `items[].menuItemId` | Required string, must be valid UUID format | `Joi.string().uuid().required()` |
| `items[].quantity` | Required integer, minimum value 1 | `Joi.number().integer().min(1).required()` |

Validation uses `{ abortEarly: false }`, meaning **all** violations are collected and returned in a single comma-joined message. The error response uses HTTP 422 with code `UNPROCESSABLE_ENTITY`.

---

## Pseudocode Specification

```
FUNCTION postOrdersHandler
INPUTS:
  req.body: Object, the HTTP request body containing:
    customerId: String, UUID of the customer placing the order
    restaurantId: String, UUID of the restaurant fulfilling the order
    items: Array of Object, each containing:
      menuItemId: String, UUID of a menu item
      quantity: Integer, number of that item to order
OUTPUT:
  HTTP response: either a success envelope (status 201) containing the created Order object
  with nested OrderItem objects, or an error envelope (status 422 or 500)
SIDE EFFECTS:
  WRITE database: one Order row and one OrderItem row per item, created atomically in a transaction
FAILS WHEN:
  — req.body fails Joi validation (missing fields, wrong types, non-UUID strings,
    quantity < 1, empty items array): responds 422 UNPROCESSABLE_ENTITY
  — customerId does not match any Customer row: responds 422 INVALID_REFERENCE
  — restaurantId does not match any Restaurant row: responds 422 INVALID_REFERENCE
  — items array contains duplicate menuItemId values: responds 422 DUPLICATE_ITEM
  — any menuItemId does not match a MenuItem row: responds 422 INVALID_REFERENCE
  — any matched MenuItem belongs to a different restaurant than restaurantId:
    responds 422 INVALID_REFERENCE (via thrown object caught by catch block)
  — database transaction fails for any other reason: responds 500 INTERNAL_SERVER_ERROR

1. DEFINE Joi schema requiring customerId (string, UUID), restaurantId (string, UUID),
   and items (array of {menuItemId: string UUID, quantity: integer >= 1}, minimum 1 element).
2. VALIDATE req.body against schema with abortEarly = false.
3. IF validation fails:
   JOIN all error detail messages with ', '.
   SEND HTTP 422 response with code 'UNPROCESSABLE_ENTITY' and the joined message.
   STOP.
4. DESTRUCTURE customerId, restaurantId, and items from the validated body.
5. QUERY database for Customer record where id equals customerId.
6. IF customer not found:
   SEND HTTP 422 response with code 'INVALID_REFERENCE' and message 'Customer does not exist'.
   STOP.
7. QUERY database for Restaurant record where id equals restaurantId.
8. IF restaurant not found:
   SEND HTTP 422 response with code 'INVALID_REFERENCE' and message 'Restaurant does not exist'.
   STOP.
9. EXTRACT list of menuItemId values from items.
10. CREATE a Set from the menuItemId list.
11. IF Set size does not equal list length:
    SEND HTTP 422 response with code 'DUPLICATE_ITEM' and message
    'Duplicate menuItemId entries are not allowed. Each menu item may only appear once per order.'.
    STOP.
12. QUERY database for all MenuItem records whose id is in the menuItemId list.
13. IF count of found MenuItems does not equal Set size:
    SEND HTTP 422 response with code 'INVALID_REFERENCE'
    and message 'One or more menu items do not exist'.
    STOP.
14. SET totalPriceCents to 0.
15. FOR EACH reqItem in items:
    a. FIND dbItem in the found MenuItems where dbItem.id equals reqItem.menuItemId.
    b. IF dbItem.restaurantId does not equal restaurantId:
       THROW object with status 422, code 'INVALID_REFERENCE',
       message 'Menu item {dbItem.id} does not belong to restaurant {restaurantId}'.
    c. ADD (dbItem.priceCents × reqItem.quantity) to totalPriceCents.
    d. BUILD orderItem record: menuItemId, quantity, priceAtOrderCents = dbItem.priceCents,
       currency = dbItem.currency.
16. BEGIN database transaction:
    a. CREATE one Order row with: customerId, restaurantId, totalPriceCents,
       currency = first found MenuItem's currency, and nested creation of all orderItem records.
    b. RETURN the created Order including its OrderItems.
17. SEND HTTP 201 response wrapping the created Order in a success envelope.

CATCH block:
18. IF caught error has a .status property:
    SEND HTTP response using error.status, error.code, error.message.
OTHERWISE:
    PASS error to Express next() for global error handling middleware.
```

### Observations about code behaviour worth noting

1. **Currency assumption**: Step 16a uses `menuItems[0].currency` — the currency of the *first MenuItem in the array returned by the database query*. This is **not** necessarily the first item in the request's `items` array, because `findMany` does not guarantee order. If menu items had mixed currencies, the Order.currency could be unpredictable.

2. **Duplicate check position**: Duplicates are checked *before* fetching menu items from the database (steps 10–11), so the duplicate error takes priority over a "does not exist" error for the same input.

3. **Restaurant ownership via throw**: The cross-restaurant check at step 15b uses `throw` (not `return sendError`), so it exits the `.map()` callback and is caught by the outer `catch` at step 18.

4. **Order.status default**: The Prisma schema defines `@default("pending")` — the handler does not set status explicitly, so every new order starts as `"pending"`.

5. **isAvailable not checked**: The handler does **not** check `MenuItem.isAvailable`. An unavailable item can still be ordered.

---

## Execution Fixtures

### Test Isolation Strategy

The original handler runs inside an Express server using Prisma Client connected to a PostgreSQL database. To test natively:

1. **Isolated schema**: Create a dedicated PostgreSQL schema (e.g., `test_food_orders`) on the same Supabase instance.
2. **Apply Prisma migrations** to that schema so all tables exist.
3. **Seed fixture data** (customers, restaurants, menu items) with known UUIDs.
4. **Start the server** with `DATABASE_URL` pointing to the isolated schema.
5. **Send HTTP POST requests** to `http://localhost:{PORT}/api/v1/orders`.
6. **Capture HTTP response** (status code, body) and query the database for created rows.
7. **Tear down** by truncating all tables after each fixture.

This executes the original, untouched handler — no simulation or rewritten logic.

### Fixture Data (shared across all three fixtures)

**Customer — Row CUST-A:**

| Field | Value |
| :--- | :--- |
| id | `a1b2c3d4-1111-4000-a000-000000000001` |
| firstName | `Alice` |
| lastName | `Tester` |
| email | `alice.fixture@test.local` |
| phone | `null` |

**Restaurant — Row REST-A:**

| Field | Value |
| :--- | :--- |
| id | `b2c3d4e5-2222-4000-a000-000000000001` |
| name | `Fixture Grill` |
| description | `Test restaurant for fixture verification` |
| address | `1 Test Lane` |

**Restaurant — Row REST-B (for cross-restaurant test):**

| Field | Value |
| :--- | :--- |
| id | `b2c3d4e5-2222-4000-a000-000000000002` |
| name | `Other Kitchen` |
| description | `Second restaurant for cross-ownership test` |
| address | `2 Test Lane` |

**MenuItem — Row ITEM-A (belongs to REST-A):**

| Field | Value |
| :--- | :--- |
| id | `c3d4e5f6-3333-4000-a000-000000000001` |
| restaurantId | `b2c3d4e5-2222-4000-a000-000000000001` (REST-A) |
| name | `Classic Burger` |
| priceCents | `1200` |
| currency | `USD` |
| isAvailable | `true` |

**MenuItem — Row ITEM-B (belongs to REST-A):**

| Field | Value |
| :--- | :--- |
| id | `c3d4e5f6-3333-4000-a000-000000000002` |
| restaurantId | `b2c3d4e5-2222-4000-a000-000000000001` (REST-A) |
| name | `Fries` |
| priceCents | `450` |
| currency | `USD` |
| isAvailable | `true` |

**MenuItem — Row ITEM-C (belongs to REST-B, not REST-A):**

| Field | Value |
| :--- | :--- |
| id | `c3d4e5f6-3333-4000-a000-000000000003` |
| restaurantId | `b2c3d4e5-2222-4000-a000-000000000002` (REST-B) |
| name | `Sushi Roll` |
| priceCents | `1800` |
| currency | `USD` |
| isAvailable | `true` |

---

### Fixture 1 — Normal: Valid 2-Item Order

**HTTP Request:**
```
POST /api/v1/orders
Content-Type: application/json

{
  "customerId": "a1b2c3d4-1111-4000-a000-000000000001",
  "restaurantId": "b2c3d4e5-2222-4000-a000-000000000001",
  "items": [
    { "menuItemId": "c3d4e5f6-3333-4000-a000-000000000001", "quantity": 2 },
    { "menuItemId": "c3d4e5f6-3333-4000-a000-000000000002", "quantity": 1 }
  ]
}
```

**Initial database state:** Rows CUST-A, REST-A, REST-B, ITEM-A, ITEM-B, ITEM-C exist. No Order or OrderItem rows exist.

**Your prediction should cover:**
- HTTP status code
- Response body structure and key values (totalPriceCents, currency, status, number and content of orderItems)
- Database side effects: how many Order rows created? How many OrderItem rows? What values?

---

### Fixture 2 — Edge Case: Duplicate menuItemId

**HTTP Request:**
```
POST /api/v1/orders
Content-Type: application/json

{
  "customerId": "a1b2c3d4-1111-4000-a000-000000000001",
  "restaurantId": "b2c3d4e5-2222-4000-a000-000000000001",
  "items": [
    { "menuItemId": "c3d4e5f6-3333-4000-a000-000000000001", "quantity": 1 },
    { "menuItemId": "c3d4e5f6-3333-4000-a000-000000000001", "quantity": 3 }
  ]
}
```

**Initial database state:** Same as Fixture 1 (no orders exist).

**Your prediction should cover:**
- HTTP status code
- Response body (error code and message)
- Database side effects: any rows created?
- Which pseudocode step triggers the rejection?

---

### Fixture 3 — Invalid: Cross-Restaurant Item

**HTTP Request:**
```
POST /api/v1/orders
Content-Type: application/json

{
  "customerId": "a1b2c3d4-1111-4000-a000-000000000001",
  "restaurantId": "b2c3d4e5-2222-4000-a000-000000000001",
  "items": [
    { "menuItemId": "c3d4e5f6-3333-4000-a000-000000000001", "quantity": 1 },
    { "menuItemId": "c3d4e5f6-3333-4000-a000-000000000003", "quantity": 1 }
  ]
}
```

**Notes:** ITEM-A belongs to REST-A (the requested restaurant). ITEM-C belongs to REST-B (a *different* restaurant). The request claims both items are from REST-A.

**Initial database state:** Same as Fixture 1 (no orders exist).

**Your prediction should cover:**
- HTTP status code
- Response body (error code and message, including which item ID appears in the message)
- Database side effects: any rows created?
- Which pseudocode step triggers the rejection, and via what mechanism (return vs throw)?
- Does the totalPriceCents accumulation from ITEM-A in step 15c execute before the error on ITEM-C in step 15b?

---

## Human Hand Traces

### Fixture 1 — Guided Trace (completed with AI assistance)

**Prediction (user-authored with AI guidance on response structure):**

- HTTP status: **201 Created**
- Response body: `{ data: <Order> }` — no `meta` key (because `meta` is `null`)
- `data.totalPriceCents`: **2850** (2 × 1200 + 1 × 450)
- `data.currency`: **"USD"**
- `data.status`: **"pending"** (schema default, not set by handler)
- `data.customerId`: CUST-A UUID
- `data.restaurantId`: REST-A UUID
- `data.id`, `data.createdAt`, `data.updatedAt`: generated values, unpredictable
- `data.orderItems`: array of **2** objects:
  - ITEM-A: `quantity: 2`, `priceAtOrderCents: 1200`, `currency: "USD"`
  - ITEM-B: `quantity: 1`, `priceAtOrderCents: 450`, `currency: "USD"`
  - Each also contains generated `id`, `orderId`, `createdAt`, `updatedAt`
  - `priceAtOrderCents` is the **per-unit** price, not the line total
- Database side effects: **1 Order row**, **2 OrderItem rows**

**Native execution result (original handler via HTTP, isolated schema `test_food_orders`):**

Verification script: [`run_order_fixture1.js`](file:///c:/Users/User/Desktop/Pseudocode/part-a/run_order_fixture1.js)

```
HTTP Status Code: 201
Response Body:
{
  "data": {
    "id": "99d634e6-b79c-4ed7-8172-0d76e2313b1f",
    "customerId": "a1b2c3d4-1111-4000-a000-000000000001",
    "restaurantId": "b2c3d4e5-2222-4000-a000-000000000001",
    "status": "pending",
    "totalPriceCents": 2850,
    "currency": "USD",
    "createdAt": "2026-10-15T17:07:48.970Z",
    "updatedAt": "2026-10-15T17:07:48.970Z",
    "orderItems": [
      {
        "id": "4748f3bd-62a2-44bf-b225-ad11a1dfb7c7",
        "orderId": "99d634e6-b79c-4ed7-8172-0d76e2313b1f",
        "menuItemId": "c3d4e5f6-3333-4000-a000-000000000001",
        "quantity": 2,
        "priceAtOrderCents": 1200,
        "currency": "USD",
        "createdAt": "2026-10-15T17:07:48.970Z",
        "updatedAt": "2026-10-15T17:07:48.970Z"
      },
      {
        "id": "de54527e-3bca-4cd5-a9e5-f6d3d746aa20",
        "orderId": "99d634e6-b79c-4ed7-8172-0d76e2313b1f",
        "menuItemId": "c3d4e5f6-3333-4000-a000-000000000002",
        "quantity": 1,
        "priceAtOrderCents": 450,
        "currency": "USD",
        "createdAt": "2026-10-15T17:07:48.970Z",
        "updatedAt": "2026-10-15T17:07:48.970Z"
      }
    ]
  }
}
```

**Field-by-field comparison:**

| Field | Predicted | Actual | Match |
| :--- | :--- | :--- | :--- |
| HTTP Status | 201 | 201 | ✓ |
| Envelope key `data` present | yes | yes | ✓ |
| Envelope key `meta` absent | yes | yes | ✓ |
| `totalPriceCents` | 2850 | 2850 | ✓ |
| `currency` | "USD" | "USD" | ✓ |
| `status` | "pending" | "pending" | ✓ |
| `customerId` | CUST-A UUID | CUST-A UUID | ✓ |
| `restaurantId` | REST-A UUID | REST-A UUID | ✓ |
| `orderItems` count | 2 | 2 | ✓ |
| ITEM-A `quantity` | 2 | 2 | ✓ |
| ITEM-A `priceAtOrderCents` | 1200 | 1200 | ✓ |
| ITEM-A `currency` | "USD" | "USD" | ✓ |
| ITEM-B `quantity` | 1 | 1 | ✓ |
| ITEM-B `priceAtOrderCents` | 450 | 450 | ✓ |
| ITEM-B `currency` | "USD" | "USD" | ✓ |
| DB Order rows | 1 | 1 | ✓ |
| DB OrderItem rows | 2 | 2 | ✓ |

**Result: 17/17 fields match. Zero discrepancies.**

---

### Fixture 2 — Edge Case: Duplicate menuItemId

**Prediction (user-authored with AI guidance):**

- HTTP status: **422 Unprocessable Entity**
- Response body:
  ```json
  {
    "error": {
      "code": "DUPLICATE_ITEM",
      "message": "Duplicate menuItemId entries are not allowed. Each menu item may only appear once per order."
    }
  }
  ```
- Database side effects: **0 Order rows**, **0 OrderItem rows** created. Quantities are not combined.
- Triggering step: **Pseudocode Steps 10–11** (corresponds to lines 320–324 of [`index.js`](file:///c:/Users/User/Desktop/Consumable%20API/food-delivery-api/index.js#L320-L324)).

**Native execution result (original handler via HTTP, isolated schema `test_food_orders`):**

Verification script: [`run_order_fixture2.js`](file:///c:/Users/User/Desktop/Pseudocode/part-a/run_order_fixture2.js)

```
HTTP Status Code: 422
Response Body:
{
  "error": {
    "code": "DUPLICATE_ITEM",
    "message": "Duplicate menuItemId entries are not allowed. Each menu item may only appear once per order."
  }
}
```

**Field-by-field comparison:**

| Field | Predicted | Actual | Match |
| :--- | :--- | :--- | :--- |
| HTTP Status | 422 | 422 | ✓ |
| Envelope key `error` present | yes | yes | ✓ |
| `error.code` | "DUPLICATE_ITEM" | "DUPLICATE_ITEM" | ✓ |
| `error.message` | "Duplicate menuItemId entries are not allowed. Each menu item may only appear once per order." | "Duplicate menuItemId entries are not allowed. Each menu item may only appear once per order." | ✓ |
| Envelope key `data` absent | yes | yes | ✓ |
| DB Order rows | 0 | 0 | ✓ |
| DB OrderItem rows | 0 | 0 | ✓ |

**Result: 7/7 fields match. Zero discrepancies.**

---

### Fixture 3 — Invalid: Cross-Restaurant Item

**Prediction (user-authored with AI guidance):**

- HTTP status: **422 Unprocessable Entity**
- Exact response body:
  ```json
  {
    "error": {
      "code": "INVALID_REFERENCE",
      "message": "Menu item c3d4e5f6-3333-4000-a000-000000000003 does not belong to restaurant b2c3d4e5-2222-4000-a000-000000000001"
    }
  }
  ```
- Database side effects: **0 Order rows**, **0 OrderItem rows** created. Step 16’s transaction is never reached.
- Rejection mechanism: Step 15b throws when processing ITEM-C. Step 18 catches the object and sends its status, code, and message using `sendError`.
- Accumulation: ITEM-A adds 1200 to `totalPriceCents` at Step 15c and builds its in-memory item record. ITEM-C throws before adding its price. The local total remains 1200, but nothing is saved or returned as a successful order.

**Native execution result (original handler via HTTP, isolated schema `test_food_orders`):**

Verification script: [`run_order_fixture3.js`](file:///c:/Users/User/Desktop/Pseudocode/part-a/run_order_fixture3.js)

```
HTTP Status Code: 422
Response Body:
{
  "error": {
    "code": "INVALID_REFERENCE",
    "message": "Menu item c3d4e5f6-3333-4000-a000-000000000003 does not belong to restaurant b2c3d4e5-2222-4000-a000-000000000001"
  }
}
```

**Field-by-field comparison:**

| Field | Predicted | Actual | Match |
| :--- | :--- | :--- | :--- |
| HTTP Status | 422 | 422 | ✓ |
| Envelope key `error` present | yes | yes | ✓ |
| `error.code` | "INVALID_REFERENCE" | "INVALID_REFERENCE" | ✓ |
| `error.message` | "Menu item c3d4e5f6-3333-4000-a000-000000000003 does not belong to restaurant b2c3d4e5-2222-4000-a000-000000000001" | "Menu item c3d4e5f6-3333-4000-a000-000000000003 does not belong to restaurant b2c3d4e5-2222-4000-a000-000000000001" | ✓ |
| Envelope key `data` absent | yes | yes | ✓ |
| DB Order rows | 0 | 0 | ✓ |
| DB OrderItem rows | 0 | 0 | ✓ |

**Result: 7/7 fields match. Zero discrepancies.**

---

### Distinction: Directly Observed External Behavior vs. Source-Traced Internal Behavior

1. **Directly Observed Externally (HTTP & Database Verification)**:
   - **HTTP Status**: Exactly `422`.
   - **Response Envelope**: Standard `{ error: { code, message } }` with no `data` or `meta` keys.
   - **Error Payload**: Code `"INVALID_REFERENCE"` and dynamic message naming ITEM-C (`c3d4e5f6-3333-4000-a000-000000000003`) and REST-A (`b2c3d4e5-2222-4000-a000-000000000001`).
   - **Database State**: Confirmed via direct SQL queries on PostgreSQL isolated schema `test_food_orders` that exactly 0 rows were inserted into `"Order"` and 0 rows into `"OrderItem"`.

2. **Source-Traced Internal Behavior (In-Memory State & Execution Flow)**:
   - **Sequential Loop Processing**: JavaScript `items.map(...)` iterates through elements in index order.
     - *Iteration 0 (ITEM-A)*: Checks `dbItem.restaurantId === restaurantId` (true, both REST-A), increments `totalPriceCents` from 0 to 1200 (`totalPriceCents += 1200 * 1`), and pushes the transformed item into `orderItemsData`.
     - *Iteration 1 (ITEM-C)*: Checks `dbItem.restaurantId === restaurantId` (false, REST-B vs REST-A), hitting line 337 / Step 15b.
   - **Exception Control Flow**: Rather than returning early via `sendError`, the handler executes:
     `throw { status: 422, code: 'INVALID_REFERENCE', message: ... }`.
     This abruptly terminates `.map()` execution before `totalPriceCents` can accumulate ITEM-C's price.
   - **Discarded Local State**: The local in-memory accumulator `totalPriceCents` holds `1200` when the exception is thrown, but is discarded as execution jumps to the enclosing `catch (error)` block (line 366 / Step 18).
   - **Bypassed Transaction**: Because the exception unwinds control before line 349 (`prisma.$transaction`), no database write transaction is ever started or rolled back.
   - **Catch Dispatch**: Step 18 inspects `error.status` (422), which is truthy, invoking `sendError(res, error.status, error.code, error.message)`. If `error.status` had been undefined, it would have called `next(error)` to trigger the 500 handler.


