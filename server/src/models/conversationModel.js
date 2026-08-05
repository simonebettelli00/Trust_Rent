import pool from "../db.js";

export async function findByPropertyAndTenant(propertyId, tenantId) {
  const result = await pool.query(
    "SELECT * FROM conversations WHERE property_id = $1 AND tenant_id = $2",
    [propertyId, tenantId]
  );
  return result.rows[0] || null;
}

export async function create({ propertyId, tenantId, ownerId }) {
  const result = await pool.query(
    `INSERT INTO conversations (property_id, tenant_id, owner_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [propertyId, tenantId, ownerId]
  );
  return result.rows[0];
}

export async function findById(id) {
  const result = await pool.query("SELECT * FROM conversations WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function findByUser(userId) {
  const result = await pool.query(
    `SELECT
       c.id, c.property_id, c.tenant_id, c.owner_id, c.created_at,
       p.title AS property_title,
       CASE WHEN c.tenant_id = $1 THEN owner.full_name ELSE tenant.full_name END AS counterpart_name,
       last_msg.body AS last_message_body,
       last_msg.created_at AS last_message_at,
       last_msg.sender_id AS last_message_sender_id,
       COALESCE(unread.count, 0) AS unread_count
     FROM conversations c
     JOIN properties p ON p.id = c.property_id
     JOIN users tenant ON tenant.id = c.tenant_id
     JOIN users owner ON owner.id = c.owner_id
     LEFT JOIN LATERAL (
       SELECT body, created_at, sender_id FROM messages
       WHERE conversation_id = c.id
       ORDER BY created_at DESC
       LIMIT 1
     ) last_msg ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS count FROM messages
       WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false
     ) unread ON true
     WHERE c.tenant_id = $1 OR c.owner_id = $1
     ORDER BY COALESCE(last_msg.created_at, c.created_at) DESC`,
    [userId]
  );
  return result.rows;
}
