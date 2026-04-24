const db = require("../config/db");

exports.getAllUsers = async () => {
  try {
    const [rows] = await db.query("SELECT * FROM user");
    return rows.map(user => ({
      ...user,
      id: user.user_id,
      name: user.full_name
    }));
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
    if (rows.length === 0) return null;
    const user = rows[0];
    return {
      ...user,
      id: user.user_id,
      name: user.full_name
    };
  } catch (error) {
    throw new Error(`Failed to find user by email: ${error.message}`);
  }
};

exports.getUser = async (id) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM user WHERE user_id = ?",
      [id]
    );
    if (rows.length === 0) return null;
    const user = rows[0];
    return {
      ...user,
      id: user.user_id,
      name: user.full_name
    };
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};

exports.findUserById = async (id) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM user WHERE user_id = ?",
      [id]
    );
    if (rows.length === 0) return null;
    const user = rows[0];
    return {
      ...user,
      id: user.user_id,
      name: user.full_name
    };
  } catch (error) {
    throw new Error(`Failed to find user by ID: ${error.message}`);
  }
};

exports.create = async (user) => {
  try {
    const { full_name, email, password, role } = user;

    const [result] = await db.query(
      `INSERT INTO user
       (full_name, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [full_name, email, password, role]
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
      `UPDATE user SET ${setClause} WHERE user_id = ?`,
      [...values, id]
    );
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

exports.deleteUser = async (id) => {
  try {
    await db.query("DELETE FROM user WHERE user_id = ?", [id]);
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
    if (rows.length === 0) return null;
    const user = rows[0];
    return {
      ...user,
      id: user.user_id,
      name: user.full_name
    };
  } catch (error) {
    throw new Error(`Failed to find user by reset token: ${error.message}`);
  }
};