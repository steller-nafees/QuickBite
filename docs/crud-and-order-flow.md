# QuickBite CRUD and Order Flow Documentation

## 1. Short confirmation

Yes, CRUD operations are implemented in this project.

But they are implemented in two API styles:

1. `api/app`:
This is the newer API used by the current frontend pages.

2. `api/v1/*`:
These are the older modular CRUD routers for `users`, `vendors`, `foods`, and `orders`.

You can see both router groups in [server.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/server.js:47).

```js
app.use("/api/app", appRouters);
app.use("/api/v1/users", userRouters);
app.use("/api/v1/vendors", vendorRouters);
app.use("/api/v1/foods", foodRouters);
app.use("/api/v1/orders", orderRouters);
```

## 2. What CRUD is implemented

### Food CRUD

Food has full CRUD.

- Create:
  [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:776),
  [foodRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/foodRouters.js:14)
- Read:
  [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:425),
  [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:434),
  [foodRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/foodRouters.js:11),
  [foodRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/foodRouters.js:20)
- Update:
  [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:833),
  [foodRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/foodRouters.js:23)
- Delete:
  [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:891),
  [foodRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/foodRouters.js:26)

### User CRUD

User CRUD is also present, but split between authentication routes and profile routes.

- Create:
  signup and create user routes exist in [userRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/userRouters.js:8) and [userRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/userRouters.js:25)
- Read:
  [userRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/userRouters.js:24) and [userRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/userRouters.js:29)
- Update:
  [userRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/userRouters.js:18),
  [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:554),
  [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:583)
- Delete:
  [userRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/userRouters.js:19),
  [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:574)

### Vendor CRUD

Vendor has read, update, and delete routes.

- Read:
  [vendorRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/vendorRouters.js:11),
  [vendorRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/vendorRouters.js:14)
- Update:
  [vendorRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/vendorRouters.js:17)
- Delete:
  [vendorRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/vendorRouters.js:20)

Vendor creation is handled through the general user registration flow when role is `Vendor`.

### Order CRUD

Order CRUD is partially split across two places:

1. The older `api/v1/orders` router has a full order lifecycle:
   create, read, update status, and delete/cancel.

2. The newer `api/app` router is what the current frontend uses:
   create order, read customer orders, read heartbeat status, and update order status.

Older order routes:

- Read my orders:
  [orderRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/orderRouters.js:11)
- Read vendor orders:
  [orderRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/orderRouters.js:14)
- Create:
  [orderRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/orderRouters.js:17)
- Read single order:
  [orderRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/orderRouters.js:20)
- Update status:
  [orderRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/orderRouters.js:23)
- Delete or cancel:
  [orderRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/orderRouters.js:26)

Current app order routes:

- Read customer dashboard orders:
  [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:452)
- Read live status:
  [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:464)
- Create order:
  [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:590)
- Update order status:
  [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:910)

Important note:
The current frontend does not call an order delete API in the main `/api/app` flow. In the customer dashboard, deleting a past order is only a UI change, not a database delete.

## 3. Which CRUD is used by the current frontend

The current frontend helper is [api.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/client/src/js/shared/api.js:53).

It uses these main methods:

```js
getCatalog()
getMyOrders()
updateProfile()
deleteProfile()
updatePassword()
placeOrder()
getAdminDashboard()
createFood()
updateFood()
deleteFood()
updateOrderStatus()
```

That means the current UI is actively using:

- Food read
- Food create
- Food update
- Food delete
- Order create
- Order read
- Order status update
- Profile update
- Profile delete
- Password update

## 4. Simple order flow

This is the real flow of how an order works in QuickBite.

### Step 1: Customer loads the menu

The menu page calls `getCatalog()` to load all vendors and foods.

Code:

- [menu.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/client/src/js/pages/menu.js:28)
- [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:425)

```js
const data = await window.QuickBiteApi.getCatalog();
vendors = data.vendors || [];
menuItems = (data.foods || []).filter(function (item) {
    return item.is_available;
});
```

Meaning:
The customer first sees only available food items from the catalog.

### Step 2: Customer adds food to cart

The cart stores selected items in browser `localStorage`.

Code:

- [cart.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/client/src/js/components/cart.js:33)

```js
cart.push({
    id: item.id,
    name: item.name,
    price: item.price,
    vendor_id: item.vendor_id || null,
    quantity: 1,
});
```

Meaning:
The cart keeps food id, price, vendor id, and quantity before checkout.

### Step 3: Customer chooses pickup time and payment method

In checkout, the customer selects:

- pickup time
- payment method
- payment account number or card number

This is handled inside [cart.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/client/src/js/components/cart.js:582).

### Step 4: Customer places the order

The frontend sends the order to the backend using `placeOrder()`.

Code:

- [cart.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/client/src/js/components/cart.js:623)

```js
const response = await window.QuickBiteApi.placeOrder({
    pickup_time: pickupTime,
    payment_method: checkoutPaymentMethod,
    payment_account: paymentAccount,
    items: cart.map(function (item) {
        return {
            food_id: item.id,
            quantity: item.quantity
        };
    })
});
```

Meaning:
The frontend sends only the important checkout data.

### Step 5: Backend validates the order

The backend route is [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:590).

The backend checks:

- customer role must be valid
- cart must not be empty
- pickup time must be valid
- payment method must be valid
- all food items must exist
- food must be available
- all items must belong to the same vendor

Short snippet:

```js
if (!items.length) {
  return res.status(400).json({ ok: false, message: "Cart is empty" });
}

if (!pickupTime) {
  return res.status(400).json({ ok: false, message: "Pickup time is required" });
}
```

Meaning:
The server does not trust the frontend blindly. It validates everything again.

### Step 6: Backend creates database records

After validation, the backend creates:

1. one row in `order`
2. one row in `order_token`
3. one or more rows in `order_item`
4. one row in `payment`

Short snippet:

```js
await connection.query(
  "INSERT INTO `order` (order_id, customer_id, vendor_id, total_amount, pickup_time) VALUES (?, ?, ?, ?, ?)",
  [orderId, req.user.user_id, vendorId, totalAmount, pickupTime]
);
```

Meaning:
One order is the parent record. The items and payment are child records linked to that order.

### Step 7: Token is generated

QuickBite gives each order a daily token like `QB-1`, `QB-2`, `QB-3`.

Short snippet:

```js
const tokenSeq = Number(tokenCounterResult.insertId || 1);
const tokenCode = `QB-${tokenSeq}`;
```

Meaning:
This token is easier for pickup and queue management than a long database id.

### Step 8: Customer sees the order in dashboard

After placing an order, the customer dashboard loads orders using:

- [customer-dashboard.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/client/src/js/pages/customer-dashboard.js:942)
- [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:452)

The backend returns:

- `currentOrders`
- `pastOrders`

Meaning:
The dashboard separates active orders from finished orders.

### Step 9: Vendor sees the order in admin dashboard

The vendor dashboard loads data from:

- [admin-dashboard.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/client/src/js/pages/admin-dashboard.js:818)
- [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:761)

Meaning:
The vendor can see foods, orders, and payments from one dashboard API.

### Step 10: Vendor updates order status

The vendor can change status from dashboard.

Frontend:
- [admin-dashboard.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/client/src/js/pages/admin-dashboard.js:692)

Backend:
- [appRouters.js](/d:/Education/North%20South%20University/Semesters/Spring_26_6th/CSE311L/QuickBite/server/src/routers/appRouters.js:910)

```js
await window.QuickBiteApi.updateOrderStatus(orderId, { status });
```

Meaning:
The vendor controls the order lifecycle:

- `pending`
- `preparing`
- `ready`
- `completed`
- `delivered`

### Step 11: Payment status is finalized

When status becomes `completed` or `delivered`, the backend also updates payment status.

Short snippet:

```js
if (status === "completed" || status === "delivered") {
  await pool.query(
    "UPDATE payment SET status = 'completed', paid_at = COALESCE(paid_at, NOW()) WHERE order_id = ?",
    [req.params.id]
  );
}
```

Meaning:
Order completion and payment completion stay in sync.

## 5. Database relationship in simple English

The main order-related tables work like this:

- `user`:
  stores customers and vendors
- `food`:
  stores menu items created by vendors
- `order`:
  stores the main order information
- `order_item`:
  stores every food item inside one order
- `payment`:
  stores payment details of the order
- `order_token`:
  stores the daily pickup token

Simple relationship:

`Vendor -> Food -> Order -> Order Item -> Payment`

Also:

`Customer -> Order`

## 6. Small instructor summary

You can explain the project like this:

1. Customers browse food from the menu catalog.
2. They add items to cart and choose pickup time and payment method.
3. The frontend sends the order request to the backend.
4. The backend validates the request and creates records in `order`, `order_item`, `payment`, and `order_token`.
5. The customer sees the order in the dashboard.
6. The vendor sees the same order in the admin dashboard.
7. The vendor updates status from `pending` to `preparing`, `ready`, and finally `completed` or `delivered`.

## 7. Final conclusion

So, yes, you have implemented CRUD operations in this project.

The strongest confirmed CRUD areas are:

- food management
- user/profile management
- vendor profile management
- order lifecycle management

For your current frontend, the most important real working flow is:

`Menu -> Cart -> Checkout -> Order Creation -> Customer Dashboard -> Vendor Dashboard -> Order Status Update`
