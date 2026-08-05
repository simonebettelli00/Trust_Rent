import pool from "../db.js";

export async function create({ conversationId, senderId, body }) {
  const result = await pool.query(
    `INSERT INTO messages (conversation_id, sender_id, body)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [conversationId, senderId, body]
  );
  return result.rows[0];
}

export async function findByConversation(conversationId) {
  const result = await pool.query(
    "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
    [conversationId]
  );
  return result.rows;
}

export async function markRead(conversationId, userId) {
  const result = await pool.query(
    `UPDATE messages SET is_read = true
     WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false
     RETURNING id`,
    [conversationId, userId]
  );
  return result.rows.map((row) => row.id);
}
