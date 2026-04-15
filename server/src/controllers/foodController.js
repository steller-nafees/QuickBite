const foodService = require("../services/foodService");

// Get all foods (authenticated users only)
exports.getAllFoods = async (req, res) => {
  try {
    const foods = await foodService.getAllFoods();

    res.status(200).json({
      status: "success",
      results: foods.length,
      message: foods.length === 0 ? "No foods found" : "Foods retrieved successfully",
      data: { foods },
    });
  } catch (error) {
    console.error("Error fetching foods:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch foods",
    });
  }
};

// Get single food by ID (authenticated users only)
exports.getFoodById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid food ID provided",
      });
    }

    const food = await foodService.getFoodById(req.params.id);

    if (!food) {
      return res.status(404).json({
        status: "fail",
        message: "Food not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: { food },
    });
  } catch (error) {
    console.error("Error fetching food:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch food",
    });
  }
};

// Get all foods by vendor (authenticated users only)
exports.getFoodsByVendor = async (req, res) => {
  try {
    if (!req.params.vendorId) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid vendor ID provided",
      });
    }

    const foods = await foodService.getFoodsByVendor(req.params.vendorId);

    res.status(200).json({
      status: "success",
      results: foods.length,
      message: foods.length === 0 ? "No foods found for this vendor" : "Vendor foods retrieved successfully",
      data: { foods },
    });
  } catch (error) {
    console.error("Error fetching vendor foods:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch vendor foods",
    });
  }
};

// Create food (vendors only - user must be authenticated)
exports.createFood = async (req, res) => {
  try {
    const { item_name, description, price, is_available } = req.body;

    if (!item_name || !price) {
      return res.status(400).json({
        status: "fail",
        message: "item_name and price are required",
      });
    }

    const foodData = {
      item_name,
      description: description || null,
      price,
      is_available: is_available !== undefined ? is_available : true,
    };

    const foodId = await foodService.createFood(req.user.id, foodData);

    res.status(201).json({
      status: "success",
      message: "Food item created successfully",
      data: { foodId },
    });
  } catch (error) {
    console.error("Error creating food:", error);
    res.status(400).json({
      status: "fail",
      message: error.message || "Failed to create food",
    });
  }
};

// Update food (vendor can only update their own foods)
exports.updateFood = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid food ID provided",
      });
    }

    const filteredBody = {};
    const allowedFields = ["item_name", "description", "price", "is_available"];
    Object.keys(req.body).forEach((el) => {
      if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
    });

    if (Object.keys(filteredBody).length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "No valid fields to update",
      });
    }

    await foodService.updateFood(id, req.user.id, filteredBody);

    res.status(200).json({
      status: "success",
      message: "Food item updated successfully",
    });
  } catch (error) {
    console.error("Error updating food:", error);
    const statusCode = error.message.includes("You can only update your own foods") ? 403 : 400;
    res.status(statusCode).json({
      status: "fail",
      message: error.message || "Failed to update food",
    });
  }
};

// Delete food (vendor can only delete their own foods)
exports.deleteFood = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid food ID provided",
      });
    }

    await foodService.deleteFood(id, req.user.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting food:", error);
    const statusCode = error.message.includes("You can only delete your own foods") ? 403 : 400;
    res.status(statusCode).json({
      status: "fail",
      message: error.message || "Failed to delete food",
    });
  }
};
