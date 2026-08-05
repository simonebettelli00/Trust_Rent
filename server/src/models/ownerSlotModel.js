import pool from "../db.js";

export async function create({ propertyId, date, startTime, endTime }) {
  const result = await pool.query(
    `INSERT INTO owner_slots (property_id, date, start_time, end_time)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [propertyId, date, startTime, endTime]
  );
  return result.rows[0];
}

export async function findByProperty(propertyId) {
  const result = await pool.query(
    "SELECT * FROM owner_slots WHERE property_id = $1 ORDER BY date ASC, start_time ASC",
    [propertyId]
  );
  return result.rows;
}

export async function findById(id) {
  const result = await pool.query("SELECT * FROM owner_slots WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function remove(id) {
  await pool.query("DELETE FROM owner_slots WHERE id = $1", [id]);
}
