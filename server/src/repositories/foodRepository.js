const db = require("../config/db");

// Get all foods (public for authenticated users)
exports.getAllFoods = async () => {
  try {
    const [rows] = await db.query(
      `SELECT 
        f.food_id, 
        f.item_name, 
        f.description, 
        f.price, 
        f.is_available, 
        f.managed_by, 
        u.name as vendor_name,
        f.created_at, 
        f.updated_at 
       FROM food f
       JOIN user u ON f.managed_by = u.id
       WHERE f.is_available = true
       ORDER BY f.created_at DESC`
    );
    return rows;
  } catch (error) {
    throw new Error(`Failed to fetch foods: ${error.message}`);
  }
};

// Get food by ID
exports.getFoodById = async (id) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        f.food_id, 
        f.item_name, 
        f.description, 
        f.price, 
        f.is_available, 
        f.managed_by, 
        u.name as vendor_name,
        f.created_at, 
        f.updated_at 
       FROM food f
       JOIN user u ON f.managed_by = u.id
       WHERE f.food_id = ?`,
      [id]
    );
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to fetch food: ${error.message}`);
  }
};

// Get all foods by vendor ID
exports.getFoodsByVendor = async (vendorId) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        f.food_id, 
        f.item_name, 
        f.description, 
        f.price, 
        f.is_available, 
        f.managed_by, 
        f.created_at, 
        f.updated_at 
       FROM food f
       WHERE f.managed_by = ?
       ORDER BY f.created_at DESC`,
      [vendorId]
    );
    return rows;
  } catch (error) {
    throw new Error(`Failed to fetch vendor foods: ${error.message}`);
  }
};

// Create food
exports.createFood = async (foodData) => {
  try {
    const { item_name, description, price, managed_by } = foodData;

    const [result] = await db.query(
      `INSERT INTO food (item_name, description, price, managed_by) 
       VALUES (?, ?, ?, ?)`,
      [item_name, description, price, managed_by]
    );

    return result.insertId;
  } catch (error) {
    throw new Error(`Failed to create food: ${error.message}`);
  }
};

// Update food (only owner can update)
exports.updateFood = async (foodId, vendorId, fields) => {
  try {
    // Verify ownership
    const [food] = await db.query(
      "SELECT managed_by FROM food WHERE food_id = ?",
      [foodId]
    );

    if (food.length === 0) {
      throw new Error("Food not found");
    }

    if (food[0].managed_by !== vendorId) {
      throw new Error("You can only update your own foods");
    }

    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((k) => `${k} = ?`).join(", ");

    await db.query(
      `UPDATE food SET ${setClause} WHERE food_id = ? AND managed_by = ?`,
      [...values, foodId, vendorId]
    );
  } catch (error) {
    throw new Error(`Failed to update food: ${error.message}`);
  }
};

// Delete food (only owner can delete)
exports.deleteFood = async (foodId, vendorId) => {
  try {
    // Verify ownership
    const [food] = await db.query(
      "SELECT managed_by FROM food WHERE food_id = ?",
      [foodId]
    );

    if (food.length === 0) {
      throw new Error("Food not found");
    }

    if (food[0].managed_by !== vendorId) {
      throw new Error("You can only delete your own foods");
    }

    await db.query(
      "DELETE FROM food WHERE food_id = ? AND managed_by = ?",
      [foodId, vendorId]
    );
  } catch (error) {
    throw new Error(`Failed to delete food: ${error.message}`);
  }
};
