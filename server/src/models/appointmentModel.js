import pool from "../db.js";

export async function create({ propertyId, tenantId, ownerId, slotId, requestedDate, startTime, endTime, note }) {
  const result = await pool.query(
    `INSERT INTO appointments
       (property_id, tenant_id, owner_id, slot_id, requested_date, start_time, end_time, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [propertyId, tenantId, ownerId, slotId, requestedDate, startTime, endTime, note || null]
  );
  return result.rows[0];
}

export async function findById(id) {
  const result = await pool.query("SELECT * FROM appointments WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function findPendingBySlot(slotId, excludeId) {
  const result = await pool.query(
    "SELECT * FROM appointments WHERE slot_id = $1 AND status = 'pending' AND id != $2",
    [slotId, excludeId]
  );
  return result.rows;
}

export async function setStatus(id, status) {
  const result = await pool.query(
    "UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0] || null;
}

export async function findByUser(userId) {
  const result = await pool.query(
    `SELECT
       a.*,
       p.title AS property_title,
       CASE WHEN a.tenant_id = $1 THEN owner.full_name ELSE tenant.full_name END AS counterpart_name
     FROM appointments a
     JOIN properties p ON p.id = a.property_id
     JOIN users tenant ON tenant.id = a.tenant_id
     JOIN users owner ON owner.id = a.owner_id
     WHERE a.tenant_id = $1 OR a.owner_id = $1
     ORDER BY a.created_at DESC`,
    [userId]
  );
  return result.rows;
}
