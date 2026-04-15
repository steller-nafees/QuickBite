const db = require("../config/db");

exports.getAllUsers = async () => {
  try {
    const [rows] = await db.query("SELECT * FROM user");
    return rows;
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
};

exports.findByEmail = async (email) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM user WHERE email = ?",
      [email]
    );
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to find user by email: ${error.message}`);
  }
};

exports.getUser = async (id) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM user WHERE id = ?",
      [id]
    );
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};

exports.findUserById = async (id) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM user WHERE id = ?",
      [id]
    );
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to find user by ID: ${error.message}`);
  }
};

exports.create = async (user) => {
  try {
    const { name, email, password, role, student_id, vendor_id } = user;

    const [result] = await db.query(
      `INSERT INTO user
       (name, email, password, role, student_id, vendor_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, password, role, student_id, vendor_id]
    );

    return result.insertId;
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

exports.updateUserById = async (id, fields) => {
  try {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map(k => `${k} = ?`).join(", ");

    await db.query(
      `UPDATE user SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

exports.deleteUser = async (id) => {
  try {
    await db.query("DELETE FROM user WHERE id = ?", [id]);
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

exports.findByResetToken = async (token) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM user WHERE passwordResetToken = ?",
      [token]
    );
    return rows[0];
  } catch (error) {
    throw new Error(`Failed to find user by reset token: ${error.message}`);
  }
};