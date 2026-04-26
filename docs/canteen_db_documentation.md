# Canteen Ordering System Database Documentation

## 1. Entities and Attributes

### 1.1 USER
Represents the users of the system, including both customers and vendors.

| Attribute   | Type / Details             | Description                        |
| ----------- | -------------------------- | ---------------------------------- |
| user_id    | PK, INT                    | Unique identifier for the user     |
| full_name  | VARCHAR                    | Full name of the user              |
| email       | VARCHAR                    | Email for login and communication  |
| password    | VARCHAR                    | Hashed password for authentication |
| phone       | VARCHAR                    | Contact phone number               |
| role        | ENUM('customer', 'vendor') | Role of the user                   |
| created_at | TIMESTAMP                  | Account creation timestamp         |

### 1.2 FOOD
Represents food items available for ordering.

| Attribute     | Type / Details              | Description                               |
| ------------- | --------------------------- | ----------------------------------------- |
| food_id      | PK, INT                     | Unique identifier for each food item      |
| item_name    | VARCHAR                     | Name of the food item                     |
| description   | TEXT                        | Description of the food                   |
| price         | DECIMAL                     | Price per unit                            |
| is_available | BOOLEAN                     | Availability status                       |
| managed_by   | FK → USER.user_id (vendor)  | Vendor who manages this food item         |
| created_at   | TIMESTAMP                   | Timestamp when food item was added        |
| updated_at   | TIMESTAMP                   | Timestamp when food item was last updated |

### 1.3 ORDER
Represents a customer order, can contain multiple food items.

| Attribute     | Type / Details                                                  | Description                        |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| order_id     | PK, INT                                                         | Unique identifier for the order    |
| customer_id  | FK → USER.user_id (customer)                                   | Customer who placed the order      |
| vendor_id    | FK → USER.user_id (vendor)                                     | Vendor fulfilling the order        |
| total_amount | DECIMAL                                                         | Total price for the order          |
| status       | ENUM('pending', 'preparing', 'ready', 'completed', 'delivered')| Current status of the order        |
| created_at   | TIMESTAMP                                                       | Timestamp when order was placed    |
| pickup_time  | TIMESTAMP                                                       | User-defined preferred pickup time |

### 1.4 ORDER_ITEM
Bridge table connecting orders to food items (resolves the many-to-many relationship).

| Attribute       | Type / Details       | Description                           |
| --------------- | -------------------- | ------------------------------------- |
| order_item_id | PK, INT              | Unique identifier for each order item |
| order_id      | FK → ORDER.order_id  | The order this item belongs to        |
| food_id       | FK → FOOD.food_id    | The food item being ordered           |
| item_name     | VARCHAR              | Redundant copy for display purposes   |
| quantity      | INT                  | Number of units ordered               |
| unit_price    | DECIMAL              | Price per unit at the time of order   |
| total_price   | DECIMAL              | quantity × unit_price                  |

### 1.5 PAYMENT
Represents payment information for an order.

| Attribute   | Type / Details                         | Description                          |
| ----------- | -------------------------------------- | ------------------------------------ |
| payment_id | PK, INT                                | Unique identifier for payment        |
| order_id   | FK → ORDER.order_id                   | Order being paid                     |
| method      | ENUM('Bkash', 'Nagad', 'Card')        | Payment method used in the UI        |
| account_reference | VARCHAR / NULLABLE              | Wallet phone number or masked card number |
| status      | ENUM('pending', 'completed', 'failed')| Payment status                       |
| amount      | DECIMAL                               | Payment amount                       |
| paid_at     | TIMESTAMP                             | Timestamp when payment was completed |

`account_reference` rules:
- `Bkash` / `Nagad`: store full phone number
- `Card`: store masked card number only, for example `**** **** **** 3456`

## 2. Relational Table – Entity Relationships

| Entity 1        | Relationship Name          | Entity 2    | Cardinality / Notes                            |
| --------------- | -------------------------- | ----------- | ---------------------------------------------- |
| USER (customer) | places                     | ORDER       | 1:N – One customer can place many orders      |
| USER (vendor)   | receives / manages_orders  | ORDER       | 1:N – One vendor can manage many orders       |
| ORDER           | contains                   | ORDER_ITEM  | 1:N – Each order can have multiple order items |
| FOOD            | part_of                    | ORDER_ITEM  | 1:N – Each food can appear in multiple order items |
| USER (vendor)   | manages                    | FOOD        | 1:N – Each vendor manages multiple foods      |
| ORDER           | paid_by                    | PAYMENT     | 1:1 – Each order has one payment record       |

## 3. Design Notes

1. `ORDER_ITEM` acts as a bridge table to implement the many-to-many relationship between `ORDER` and `FOOD`.
2. The relationships `ORDER contains ORDER_ITEM` and `FOOD part_of ORDER_ITEM` together represent this many-to-many link: one order can include multiple food items, and one food item can appear in multiple orders.
3. `item_name` in `ORDER_ITEM` stores a copy of the food name to simplify display of order summaries.
4. Pickup times are user-defined; no fixed slot table is needed.
5. Payment is one-to-one per order.
6. Vendors manage their own `FOOD` items.
7. `ORDER.status` tracks the order lifecycle from pending to delivered.
