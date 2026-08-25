import pool from "../db.js";

export async function create({ userId, type, relatedId, message }) {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, related_id, message)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, type, relatedId ?? null, message]
  );
  return result.rows[0];
}

export async function findByUser(userId) {
  const result = await pool.query(
    "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100",
    [userId]
  );
  return result.rows;
}

export async function findById(id) {
  const result = await pool.query("SELECT * FROM notifications WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function markRead(id) {
  const result = await pool.query(
    "UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}
