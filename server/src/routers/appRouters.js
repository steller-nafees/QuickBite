const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const authController = require("../controllers/authController");
const pool = require("../config/db");
const { generatePrefixedId } = require("../utils/idGenerator");

const router = express.Router();
const uploadsRoot = path.join(__dirname, "../../uploads/foods");
let ensureFoodImageColumnPromise = null;

function mapRole(role) {
  return String(role || "").toLowerCase();
}

function normalizeOrderStatus(status) {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "ready" || normalized === "delivered") return "completed";
  if (["pending", "preparing", "completed"].includes(normalized)) return normalized;
  return "pending";
}

function buildAbsoluteUrl(req, relativePath) {
  if (!relativePath) return "";
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  if (!req) return relativePath;
  return `${req.protocol}://${req.get("host")}${relativePath}`;
}

function resolveFoodImage(req, imagePath, fallbackUrl) {
  return imagePath ? buildAbsoluteUrl(req, imagePath) : fallbackUrl;
}

async function ensureFoodImageColumn() {
  if (!ensureFoodImageColumnPromise) {
    ensureFoodImageColumnPromise = (async () => {
      const [columns] = await pool.query("SHOW COLUMNS FROM food LIKE 'image_url'");
      if (!columns.length) {
        await pool.query("ALTER TABLE food ADD COLUMN image_url VARCHAR(1024) NULL AFTER description");
      }
    })().catch((error) => {
      ensureFoodImageColumnPromise = null;
      throw error;
    });
  }

  return ensureFoodImageColumnPromise;
}

async function saveFoodImageFromDataUrl(foodId, imageDataUrl) {
  const raw = String(imageDataUrl || "").trim();
  if (!raw) return "";

  const match = raw.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i);
  if (!match) {
    throw new Error("Invalid food image format");
  }

  const mimeType = match[1].toLowerCase();
  const base64Payload = match[2];
  const extensionMap = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  const extension = extensionMap[mimeType];
  if (!extension) {
    throw new Error("Unsupported food image type");
  }

  const buffer = Buffer.from(base64Payload, "base64");
  if (!buffer.length) {
    throw new Error("Food image is empty");
  }

  await fs.mkdir(uploadsRoot, { recursive: true });
  const fileName = `${String(foodId).replace(/[^\w-]/g, "_")}-${Date.now()}${extension}`;
  await fs.writeFile(path.join(uploadsRoot, fileName), buffer);
  return `/uploads/foods/${fileName}`;
}

function formatUserRow(row) {
  return {
    id: row.user_id,
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone || "",
    role: mapRole(row.role),
  };
}

function normalizePickupTime(value) {
  if (!value) {
    return null;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  function pad(input) {
    return String(input).padStart(2, "0");
  }

  function toSqlDateTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return null;
    }
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(raw)) {
    return raw.length === 16 ? `${raw}:00` : raw;
  }

  if (/^\d{2}:\d{2}$/.test(raw)) {
    const [hours, minutes] = raw.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    if (date.getTime() <= Date.now()) {
      date.setDate(date.getDate() + 1);
    }
    return toSqlDateTime(date);
  }

  if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(raw)) {
    const [time, meridiemRaw] = raw.split(/\s+/);
    let [hours, minutes] = time.split(":").map(Number);
    const meridiem = String(meridiemRaw || "").toUpperCase();

    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    if (date.getTime() <= Date.now()) {
      date.setDate(date.getDate() + 1);
    }
    return toSqlDateTime(date);
  }

  const parsed = new Date(raw);
  return toSqlDateTime(parsed);
}

function normalizePaymentDetails(method, accountInput) {
  const normalizedMethod = String(method || "").toLowerCase();
  const rawAccount = String(accountInput || "").trim();

  if (normalizedMethod === "bkash" || normalizedMethod === "nagad") {
    const digits = rawAccount.replace(/\D/g, "");
    if (digits.length < 11) {
      throw new Error("A valid mobile banking number is required");
    }
    return {
      method: normalizedMethod === "bkash" ? "Bkash" : "Nagad",
      accountReference: digits,
    };
  }

  if (normalizedMethod === "card") {
    const digits = rawAccount.replace(/\D/g, "");
    if (digits.length < 16) {
      throw new Error("A valid card number is required");
    }
    return {
      method: "Card",
      accountReference: `**** **** **** ${digits.slice(-4)}`,
    };
  }

  throw new Error("A valid payment method is required");
}

function toVendor(row, foods, ordersByVendor) {
  const vendorFoods = foods.filter((food) => food.vendor_id === row.user_id);
  const vendorOrders = ordersByVendor.get(row.user_id) || [];
  const totalOrders = vendorOrders.length;
  const avgPrice =
    vendorFoods.length > 0
      ? vendorFoods.reduce((sum, food) => sum + Number(food.price || 0), 0) / vendorFoods.length
      : 0;

  return {
    id: row.user_id,
    user_id: row.user_id,
    name: row.full_name,
    cuisine: avgPrice >= 400 ? "Chef Specials" : "Campus Favorites",
    rating: 4.7,
    totalOrders,
    eta: "10 min pickup",
    badge: totalOrders > 0 ? "Popular now" : "Now open",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=900&h=700&fit=crop",
    location: "NSU Main Canteen",
    phone: row.phone || "",
    email: row.email,
  };
}

function toFood(row, req) {
  const foodId = String(row.food_id || "");

  return {
    id: row.food_id,
    food_id: row.food_id,
    name: row.item_name,
    item_name: row.item_name,
    vendor: row.vendor_name,
    vendor_id: row.vendor_id,
    price: Number(row.price || 0),
    rating: 4.8,
    badge: foodId.startsWith("QBF-") ? foodId.replace("QBF-", "") : "Food #" + foodId,
    description: row.description || "Freshly prepared for campus pickup.",
    image: resolveFoodImage(
      req,
      row.image_url || "",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&h=700&fit=crop"
    ),
    is_available: Boolean(row.is_available),
  };
}

async function getCatalogData(req) {
  await ensureFoodImageColumn();
  const [vendorRows] = await pool.query(
    "SELECT user_id, full_name, email, phone, role FROM user WHERE LOWER(role) = 'vendor' ORDER BY full_name ASC"
  );
  const [foodRows] = await pool.query(
    `SELECT f.food_id, f.item_name, f.description, f.image_url, f.price, f.is_available,
            f.managed_by AS vendor_id, u.full_name AS vendor_name
     FROM food f
     JOIN user u ON u.user_id = f.managed_by
     ORDER BY f.created_at DESC`
  );
  const [orderRows] = await pool.query(
    "SELECT order_id, vendor_id FROM `order` ORDER BY created_at DESC"
  );

  const foods = foodRows.map((row) => toFood(row, req));
  const ordersByVendor = new Map();
  orderRows.forEach((row) => {
    const list = ordersByVendor.get(row.vendor_id) || [];
    list.push(row);
    ordersByVendor.set(row.vendor_id, list);
  });

  const vendors = vendorRows.map((row) => toVendor(row, foods, ordersByVendor));
  return { vendors, foods };
}

async function getOrdersForCustomer(customerId) {
  const [orderRows] = await pool.query(
    `SELECT o.order_id, o.customer_id, o.vendor_id, o.total_amount, o.status,
            o.created_at, o.pickup_time, u.full_name AS vendor_name,
            ot.token_date, ot.token_seq
     FROM \`order\` o
     JOIN user u ON u.user_id = o.vendor_id
     LEFT JOIN order_token ot ON ot.order_id = o.order_id
     WHERE o.customer_id = ?
     ORDER BY o.created_at DESC`,
    [customerId]
  );

  if (!orderRows.length) {
    return [];
  }

  const orderIds = orderRows.map((row) => row.order_id);
  const [itemRows] = await pool.query(
    `SELECT order_id, order_item_id, food_id, item_name, quantity, unit_price, total_price
     FROM order_item
     WHERE order_id IN (?)`,
    [orderIds]
  );
  const [paymentRows] = await pool.query(
    `SELECT order_id, payment_id, method, account_reference, status, amount, paid_at
     FROM payment
     WHERE order_id IN (?)`,
    [orderIds]
  );

  const itemsByOrder = new Map();
  itemRows.forEach((row) => {
    const list = itemsByOrder.get(row.order_id) || [];
    list.push({
      order_item_id: row.order_item_id,
      food_id: row.food_id,
      item_name: row.item_name,
      quantity: Number(row.quantity || 0),
      unit_price: Number(row.unit_price || 0),
      total_price: Number(row.total_price || 0),
    });
    itemsByOrder.set(row.order_id, list);
  });

  const paymentByOrder = new Map();
  paymentRows.forEach((row) => {
    paymentByOrder.set(row.order_id, {
      payment_id: row.payment_id,
      method: row.method,
      account_reference: row.account_reference || null,
      status: row.status,
      amount: Number(row.amount || 0),
      paid_at: row.paid_at,
    });
  });

  return orderRows.map((row) => ({
    order_id: row.order_id,
    customer_id: row.customer_id,
    vendor_id: row.vendor_id,
    vendor_name: row.vendor_name,
    token: row.token_seq ? `QB-${Number(row.token_seq)}` : null,
    total_amount: Number(row.total_amount || 0),
    status: normalizeOrderStatus(row.status),
    created_at: row.created_at,
    pickup_time: row.pickup_time,
    items: itemsByOrder.get(row.order_id) || [],
    payment: paymentByOrder.get(row.order_id) || null,
  }));
}

async function getDashboardDataForVendor(vendorId, req) {
  await ensureFoodImageColumn();
  const [vendorRows] = await pool.query(
    "SELECT user_id, full_name, email, phone, role FROM user WHERE user_id = ? AND LOWER(role) = 'vendor'",
    [vendorId]
  );
  const [foodRows] = await pool.query(
    `SELECT food_id, item_name, description, image_url, price, is_available, managed_by
     FROM food
     WHERE managed_by = ?
     ORDER BY created_at DESC`,
    [vendorId]
  );
  const [orderRows] = await pool.query(
    `SELECT o.order_id, o.customer_id, o.vendor_id, o.total_amount, o.status,
            o.created_at, o.pickup_time, c.full_name AS customer_name, v.full_name AS vendor_name
     FROM \`order\` o
     JOIN user c ON c.user_id = o.customer_id
     JOIN user v ON v.user_id = o.vendor_id
     WHERE o.vendor_id = ?
     ORDER BY o.created_at DESC`,
    [vendorId]
  );

  const orderIds = orderRows.map((row) => row.order_id);
  let itemRows = [];
  let paymentRows = [];
  if (orderIds.length) {
    [itemRows] = await pool.query(
      `SELECT order_id, order_item_id, food_id, item_name, quantity, unit_price, total_price
       FROM order_item
       WHERE order_id IN (?)`,
      [orderIds]
    );
    [paymentRows] = await pool.query(
      `SELECT payment_id, order_id, method, account_reference, status, amount, paid_at
       FROM payment
       WHERE order_id IN (?)`,
      [orderIds]
    );
  }

  const itemsByOrder = new Map();
  itemRows.forEach((row) => {
    const list = itemsByOrder.get(row.order_id) || [];
    list.push({
      order_item_id: row.order_item_id,
      food_id: row.food_id,
      item_name: row.item_name,
      quantity: Number(row.quantity || 0),
      unit_price: Number(row.unit_price || 0),
      total_price: Number(row.total_price || 0),
    });
    itemsByOrder.set(row.order_id, list);
  });

  const payments = paymentRows.map((row) => ({
    payment_id: row.payment_id,
    order_id: row.order_id,
    method: row.method,
    account_reference: row.account_reference || null,
    status: row.status,
    amount: Number(row.amount || 0),
    paid_at: row.paid_at,
  }));

  const paymentByOrder = new Map();
  payments.forEach((payment) => paymentByOrder.set(payment.order_id, payment));

  return {
    users: vendorRows.map((row) => ({
      user_id: row.user_id,
      name: row.full_name,
      email: row.email,
      phone: row.phone || "",
      role: mapRole(row.role),
    })),
    foods: foodRows.map((row) => ({
      food_id: row.food_id,
      vendor_id: row.managed_by,
      name: row.item_name,
      category: "Menu",
      price: Number(row.price || 0),
      is_available: Boolean(row.is_available),
      description: row.description || "",
      image: resolveFoodImage(req, row.image_url || "", ""),
    })),
    orders: orderRows.map((row) => ({
      order_id: row.order_id,
      customer_id: row.customer_id,
      vendor_id: row.vendor_id,
      customer_name: row.customer_name,
      vendor_name: row.vendor_name,
      total_amount: Number(row.total_amount || 0),
      status: normalizeOrderStatus(row.status),
      created_at: row.created_at,
      pickup_time: row.pickup_time,
      items: itemsByOrder.get(row.order_id) || [],
      payment: paymentByOrder.get(row.order_id) || null,
    })),
    payments,
  };
}

router.get("/catalog", async (req, res) => {
  try {
    const data = await getCatalogData(req);
    res.json({ ok: true, ...data });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load catalog" });
  }
});

router.get("/vendors/:id", async (req, res) => {
  try {
    const { vendors, foods } = await getCatalogData(req);
    const vendor = vendors.find((entry) => String(entry.id) === String(req.params.id));

    if (!vendor) {
      return res.status(404).json({ ok: false, message: "Vendor not found" });
    }

    const vendorFoods = foods.filter((food) => String(food.vendor_id) === String(vendor.id));
    res.json({ ok: true, vendor, foods: vendorFoods });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load vendor" });
  }
});

router.use(authController.protect);

router.get("/me/orders", async (req, res) => {
  try {
    const orders = await getOrdersForCustomer(req.user.user_id);
    const currentOrders = orders.filter((order) => ["pending", "preparing"].includes(order.status));
    const pastOrders = orders.filter((order) => order.status === "completed");
    res.json({ ok: true, currentOrders, pastOrders });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load orders" });
  }
});

// Heartbeat API - Check order status (customers only)
router.get("/orders/heartbeat/:id", async (req, res) => {
  try {
    const role = mapRole(req.user.role);
    if (role !== "customer") {
      return res.status(403).json({
        ok: false,
        status: "fail",
        message: "Only customers can access this endpoint",
      });
    }

    const orderId = String(req.params.id || "").trim();
    if (!orderId) {
      return res.status(400).json({
        ok: false,
        status: "fail",
        message: "Invalid order ID provided",
      });
    }

    const [orderRows] = await pool.query(
      `SELECT 
        o.order_id,
        o.customer_id,
        o.vendor_id,
        u.full_name AS vendor_name,
        o.total_amount,
        o.status,
        o.created_at,
        o.pickup_time,
        o.updated_at,
        ot.token_date,
        ot.token_seq
       FROM \`order\` o
       JOIN user u ON u.user_id = o.vendor_id
       LEFT JOIN order_token ot ON ot.order_id = o.order_id
       WHERE o.order_id = ? AND o.customer_id = ?
       LIMIT 1`,
      [orderId, req.user.user_id]
    );

    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({
        ok: false,
        status: "fail",
        message: "Order not found",
      });
    }

    const [itemRows] = await pool.query(
      `SELECT order_item_id, food_id, item_name, quantity, unit_price, total_price
       FROM order_item
       WHERE order_id = ?`,
      [orderId]
    );

    const items = (itemRows || []).map((row) => ({
      order_item_id: row.order_item_id,
      food_id: row.food_id,
      item_name: row.item_name,
      quantity: Number(row.quantity || 0),
      unit_price: Number(row.unit_price || 0),
      total_price: Number(row.total_price || 0),
    }));

    res.status(200).json({
      ok: true,
      status: "success",
      data: {
        order_id: order.order_id,
        token: order.token_seq ? `QB-${Number(order.token_seq)}` : null,
        status: normalizeOrderStatus(order.status),
        vendor_name: order.vendor_name,
        total_amount: Number(order.total_amount || 0),
        created_at: order.created_at,
        updated_at: order.updated_at,
        pickup_time: order.pickup_time,
        items,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: "fail",
      message: error.message || "Failed to fetch order status",
    });
  }
});

router.patch("/me/profile", async (req, res) => {
  try {
    const fullName = String(req.body?.fullName || "").trim();
    const phone = String(req.body?.phone || "").trim();
    if (!fullName) {
      return res.status(400).json({ ok: false, message: "Full name is required" });
    }

    await pool.query(
      "UPDATE user SET full_name = ?, phone = ? WHERE user_id = ?",
      [fullName, phone || null, req.user.user_id]
    );

    const [rows] = await pool.query("SELECT * FROM user WHERE user_id = ?", [req.user.user_id]);
    res.json({ ok: true, user: formatUserRow(rows[0]) });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to update profile" });
  }
});

router.delete("/me/profile", async (req, res) => {
  try {
    await pool.query("DELETE FROM user WHERE user_id = ?", [req.user.user_id]);
    res.json({ ok: true, message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to delete account" });
  }
});

router.patch("/me/password", async (req, res) => {
  req.body.passwordCurrent = req.body.currentPassword;
  req.body.password = req.body.newPassword;
  req.body.passwordConfirm = req.body.confirmPassword;
  return require("../controllers/authController").updatePassword(req, res);
});

router.post("/orders", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userRole = mapRole(req.user.role);
    if (userRole !== "customer") {
      return res.status(403).json({ ok: false, message: "Only customers can place orders" });
    }

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) {
      return res.status(400).json({ ok: false, message: "Cart is empty" });
    }

    const pickupTime = normalizePickupTime(req.body?.pickup_time);
    if (!pickupTime) {
      return res.status(400).json({ ok: false, message: "Pickup time is required" });
    }

    const paymentDetails = normalizePaymentDetails(req.body?.payment_method, req.body?.payment_account);

    const foodIds = items.map((item) => item.food_id);
    const [foodRows] = await connection.query(
      `SELECT f.food_id, f.item_name, f.price, f.is_available, f.managed_by, u.full_name AS vendor_name
       FROM food f
       JOIN user u ON u.user_id = f.managed_by
       WHERE f.food_id IN (?)`,
      [foodIds]
    );

    const foodMap = new Map(foodRows.map((row) => [row.food_id, row]));
    let vendorId = null;
    let totalAmount = 0;
    const normalizedItems = [];

    for (const item of items) {
      const food = foodMap.get(item.food_id);
      if (!food) {
        throw new Error("One or more cart items no longer exist");
      }
      if (!food.is_available) {
        throw new Error(food.item_name + " is not available right now");
      }

      const qty = Number(item.quantity || 0);
      if (!qty || qty < 1) {
        throw new Error("Invalid item quantity");
      }

      if (!vendorId) {
        vendorId = food.managed_by;
      } else if (vendorId !== food.managed_by) {
        throw new Error("All cart items must be from the same vendor");
      }

      const unitPrice = Number(food.price || 0);
      const totalPrice = unitPrice * qty;
      totalAmount += totalPrice;
      normalizedItems.push({
        food_id: food.food_id,
        item_name: food.item_name,
        quantity: qty,
        unit_price: unitPrice,
        total_price: totalPrice,
      });
    }

    await connection.beginTransaction();
    const orderId = await generatePrefixedId(connection, "order", "order_id", "QB");
    await connection.query(
      "INSERT INTO `order` (order_id, customer_id, vendor_id, total_amount, pickup_time) VALUES (?, ?, ?, ?, ?)",
      [orderId, req.user.user_id, vendorId, totalAmount, pickupTime]
    );
    const [orderRows] = await connection.query(
      "SELECT order_id, created_at, pickup_time, status FROM `order` WHERE order_id = ? LIMIT 1",
      [orderId]
    );
    const createdOrder = orderRows[0];

    // Ensure token tables exist (safe if already created).
    await connection.query(
      `CREATE TABLE IF NOT EXISTS daily_order_token_counter (
        token_date DATE PRIMARY KEY,
        last_seq INT NOT NULL
      )`
    );
    await connection.query(
      `CREATE TABLE IF NOT EXISTS order_token (
        order_id VARCHAR(64) PRIMARY KEY,
        token_date DATE NOT NULL,
        token_seq INT NOT NULL,
        UNIQUE KEY uniq_token_per_day (token_date, token_seq)
      )`
    );

    // Daily token: QB-1, QB-2... resets each day.
    const [tokenCounterResult] = await connection.query(
      `INSERT INTO daily_order_token_counter (token_date, last_seq)
       VALUES (CURDATE(), 1)
       ON DUPLICATE KEY UPDATE last_seq = LAST_INSERT_ID(last_seq + 1)`,
    );
    const tokenSeq = Number(tokenCounterResult.insertId || 1);
    const tokenCode = `QB-${tokenSeq}`;
    await connection.query(
      "INSERT INTO order_token (order_id, token_date, token_seq) VALUES (?, CURDATE(), ?)",
      [createdOrder.order_id, tokenSeq]
    );

    for (const item of normalizedItems) {
      const orderItemId = await generatePrefixedId(connection, "order_item", "order_item_id", "QBI");
      await connection.query(
        `INSERT INTO order_item (order_item_id, order_id, food_id, item_name, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderItemId, createdOrder.order_id, item.food_id, item.item_name, item.quantity, item.unit_price, item.total_price]
      );
    }

    const paymentId = await generatePrefixedId(connection, "payment", "payment_id", "QBP");
    await connection.query(
      "INSERT INTO payment (payment_id, order_id, method, account_reference, status, amount, paid_at) VALUES (?, ?, ?, ?, 'completed', ?, NOW())",
      [
        paymentId,
        createdOrder.order_id,
        paymentDetails.method,
        paymentDetails.accountReference,
        totalAmount,
      ]
    );

    await connection.commit();

    const [vendorRows] = await pool.query("SELECT full_name FROM user WHERE user_id = ?", [vendorId]);
    const [paymentRows] = await pool.query("SELECT * FROM payment WHERE order_id = ?", [createdOrder.order_id]);

    res.status(201).json({
      ok: true,
      order: {
        order_id: createdOrder.order_id,
        token: tokenCode,
        customer_id: req.user.user_id,
        vendor_id: vendorId,
        vendor_name: vendorRows[0]?.full_name || "",
        total_amount: totalAmount,
        status: createdOrder.status,
        created_at: createdOrder.created_at,
        pickup_time: createdOrder.pickup_time,
        items: normalizedItems,
        payment: paymentRows[0]
          ? {
              payment_id: paymentRows[0].payment_id,
              method: paymentRows[0].method,
              account_reference: paymentRows[0].account_reference || null,
              status: paymentRows[0].status,
              amount: Number(paymentRows[0].amount || 0),
              paid_at: paymentRows[0].paid_at,
              transaction_id: paymentRows[0].payment_id,
            }
          : null,
      },
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      // ignore
    }
    res.status(400).json({ ok: false, message: error.message || "Failed to place order" });
  } finally {
    connection.release();
  }
});

router.get("/admin/dashboard", async (req, res) => {
  try {
    const role = mapRole(req.user.role);
    if (role !== "vendor" && role !== "admin") {
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    const vendorId = role === "vendor" ? req.user.user_id : String(req.query.vendorId || req.user.user_id);
    const data = await getDashboardDataForVendor(vendorId, req);
    res.json({ ok: true, ...data });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || "Failed to load dashboard" });
  }
});

router.post("/admin/foods", async (req, res) => {
  try {
    await ensureFoodImageColumn();
    const role = mapRole(req.user.role);
    if (role !== "vendor" && role !== "admin") {
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    const vendorId = role === "vendor" ? req.user.user_id : String(req.body?.vendor_id || "");
    const itemName = String(req.body?.name || req.body?.item_name || "").trim();
    const description = String(req.body?.description || "").trim();
    const imageData = String(req.body?.image_data || "").trim();
    const price = Number(req.body?.price || 0);
    const isAvailable = req.body?.is_available !== false;

    if (!vendorId || !itemName || !(price >= 0)) {
      return res.status(400).json({ ok: false, message: "Missing required food fields" });
    }

    const foodId = await generatePrefixedId(pool, "food", "food_id", "QBF");
    const storedImagePath = imageData ? await saveFoodImageFromDataUrl(foodId, imageData) : null;
    await pool.query(
      "INSERT INTO food (food_id, item_name, description, image_url, price, is_available, managed_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        foodId,
        itemName,
        description || null,
        storedImagePath,
        price,
        isAvailable ? 1 : 0,
        vendorId,
      ]
    );
    const [rows] = await pool.query(
      `SELECT food_id, item_name, description, image_url, price, is_available, managed_by
       FROM food WHERE food_id = ? LIMIT 1`,
      [foodId]
    );
    const food = rows[0];
    res.status(201).json({
      ok: true,
      food: {
        food_id: food.food_id,
        vendor_id: food.managed_by,
        name: food.item_name,
        category: "Menu",
        price: Number(food.price || 0),
        is_available: Boolean(food.is_available),
        description: food.description || "",
        image: resolveFoodImage(req, food.image_url || "", ""),
      },
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Failed to create food" });
  }
});

router.patch("/admin/foods/:id", async (req, res) => {
  try {
    await ensureFoodImageColumn();
    const role = mapRole(req.user.role);
    const [rows] = await pool.query("SELECT managed_by, image_url FROM food WHERE food_id = ?", [req.params.id]);
    const food = rows[0];
    if (!food) {
      return res.status(404).json({ ok: false, message: "Food not found" });
    }
    if (role === "vendor" && food.managed_by !== req.user.user_id) {
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    let storedImagePath = food.image_url || null;
    const imageData = String(req.body?.image_data || "").trim();
    if (imageData) {
      storedImagePath = await saveFoodImageFromDataUrl(req.params.id, imageData);
    }

    await pool.query(
      `UPDATE food
       SET item_name = ?, description = ?, image_url = ?, price = ?, is_available = ?
       WHERE food_id = ?`,
      [
        String(req.body?.name || req.body?.item_name || "").trim(),
        String(req.body?.description || "").trim() || null,
        storedImagePath,
        Number(req.body?.price || 0),
        req.body?.is_available !== false ? 1 : 0,
        req.params.id,
      ]
    );

    const [updatedRows] = await pool.query(
      `SELECT food_id, item_name, description, image_url, price, is_available, managed_by
       FROM food WHERE food_id = ? LIMIT 1`,
      [req.params.id]
    );
    const updatedFood = updatedRows[0];

    res.json({
      ok: true,
      food: {
        food_id: updatedFood.food_id,
        vendor_id: updatedFood.managed_by,
        name: updatedFood.item_name,
        category: "Menu",
        price: Number(updatedFood.price || 0),
        is_available: Boolean(updatedFood.is_available),
        description: updatedFood.description || "",
        image: resolveFoodImage(req, updatedFood.image_url || "", ""),
      },
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Failed to update food" });
  }
});

router.delete("/admin/foods/:id", async (req, res) => {
  try {
    const role = mapRole(req.user.role);
    const [rows] = await pool.query("SELECT managed_by FROM food WHERE food_id = ?", [req.params.id]);
    const food = rows[0];
    if (!food) {
      return res.status(404).json({ ok: false, message: "Food not found" });
    }
    if (role === "vendor" && food.managed_by !== req.user.user_id) {
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    await pool.query("DELETE FROM food WHERE food_id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Failed to delete food" });
  }
});

router.patch("/admin/orders/:id/status", async (req, res) => {
  try {
    const role = mapRole(req.user.role);
    const status = normalizeOrderStatus(req.body?.status);
    const valid = ["pending", "preparing", "completed"];
    if (!valid.includes(status)) {
      return res.status(400).json({ ok: false, message: "Invalid status" });
    }

    const [rows] = await pool.query("SELECT vendor_id FROM `order` WHERE order_id = ?", [req.params.id]);
    const order = rows[0];
    if (!order) {
      return res.status(404).json({ ok: false, message: "Order not found" });
    }
    if (role === "vendor" && order.vendor_id !== req.user.user_id) {
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    await pool.query("UPDATE `order` SET status = ? WHERE order_id = ?", [status, req.params.id]);
    if (status === "completed") {
      await pool.query(
        "UPDATE payment SET status = 'completed', paid_at = COALESCE(paid_at, NOW()) WHERE order_id = ?",
        [req.params.id]
      );
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || "Failed to update order status" });
  }
});

module.exports = router;
