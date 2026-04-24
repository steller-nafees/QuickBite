const orderRepo = require("../repositories/orderRepository");
const foodRepo = require("../repositories/foodRepository");

// Get customer's orders
exports.getCustomerOrders = async (customerId) => {
  try {
    if (!customerId || typeof customerId !== 'string') {
      throw new Error("Invalid customer ID");
    }
    return await orderRepo.getCustomerOrders(customerId);
  } catch (error) {
    throw new Error(`Failed to retrieve customer orders: ${error.message}`);
  }
};

// Get vendor's orders
exports.getVendorOrders = async (vendorId) => {
  try {
    if (!vendorId || typeof vendorId !== 'string') {
      throw new Error("Invalid vendor ID");
    }
    return await orderRepo.getVendorOrders(vendorId);
  } catch (error) {
    throw new Error(`Failed to retrieve vendor orders: ${error.message}`);
  }
};

// Get order details
exports.getOrderById = async (orderId) => {
  try {
    if (!orderId || typeof orderId !== 'string') {
      throw new Error("Invalid order ID");
    }
    return await orderRepo.getOrderById(orderId);
  } catch (error) {
    throw new Error(`Failed to retrieve order: ${error.message}`);
  }
};

// Create new order (customers only)
exports.createOrder = async (customerId, orderData) => {
  try {
    if (!customerId || typeof customerId !== 'string') {
      throw new Error("Invalid customer ID");
    }

    const { items, pickup_time } = orderData;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Order must contain at least one item");
    }

    // Validate and get food items
    let vendorId = null;
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.food_id || !item.quantity) {
        throw new Error("Each item must have food_id and quantity");
      }

      if (isNaN(item.quantity) || item.quantity <= 0) {
        throw new Error("Quantity must be a positive number");
      }

      const food = await foodRepo.getFoodById(item.food_id);

      if (!food) {
        throw new Error(`Food item with ID ${item.food_id} not found`);
      }

      if (!food.is_available) {
        throw new Error(`Food item ${food.item_name} is not available`);
      }

      // All items must be from the same vendor
      if (vendorId === null) {
        vendorId = food.managed_by;
      } else if (vendorId !== food.managed_by) {
        throw new Error("All food items must be from the same vendor");
      }

      const itemTotal = food.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        food_id: item.food_id,
        item_name: food.item_name,
        quantity: item.quantity,
        unit_price: food.price,
        total_price: itemTotal,
      });
    }

    // Create order with validated items
    const orderId = await orderRepo.createNewOrder(
      customerId,
      vendorId,
      totalAmount,
      pickup_time || null,
      validatedItems
    );

    return orderId;
  } catch (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }
};

// Update order status (vendors only)
exports.updateOrderStatus = async (orderId, vendorId, newStatus) => {
  try {
    if (!orderId || typeof orderId !== 'string') {
      throw new Error("Invalid order ID");
    }

    if (!vendorId || typeof vendorId !== 'string') {
      throw new Error("Invalid vendor ID");
    }

    const validStatuses = ["pending", "preparing", "ready", "completed", "delivered"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      );
    }

    return await orderRepo.updateOrderStatus(orderId, vendorId, newStatus);
  } catch (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }
};

// Cancel order (customers only)
exports.cancelOrder = async (orderId, customerId) => {
  try {
    if (!orderId || typeof orderId !== 'string') {
      throw new Error("Invalid order ID");
    }

    if (!customerId || typeof customerId !== 'string') {
      throw new Error("Invalid customer ID");
    }

    return await orderRepo.cancelOrder(orderId, customerId);
  } catch (error) {
    throw new Error(`Failed to cancel order: ${error.message}`);
  }
};

// Heartbeat API - Get order status for a specific customer
exports.getOrderHeartbeat = async (orderId, customerId) => {
  try {
    if (!orderId || typeof orderId !== 'string') {
      throw new Error("Invalid order ID");
    }

    if (!customerId || typeof customerId !== 'string') {
      throw new Error("Invalid customer ID");
    }

    const order = await orderRepo.getOrderHeartbeat(orderId, customerId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.customer_id !== customerId) {
      throw new Error("You are not authorized to access this order");
    }

    // Return minimal data for heartbeat check
    return {
      order_id: order.order_id,
      status: order.status,
      vendor_name: order.vendor_name,
      total_amount: order.total_amount,
      created_at: order.created_at,
      updated_at: order.updated_at,
      pickup_time: order.pickup_time,
    };
  } catch (error) {
    throw new Error(`Heartbeat check failed: ${error.message}`);
  }
};
