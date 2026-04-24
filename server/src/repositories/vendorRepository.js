const db = require("../config/db");

// Get all vendors (users with role = 'vendor')
exports.getAllVendors = async () => {
  try {
    const [rows] = await db.query(
      "SELECT user_id, full_name, email, role, created_at, updated_at FROM user WHERE role = 'Vendor'"
    );
    return rows;
  } catch (error) {
    throw new Error(`Failed to fetch vendors: ${error.message}`);
  }
};

// Get vendor by ID
exports.getVendor = async (id) => {
  try {
    const [rows] = await db.query(
      "SELECT user_id, full_name, email, role, created_at, updated_at FROM user WHERE user_id = ? AND role = 'Vendor'",
      [id]
    );
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to fetch vendor: ${error.message}`);
  }
};

// Update vendor profile
exports.updateVendor = async (id, fields) => {
  try {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map((k) => `${k} = ?`).join(", ");

    await db.query(
      `UPDATE user SET ${setClause} WHERE user_id = ? AND role = 'Vendor'`,
      [...values, id]
    );
  } catch (error) {
    throw new Error(`Failed to update vendor: ${error.message}`);
  }
};

// Delete vendor
exports.deleteVendor = async (id) => {
  try {
    await db.query("DELETE FROM user WHERE user_id = ? AND role = 'Vendor'", [id]);
  } catch (error) {
    throw new Error(`Failed to delete vendor: ${error.message}`);
  }
};
