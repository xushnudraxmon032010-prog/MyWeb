// Use the local API during development and the deployed API in production.
const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
let adminToken = '';

const fallbackProfile = {
  name: 'Xushnudraxmon',
  surname: 'Sherqulov',
  title: 'Frontend Developer',
  city: 'Tashkent, Uzbekistan',
  bio: 'Men dasturlashni sevaman, yangi texnologiyalarni o’rganishni va foydali veb-ilovalar yaratishni maqsad qilganman.',
  about: 'Men dasturlashni o’rganish bilan birga, foydalanuvchilar uchun qulay va chiroyli interfeyslar yaratishga qiziqam.',
  course: 'Dasturlash kursi',
  interests: ['Dasturlash', 'Kitob o’qish', 'Veb dizayn', 'Sun’iy intellekt'],
  achievements: [],
  socialLinks: {
    telegram: 'https://t.me/+998200101026',
    instagram: 'https://instagram.com/_sherqulovv_010',
    youtube: 'https://youtube.com/@yourchannel',
  },
};

const fallbackFriends = [{ id: 4, name: 'Hojakbar', relation: 'Do’st', note: 'mening yaqin do‘stim' }];

function readFallback(key, initialValue) {
  try {
    const value = localStorage.getItem(`myweb-${key}`);
    return value ? JSON.parse(value) : initialValue;
  } catch {
    return initialValue;
  }
}

function writeFallback(key, value) {
  localStorage.setItem(`myweb-${key}`, JSON.stringify(value));
}

function nextFallbackId(items) {
  return items.reduce((highest, item) => Math.max(highest, Number(item.id) || 0), 0) + 1;
}

function fallbackData(path, options = {}) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : {};
  let friends = readFallback('friends', fallbackFriends);
  let acquaintances = readFallback('acquaintances', []);

  if (path === '/profile' && method === 'GET') return readFallback('profile', fallbackProfile);
  if (path.startsWith('/friends') && method === 'GET') return friends.sort((a, b) => b.id - a.id);
  if (path === '/friends' && method === 'POST') {
    const friend = { ...body, id: nextFallbackId(friends) };
    writeFallback('friends', [friend, ...friends]);
    return friend;
  }
  if (path.startsWith('/friends/') && method === 'PUT') {
    const id = Number(path.split('/')[2]);
    const updated = { ...friends.find((item) => item.id === id), ...body, id };
    writeFallback('friends', friends.map((item) => (item.id === id ? updated : item)));
    return updated;
  }
  if (path.startsWith('/friends/') && method === 'DELETE') {
    writeFallback('friends', friends.filter((item) => item.id !== Number(path.split('/')[2])));
    return { ok: true };
  }
  if (path === '/acquaintances' && method === 'POST') {
    const acquaintance = { ...body, id: nextFallbackId(acquaintances), status: 'pending' };
    writeFallback('acquaintances', [acquaintance, ...acquaintances]);
    return acquaintance;
  }
  if (path === '/acquaintances/pending' && method === 'GET') return acquaintances.filter((item) => item.status === 'pending');
  if (path === '/acquaintances/approved' && method === 'GET') return acquaintances.filter((item) => item.status === 'approved');
  if (path.endsWith('/approve') && method === 'PATCH') {
    const id = Number(path.split('/')[2]);
    const updated = { ...acquaintances.find((item) => item.id === id), status: 'approved', id };
    writeFallback('acquaintances', acquaintances.map((item) => (item.id === id ? updated : item)));
    return updated;
  }
  if (path.startsWith('/acquaintances/') && method === 'PUT') {
    const id = Number(path.split('/')[2]);
    const updated = { ...acquaintances.find((item) => item.id === id), ...body, id };
    writeFallback('acquaintances', acquaintances.map((item) => (item.id === id ? updated : item)));
    return updated;
  }
  if (path.startsWith('/acquaintances/') && method === 'PATCH') {
    const id = Number(path.split('/')[2]);
    const updated = { ...acquaintances.find((item) => item.id === id), ...body, id };
    writeFallback('acquaintances', acquaintances.map((item) => (item.id === id ? updated : item)));
    return updated;
  }
  if (path.startsWith('/acquaintances/') && method === 'DELETE') {
    writeFallback('acquaintances', acquaintances.filter((item) => item.id !== Number(path.split('/')[2])));
    return { ok: true };
  }
  if (path === '/login' && method === 'POST') {
    if (body.username === 'xushnudraxmon032010' && body.password === 'xushnudraxmon1234') {
      adminToken = 'local-admin-token';
      return { ok: true, username: body.username, token: adminToken };
    }
    return null;
  }
  return null;
}

async function request(path, options = {}) {
  try {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      ...options,
    });

    if (!res.ok) throw new Error(`Request failed ${res.status}`);

    const bodyText = await res.text();
    if (!bodyText) return null;
    return JSON.parse(bodyText);
  } catch {
    return fallbackData(path, options);
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
