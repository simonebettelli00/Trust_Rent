import pool from "../db.js";

export async function create({ userId, tokenHash, family, expiresAt, userAgent }) {
  const result = await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, family, expires_at, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, tokenHash, family, expiresAt, userAgent || null]
  );
  return result.rows[0];
}

export async function findByHash(tokenHash) {
  const result = await pool.query("SELECT * FROM refresh_tokens WHERE token_hash = $1", [
    tokenHash,
  ]);
  return result.rows[0] || null;
}

export async function revoke(id) {
  await pool.query(
    "UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL",
    [id]
  );
}

export async function revokeFamily(family) {
  await pool.query(
    "UPDATE refresh_tokens SET revoked_at = now() WHERE family = $1 AND revoked_at IS NULL",
    [family]
  );
}

export async function revokeAllForUser(userId) {
  await pool.query(
    "UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL",
    [userId]
  );
}
