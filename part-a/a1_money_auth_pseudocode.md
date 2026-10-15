# Part A1.2: Money & Authorisation Function from Own Work

## Provenance
- **Project**: Food Delivery API (`c:\Users\User\Desktop\Consumable API\food-delivery-api`)
- **Commit**: `b018baf` (*Add isolated PostgreSQL test runner and remote environment safety guards*)
- **Source File**: `index.js` (lines 280-360)
- **Function Name**: `processOrderPricingAndCreation` (Extracted order pricing and transactional creation logic)

---

## Source Implementation Reference
```javascript
// Validations: check customer exists, restaurant exists, items exist and belong to restaurant
const customer = await prisma.customer.findUnique({ where: { id: customerId } });
if (!customer) return sendError(res, 422, 'INVALID_REFERENCE', 'Customer does not exist');

const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
if (!restaurant) return sendError(res, 422, 'INVALID_REFERENCE', 'Restaurant does not exist');

const menuItemIds = items.map(i => i.menuItemId);

const uniqueMenuItemIds = new Set(menuItemIds);
if (uniqueMenuItemIds.size !== menuItemIds.length) {
  return sendError(res, 422, 'DUPLICATE_ITEM', 'Duplicate menuItemId entries are not allowed.');
}

const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });
if (menuItems.length !== uniqueMenuItemIds.size) {
  return sendError(res, 422, 'INVALID_REFERENCE', 'One or more menu items do not exist');
}

let totalPriceCents = 0;
const orderItemsData = items.map(reqItem => {
  const dbItem = menuItems.find(m => m.id === reqItem.menuItemId);
  if (dbItem.restaurantId !== restaurantId) {
    throw { status: 422, code: 'INVALID_REFERENCE', message: `Menu item ${dbItem.id} does not belong to restaurant ${restaurantId}` };
  }
  totalPriceCents += dbItem.priceCents * reqItem.quantity;
  return {
    menuItemId: dbItem.id,
    quantity: reqItem.quantity,
    priceAtOrderCents: dbItem.priceCents,
    currency: dbItem.currency
  };
});

const newOrder = await prisma.$transaction(async (tx) => {
  return await tx.order.create({
    data: {
      customerId,
      restaurantId,
      totalPriceCents,
      currency: menuItems[0].currency,
      orderItems: { create: orderItemsData }
    },
    include: { orderItems: true }
  });
});
```

---

## Pseudocode Specification (Standard Compliance)

```markdown
FUNCTION processOrderPricingAndCreation
INPUTS:
  customerId: String, UUID of customer placing order
  restaurantId: String, UUID of restaurant fulfilling order
  items: Array of Object, each containing menuItemId (String) and quantity (Integer)
OUTPUT:
  order: Object, created order record containing id, customerId, restaurantId, totalPriceCents, currency, and nested orderItems
SIDE EFFECTS:
  WRITE database: atomic transaction creating Order row and associated OrderItem rows
FAILS WHEN:
  customerId not found in database, restaurantId not found in database, duplicate menuItemIds in request, menu item does not exist, menu item does not belong to specified restaurant, or database transaction fails

1. CALL database to find customer record matching customerId.
2. IF customer record is not found:
   RETURN error with code 'INVALID_REFERENCE' and message 'Customer does not exist'.
3. CALL database to find restaurant record matching restaurantId.
4. IF restaurant record is not found:
   RETURN error with code 'INVALID_REFERENCE' and message 'Restaurant does not exist'.
5. CREATE empty set of uniqueMenuItemIds.
6. FOR EACH item in items:
   a. IF uniqueMenuItemIds already contains item.menuItemId:
      RETURN error with code 'DUPLICATE_ITEM' and message 'Duplicate menuItemId entries are not allowed'.
   b. ADD item.menuItemId to uniqueMenuItemIds.
7. CALL database to find all menuItem records with id in uniqueMenuItemIds.
8. IF number of found menuItem records is not equal to size of uniqueMenuItemIds:
   RETURN error with code 'INVALID_REFERENCE' and message 'One or more menu items do not exist'.
9. INITIALISE totalPriceCents to 0.
10. INITIALISE orderItemsData to empty list.
11. FOR EACH item in items:
    a. FIND matching dbItem in found menuItem records.
    b. IF dbItem.restaurantId is not equal to restaurantId:
       RETURN error with code 'INVALID_REFERENCE' and message 'Menu item does not belong to restaurant'.
    c. MULTIPLY dbItem.priceCents by item.quantity to get lineItemTotal.
    d. ADD lineItemTotal to totalPriceCents.
    e. APPEND object containing menuItemId, quantity, priceAtOrderCents (dbItem.priceCents), and currency to orderItemsData.
12. CALL database transaction:
    a. WRITE new Order row with customerId, restaurantId, totalPriceCents, currency of first menu item, and nested orderItemsData.
13. RETURN created order record.
```

---

## Human Hand Traces (User Action Required)

### Trace 1: Normal Input (Valid 2-item basket)
- **Input**:
  - `customerId`: `'c1'` (exists)
  - `restaurantId`: `'r1'` (exists)
  - `items`: `[ { menuItemId: 'm1', quantity: 2 }, { menuItemId: 'm2', quantity: 1 } ]`
  - DB: `m1` price = 1200 cents (restaurant `r1`), `m2` price = 850 cents (restaurant `r1`).
- **User Hand-Traced Prediction**:
  - Returned Value: Order object with `totalPriceCents = 3250` (2*1200 + 1*850), currency `'USD'`.
  - Side Effects: 1 Order row created, 2 OrderItem rows created.
  - Execution Result: *[Pending execution]*
  - Discrepancy / Correction: *[Pending verification]*

### Trace 2: Edge Case (Duplicate menuItemId in Request)
- **Input**: `customerId = 'c1'`, `restaurantId = 'r1'`, `items = [ { menuItemId: 'm1', quantity: 1 }, { menuItemId: 'm1', quantity: 3 } ]`.
- **User Hand-Traced Prediction**:
  - Returned Value: Error `'DUPLICATE_ITEM'`
  - Side Effects: NONE (aborted before database transaction).
  - Execution Result: *[Pending execution]*
  - Discrepancy / Correction: *[Pending verification]*

### Trace 3: Invalid Input (Cross-Restaurant Item Hijack)
- **Input**: `customerId = 'c1'`, `restaurantId = 'r1'`, `items = [ { menuItemId: 'm99', quantity: 1 } ]` where `m99` belongs to `restaurantId = 'r2'`.
- **User Hand-Traced Prediction**:
  - Returned Value: Error `'INVALID_REFERENCE'` ('Menu item does not belong to restaurant').
  - Side Effects: NONE.
  - Execution Result: *[Pending execution]*
  - Discrepancy / Correction: *[Pending verification]*
