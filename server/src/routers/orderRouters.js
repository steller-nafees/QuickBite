const express = require("express");
const orderController = require("../controllers/orderController");
const authController = require("../controllers/authController");

const orderRouters = express.Router();

// Protect all routes - only authenticated users can access order routes
orderRouters.use(authController.protect);

// Get my orders (students - view their own orders)
orderRouters.get("/my-orders", orderController.getMyOrders);

// Get vendor orders (vendors - view orders for their foods)
orderRouters.get("/vendor-orders", orderController.getVendorOrders);

// Heartbeat API - Check order status (customers only)
orderRouters.get("/heartbeat/:id", orderController.getOrderHeartbeat);

// Create order (students only)
orderRouters.post("/", orderController.createOrder);

// Get specific order (customer or vendor of that order)
orderRouters.get("/:id", orderController.getOrderById);

// Update order status (vendors only)
orderRouters.patch("/:id/status", orderController.updateOrderStatus);

// Cancel order (students only)
orderRouters.delete("/:id", orderController.cancelOrder);

module.exports = orderRouters;
