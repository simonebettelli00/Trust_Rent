import pool from "../db.js";

const PUBLIC_FIELDS = "id, email, role, full_name, phone, created_at";

export async function findByEmail(email) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0] || null;
}

export async function findById(id) {
  const result = await pool.query(
    `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createUser({ email, passwordHash, role, fullName, phone }) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${PUBLIC_FIELDS}`,
    [email, passwordHash, role, fullName, phone || null]
  );
  return result.rows[0];
}
