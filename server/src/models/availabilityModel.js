import pool from "../db.js";

export async function findByProperty(propertyId) {
  const result = await pool.query(
    "SELECT id, date, status FROM availability WHERE property_id = $1 ORDER BY date ASC",
    [propertyId]
  );
  return result.rows;
}
