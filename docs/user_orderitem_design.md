### Final Design for Food Ordering System (USER & ORDER\_ITEM)

---

## Entities and Attributes

### USER

- user\_id [PK]
- full\_name
- email
- password
- phone
- role (ENUM: 'customer', 'vendor')
- created\_at

### ORDER\_ITEM

- order\_item\_id [PK]
- customer\_id [FK → USER.user\_id]
- vendor\_id [FK → USER.user\_id]
- item\_name
- quantity
- unit\_price
- total\_price
- status (ENUM: 'pending', 'preparing', 'delivered')
- created\_at

---

## Example SQL Query to Fetch Order Items with Customer and Vendor Names

```sql
SELECT
    oi.order_item_id,
    c.full_name AS customer_name,
    v.full_name AS vendor_name,
    oi.item_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    oi.status,
    oi.created_at
FROM ORDER_ITEM oi
JOIN USER c ON oi.customer_id = c.user_id AND c.role = 'customer'
JOIN USER v ON oi.vendor_id = v.user_id AND v.role = 'vendor';
```

