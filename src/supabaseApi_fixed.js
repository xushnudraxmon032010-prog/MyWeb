// Lightweight JSON Server client to replace Supabase for local dev
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed ${res.status} ${res.statusText} ${text}`);
  }

  // Some endpoints (DELETE) may return empty body
  const bodyText = await res.text();
  if (!bodyText) return null;
  try {
    return JSON.parse(bodyText);
  } catch {
    return bodyText;
  }
}

export async function getProfile() {
  // db.json has profile as an object; fetch it directly
  return await request('/profile');
}

export async function getFriends() {
  // Return sorted by id desc
  return await request('/friends?_sort=id&_order=desc');
}

export async function getApprovedAcquaintances() {
  return await request('/acquaintances?status=approved&_sort=id&_order=desc');
}

export async function getPendingAcquaintances() {
  return await request('/acquaintances?status=pending&_sort=id&_order=desc');
}

export async function createAcquaintance(payload) {
  return await request('/acquaintances', { method: 'POST', body: JSON.stringify(payload) });
}

export async function approveAcquaintance(id) {
  return await request(`/acquaintances/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'approved' }),
  });
}

export async function updateAcquaintance(id, payload) {
  return await request(`/acquaintances/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function deleteAcquaintance(id) {
  return await request(`/acquaintances/${id}`, { method: 'DELETE' });
}

export async function createFriend(payload) {
  return await request('/friends', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateFriend(id, payload) {
  return await request(`/friends/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function deleteFriend(id) {
  return await request(`/friends/${id}`, { method: 'DELETE' });
}

export async function loginAdmin(username, password) {
  // Try to find an admin in /admins (if present in db.json)
  try {
    // Query admins by username and password. json-server supports filtering via query params.
    const results = await request(`/admins?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
    if (Array.isArray(results) && results.length > 0) return results[0];
  } catch (err) {
    // ignore and fallback
  }

  // Fallback: basic local check (useful when db.json has no admins)
  if (username === 'admin' && password === 'admin') {
    return { id: 1, username: 'admin', role: 'super-admin' };
  }

  return null;
}
