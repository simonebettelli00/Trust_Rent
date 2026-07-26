const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || "Errore di rete");
  }
  return data;
}

function toApiPayload(property) {
  return {
    title: property.title,
    description: property.description,
    address: property.address,
    city: property.city,
    postal_code: property.postalCode,
    floor: property.floor,
    sqm: property.sqm ? Number(property.sqm) : null,
    num_rooms: property.numRooms ? Number(property.numRooms) : null,
    num_bathrooms: property.numBathrooms ? Number(property.numBathrooms) : null,
    furnishings: property.furnishings,
    monthly_price: Number(property.monthlyPrice),
    deposit: property.deposit ? Number(property.deposit) : null,
    available_from: property.availableFrom || null,
  };
}

export async function getMine(token) {
  const res = await fetch(`${API_URL}/api/properties/mine`, { headers: authHeaders(token) });
  return parse(res);
}

export async function search(bounds, filters = {}, signal) {
  const params = new URLSearchParams({
    north: bounds.north,
    south: bounds.south,
    east: bounds.east,
    west: bounds.west,
  });
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.rooms) params.set("rooms", filters.rooms);

  const res = await fetch(`${API_URL}/api/properties?${params.toString()}`, { signal });
  return parse(res);
}

export async function getOne(id) {
  const res = await fetch(`${API_URL}/api/properties/${id}`);
  return parse(res);
}

export async function getAvailability(id) {
  const res = await fetch(`${API_URL}/api/properties/${id}/availability`);
  return parse(res);
}

export async function create(token, property) {
  const res = await fetch(`${API_URL}/api/properties`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(toApiPayload(property)),
  });
  return parse(res);
}

export async function update(token, id, property) {
  const res = await fetch(`${API_URL}/api/properties/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(toApiPayload(property)),
  });
  return parse(res);
}

export async function setPublished(token, id, isPublished) {
  const res = await fetch(`${API_URL}/api/properties/${id}/publish`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ is_published: isPublished }),
  });
  return parse(res);
}

export async function remove(token, id) {
  const res = await fetch(`${API_URL}/api/properties/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Errore di rete");
  }
}

export async function uploadImages(token, id, files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }
  const res = await fetch(`${API_URL}/api/properties/${id}/images`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  return parse(res);
}

export async function deleteImage(token, id, imageId) {
  const res = await fetch(`${API_URL}/api/properties/${id}/images/${imageId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Errore di rete");
  }
}

export async function reorderImages(token, id, order) {
  const res = await fetch(`${API_URL}/api/properties/${id}/images/order`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ order }),
  });
  return parse(res);
}

export function resolveImageUrl(url) {
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}
