const orderService = require("../services/orderService");

// Get customer's orders (customers only)
exports.getMyOrders = async (req, res) => {
  try {
    // Only customers can view their orders
    if (req.user.role !== "Customer") {
      return res.status(403).json({
        status: "fail",
        message: "Only customers can view orders",
      });
    }

    const orders = await orderService.getCustomerOrders(req.user.id);

    res.status(200).json({
      status: "success",
      results: orders.length,
      message: orders.length === 0 ? "No orders found" : "Orders retrieved successfully",
      data: { orders },
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch orders",
    });
  }
};

// Get vendor's orders (vendors only)
exports.getVendorOrders = async (req, res) => {
  try {
    // Only vendors can view orders for their foods
    if (req.user.role !== "Vendor") {
      return res.status(403).json({
        status: "fail",
        message: "Only vendors can view vendor orders",
      });
    }

    const orders = await orderService.getVendorOrders(req.user.id);

    res.status(200).json({
      status: "success",
      results: orders.length,
      message: orders.length === 0 ? "No orders found" : "Orders retrieved successfully",
      data: { orders },
    });
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch orders",
    });
  }
};

// Get order by ID (customer or vendor of that order)
exports.getOrderById = async (req, res) => {
  try {
    if (!req.params.id || typeof req.params.id !== 'string') {
      return res.status(400).json({
        status: "fail",
        message: "Invalid order ID provided",
      });
    }

    const order = await orderService.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
      });
    }

    // Verify user has access to this order
    if (
      req.user.id !== order.customer_id &&
      req.user.id !== order.vendor_id
    ) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have access to this order",
      });
    }

    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch order",
    });
  }
};

// Create order (customers only)
exports.createOrder = async (req, res) => {
  try {
    // Only customers can place orders
    if (req.user.role !== "Customer") {
      return res.status(403).json({
        status: "fail",
        message: "Only customers can place orders",
      });
    }

    const { items, pickup_time } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Order must contain at least one item",
      });
    }

    const orderId = await orderService.createOrder(req.user.id, {
      items,
      pickup_time,
    });

    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      data: { orderId },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(400).json({
      status: "fail",
      message: error.message || "Failed to create order",
    });
  }
};

// Update order status (vendors only)
exports.updateOrderStatus = async (req, res) => {
  try {
    // Only vendors can update order status
    if (req.user.role !== "Vendor") {
      return res.status(403).json({
        status: "fail",
        message: "Only vendors can update order status",
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        status: "fail",
        message: "Invalid order ID provided",
      });
    }

    if (!status) {
      return res.status(400).json({
        status: "fail",
        message: "Status is required",
      });
    }

    await orderService.updateOrderStatus(id, req.user.id, status);

    res.status(200).json({
      status: "success",
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    const statusCode = error.message.includes("You can only update orders for your own foods") ? 403 : 400;
    res.status(statusCode).json({
      status: "fail",
      message: error.message || "Failed to update order status",
    });
  }
};

// Cancel order (customers only)
exports.cancelOrder = async (req, res) => {
  try {
    // Only customers can cancel orders
    if (req.user.role !== "Customer") {
      return res.status(403).json({
        status: "fail",
        message: "Only customers can cancel orders",
      });
    }

    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        status: "fail",
        message: "Invalid order ID provided",
      });
    }

    await orderService.cancelOrder(id, req.user.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    const statusCode = error.message.includes("Can only cancel pending orders") ? 400 : 403;
    res.status(statusCode).json({
      status: "fail",
      message: error.message || "Failed to cancel order",
    });
  }
};

// Heartbeat API - Check order status (customers only)
exports.getOrderHeartbeat = async (req, res) => {
  try {
    // Only customers can use heartbeat
    if (req.user.role !== "Customer") {
      return res.status(403).json({
        status: "fail",
        message: "Only customers can access this endpoint",
      });
    }

    const orderId = req.params.id;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({
        status: "fail",
        message: "Invalid order ID provided",
      });
    }

    console.log(`Heartbeat check for order ID: ${orderId} by user ID: ${req.user.id}`);

    const orderStatus = await orderService.getOrderHeartbeat(orderId, req.user.id);

    res.status(200).json({
      status: "success",
      data: orderStatus,
    });
  } catch (error) {
    console.error("Error in heartbeat API:", error);
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("not authorized") ? 403 : 500;
    res.status(statusCode).json({
      status: "fail",
      message: error.message || "Failed to fetch order status",
    });
  }
};
