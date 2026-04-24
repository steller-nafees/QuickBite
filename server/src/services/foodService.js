const foodRepo = require("../repositories/foodRepository");

exports.getAllFoods = async () => {
  try {
    return await foodRepo.getAllFoods();
  } catch (error) {
    throw new Error(`Failed to retrieve foods: ${error.message}`);
  }
};

exports.getFoodById = async (id) => {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error("Invalid food ID");
    }
    return await foodRepo.getFoodById(id);
  } catch (error) {
    throw new Error(`Failed to retrieve food: ${error.message}`);
  }
};

exports.getFoodsByVendor = async (vendorId) => {
  try {
    if (!vendorId || typeof vendorId !== 'string') {
      throw new Error("Invalid vendor ID");
    }
    return await foodRepo.getFoodsByVendor(vendorId);
  } catch (error) {
    throw new Error(`Failed to retrieve vendor foods: ${error.message}`);
  }
};

exports.createFood = async (vendorId, foodData) => {
  try {
    if (!vendorId || typeof vendorId !== 'string') {
      throw new Error("Invalid vendor ID");
    }

    if (!foodData.item_name || !foodData.price) {
      throw new Error("item_name and price are required");
    }

    if (isNaN(foodData.price) || foodData.price <= 0) {
      throw new Error("Price must be a positive number");
    }

    const foodWithVendor = {
      ...foodData,
      managed_by: vendorId,
    };

    return await foodRepo.createFood(foodWithVendor);
  } catch (error) {
    throw new Error(`Failed to create food: ${error.message}`);
  }
};

exports.updateFood = async (foodId, vendorId, data) => {
  try {
    if (!foodId || typeof foodId !== 'string') {
      throw new Error("Invalid food ID");
    }

    if (!vendorId || typeof vendorId !== 'string') {
      throw new Error("Invalid vendor ID");
    }

    if (!data || Object.keys(data).length === 0) {
      throw new Error("No fields to update");
    }

    // Prevent updating managed_by (vendor ownership)
    const { managed_by, ...allowedFields } = data;

    return await foodRepo.updateFood(foodId, vendorId, allowedFields);
  } catch (error) {
    throw new Error(`Failed to update food: ${error.message}`);
  }
};

exports.deleteFood = async (foodId, vendorId) => {
  try {
    if (!foodId || typeof foodId !== 'string') {
      throw new Error("Invalid food ID");
    }

    if (!vendorId || typeof vendorId !== 'string') {
      throw new Error("Invalid vendor ID");
    }

    return await foodRepo.deleteFood(foodId, vendorId);
  } catch (error) {
    throw new Error(`Failed to delete food: ${error.message}`);
  }
};
