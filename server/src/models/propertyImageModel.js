import pool from "../db.js";

export async function create({ propertyId, url, sortOrder }) {
  const result = await pool.query(
    `INSERT INTO property_images (property_id, url, sort_order)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [propertyId, url, sortOrder]
  );
  return result.rows[0];
}

export async function findByProperty(propertyId) {
  const result = await pool.query(
    "SELECT * FROM property_images WHERE property_id = $1 ORDER BY sort_order ASC",
    [propertyId]
  );
  return result.rows;
}

export async function countByProperty(propertyId) {
  const result = await pool.query(
    "SELECT COUNT(*)::int AS count FROM property_images WHERE property_id = $1",
    [propertyId]
  );
  return result.rows[0].count;
}

export async function findById(id) {
  const result = await pool.query("SELECT * FROM property_images WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function remove(id) {
  await pool.query("DELETE FROM property_images WHERE id = $1", [id]);
}

export async function updateSortOrder(id, sortOrder) {
  await pool.query("UPDATE property_images SET sort_order = $1 WHERE id = $2", [sortOrder, id]);
}
