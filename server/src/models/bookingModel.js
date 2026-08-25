import pool from "../db.js";

export async function create({ propertyId, tenantId, ownerId, checkIn, checkOut, note }) {
  const result = await pool.query(
    `INSERT INTO bookings (property_id, tenant_id, owner_id, check_in, check_out, note)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [propertyId, tenantId, ownerId, checkIn, checkOut, note || null]
  );
  return result.rows[0];
}

export async function findById(id) {
  const result = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function setStatus(id, status) {
  const result = await pool.query(
    "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0] || null;
}

// Sovrapposizione: due intervalli [checkIn, checkOut) si toccano se
// checkIn < altro.check_out AND checkOut > altro.check_in.
export async function findOverlapping(propertyId, checkIn, checkOut, statuses) {
  const result = await pool.query(
    `SELECT * FROM bookings
     WHERE property_id = $1
       AND status = ANY($2::text[])
       AND check_in < $4
       AND check_out > $3`,
    [propertyId, statuses, checkIn, checkOut]
  );
  return result.rows;
}

export async function findPendingOverlapping(propertyId, checkIn, checkOut, excludeId) {
  const result = await pool.query(
    `SELECT * FROM bookings
     WHERE property_id = $1
       AND status = 'pending'
       AND id != $2
       AND check_in < $4
       AND check_out > $3`,
    [propertyId, excludeId, checkIn, checkOut]
  );
  return result.rows;
}

export async function findByUser(userId) {
  const result = await pool.query(
    `SELECT
       b.*,
       p.title AS property_title,
       CASE WHEN b.tenant_id = $1 THEN owner.full_name ELSE tenant.full_name END AS counterpart_name
     FROM bookings b
     JOIN properties p ON p.id = b.property_id
     JOIN users tenant ON tenant.id = b.tenant_id
     JOIN users owner ON owner.id = b.owner_id
     WHERE b.tenant_id = $1 OR b.owner_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function findAcceptedByProperty(propertyId) {
  const result = await pool.query(
    "SELECT check_in, check_out FROM bookings WHERE property_id = $1 AND status = 'accepted'",
    [propertyId]
  );
  return result.rows;
}
