import pool from "../db.js";

export async function create({ propertyId, startDate, endDate }) {
  const result = await pool.query(
    `INSERT INTO blocked_periods (property_id, start_date, end_date)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [propertyId, startDate, endDate]
  );
  return result.rows[0];
}

export async function findByProperty(propertyId) {
  const result = await pool.query(
    "SELECT * FROM blocked_periods WHERE property_id = $1 ORDER BY start_date ASC",
    [propertyId]
  );
  return result.rows;
}

export async function findById(id) {
  const result = await pool.query("SELECT * FROM blocked_periods WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function remove(id) {
  await pool.query("DELETE FROM blocked_periods WHERE id = $1", [id]);
}

export async function findOverlapping(propertyId, startDate, endDate) {
  const result = await pool.query(
    `SELECT * FROM blocked_periods
     WHERE property_id = $1
       AND start_date < $3
       AND end_date > $2`,
    [propertyId, startDate, endDate]
  );
  return result.rows;
}
