import pool from "../db.js";

export async function create({
  ownerId,
  title,
  description,
  address,
  city,
  postalCode,
  lat,
  lng,
  geocodePrecision,
  floor,
  sqm,
  numRooms,
  numBathrooms,
  furnishings,
  monthlyPrice,
  deposit,
  availableFrom,
}) {
  const result = await pool.query(
    `INSERT INTO properties (
       owner_id, title, description, address, city, postal_code,
       lat, lng, geom, geocode_precision, floor, sqm, num_rooms, num_bathrooms,
       furnishings, monthly_price, deposit, available_from
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, ST_SetSRID(ST_MakePoint($8, $7), 4326)::geography, $9, $10, $11, $12, $13,
       $14, $15, $16, $17
     )
     RETURNING *`,
    [
      ownerId,
      title,
      description || null,
      address,
      city,
      postalCode || null,
      lat,
      lng,
      geocodePrecision || null,
      floor || null,
      sqm || null,
      numRooms || null,
      numBathrooms || null,
      JSON.stringify(furnishings || []),
      monthlyPrice,
      deposit || null,
      availableFrom || null,
    ]
  );
  return result.rows[0];
}

export async function update(id, fields) {
  const {
    title,
    description,
    address,
    city,
    postalCode,
    lat,
    lng,
    geocodePrecision,
    floor,
    sqm,
    numRooms,
    numBathrooms,
    furnishings,
    monthlyPrice,
    deposit,
    availableFrom,
    isPublished,
  } = fields;

  const result = await pool.query(
    `UPDATE properties SET
       title = $1,
       description = $2,
       address = $3,
       city = $4,
       postal_code = $5,
       lat = $6,
       lng = $7,
       geom = ST_SetSRID(ST_MakePoint($7, $6), 4326)::geography,
       geocode_precision = $8,
       floor = $9,
       sqm = $10,
       num_rooms = $11,
       num_bathrooms = $12,
       furnishings = $13,
       monthly_price = $14,
       deposit = $15,
       available_from = $16,
       is_published = $17,
       updated_at = now()
     WHERE id = $18
     RETURNING *`,
    [
      title,
      description || null,
      address,
      city,
      postalCode || null,
      lat,
      lng,
      geocodePrecision || null,
      floor || null,
      sqm || null,
      numRooms || null,
      numBathrooms || null,
      JSON.stringify(furnishings || []),
      monthlyPrice,
      deposit || null,
      availableFrom || null,
      isPublished,
      id,
    ]
  );
  return result.rows[0] || null;
}

export async function setPublished(id, isPublished) {
  const result = await pool.query(
    "UPDATE properties SET is_published = $1, updated_at = now() WHERE id = $2 RETURNING *",
    [isPublished, id]
  );
  return result.rows[0] || null;
}

export async function remove(id) {
  await pool.query("DELETE FROM properties WHERE id = $1", [id]);
}

export async function findById(id) {
  const result = await pool.query(
    `SELECT p.*, u.full_name AS owner_name
     FROM properties p
     JOIN users u ON u.id = p.owner_id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function findByOwner(ownerId) {
  const result = await pool.query(
    "SELECT * FROM properties WHERE owner_id = $1 ORDER BY created_at DESC",
    [ownerId]
  );
  return result.rows;
}

const MAX_SEARCH_RESULTS = 200;

export async function searchInBounds({ north, south, east, west, minPrice, maxPrice, rooms }) {
  const conditions = [
    "p.is_published = true",
    "ST_Contains(ST_MakeEnvelope($1, $2, $3, $4, 4326), p.geom::geometry)",
  ];
  const values = [west, south, east, north];

  if (minPrice !== undefined) {
    values.push(minPrice);
    conditions.push(`p.monthly_price >= $${values.length}`);
  }
  if (maxPrice !== undefined) {
    values.push(maxPrice);
    conditions.push(`p.monthly_price <= $${values.length}`);
  }
  if (rooms !== undefined) {
    values.push(rooms);
    conditions.push(`p.num_rooms >= $${values.length}`);
  }

  const result = await pool.query(
    `SELECT
       p.id, p.title, p.address, p.city, p.lat, p.lng,
       p.sqm, p.num_rooms, p.num_bathrooms, p.monthly_price,
       cover.url AS cover_image_url
     FROM properties p
     LEFT JOIN LATERAL (
       SELECT url FROM property_images
       WHERE property_id = p.id
       ORDER BY sort_order ASC
       LIMIT 1
     ) cover ON true
     WHERE ${conditions.join(" AND ")}
     ORDER BY p.created_at DESC
     LIMIT ${MAX_SEARCH_RESULTS}`,
    values
  );
  return result.rows;
}
