const db = require("../config/db");

exports.getAllUsers = async () => {
  const [rows] = await db.query("SELECT * FROM students");
  return rows;
};

exports.findByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM students WHERE email = ?",
    [email]
  );
  return rows[0];
};

exports.getUser = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM students WHERE id = ?",
    [id]
  );
  return rows[0];
};

exports.findUserById = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM students WHERE id = ?",
    [id]
  );
  return rows[0];
};

exports.create = async (user) => {
  const { name, email, password, role, student_id, vendor_id } = user;

  const [result] = await db.query(
    `INSERT INTO students
     (name, email, password, role, student_id, vendor_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, email, password, role, student_id, vendor_id]
  );

  return result.insertId;
};

exports.updateUserById = async (id, fields) => {
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  const setClause = keys.map(k => `${k} = ?`).join(", ");

  await db.query(
    `UPDATE students SET ${setClause} WHERE id = ?`,
    [...values, id]
  );
};

exports.deleteUser = async (id) => {
  await db.query("DELETE FROM students WHERE id = ?", [id]);
};

exports.findByResetToken = async (token) => {
  const [rows] = await db.query(
    "SELECT * FROM students WHERE passwordResetToken = ?",
    [token]
  );
  return rows[0];
};