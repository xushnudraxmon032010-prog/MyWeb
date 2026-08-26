// Use the local API during development and the deployed API in production.
const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
let adminToken = '';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
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
  return await request('/acquaintances/approved');
}

export async function getPendingAcquaintances() {
  return await request('/acquaintances/pending');
}

export async function createAcquaintance(payload) {
  return await request('/acquaintances', { method: 'POST', body: JSON.stringify(payload) });
}

export async function approveAcquaintance(id) {
  return await request(`/acquaintances/${id}/approve`, {
    method: 'PATCH',
  });
}

export async function updateAcquaintance(id, payload) {
  return await request(`/acquaintances/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteAcquaintance(id) {
  return await request(`/acquaintances/${id}`, { method: 'DELETE' });
}

export async function createFriend(payload) {
  return await request('/friends', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateFriend(id, payload) {
  return await request(`/friends/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteFriend(id) {
  return await request(`/friends/${id}`, { method: 'DELETE' });
}

export async function loginAdmin(username, password) {
  try {
    const result = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (!result?.ok || !result.token) return null;
    adminToken = result.token;
    return result;
  } catch {
    return null;
  }
}

export function logoutAdmin() {
  adminToken = '';
}
