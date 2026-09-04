import { supabase } from './lib/supabase';

const adminEmail = (username) => (username.includes('@') ? username.trim() : `${username.trim()}@myweb.local`);

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export async function getProfile() {
  const row = unwrap(await supabase.from('profile').select('*').eq('id', 1).maybeSingle());
  if (!row) return null;
  return {
    ...row,
    socialLinks: {
      telegram: row.telegram || '',
      instagram: 'https://instagram.com/_sherqulovv_o1',
      youtube: 'https://youtube.com/@Xushnudraxmon01',
    },
  };
}

export async function getFriends() {
  return unwrap(await supabase.from('friends').select('*').order('id', { ascending: false }));
}

export async function getApprovedAcquaintances() {
  return unwrap(await supabase.from('acquaintances').select('*').eq('status', 'approved').order('id', { ascending: false }));
}

export async function getPendingAcquaintances() {
  return unwrap(await supabase.from('acquaintances').select('*').eq('status', 'pending').order('id', { ascending: false }));
}

export async function createAcquaintance(payload) {
  return unwrap(await supabase.from('acquaintances').insert({ ...payload, status: 'pending' }));
}

export async function approveAcquaintance(id) {
  return unwrap(await supabase.from('acquaintances').update({ status: 'approved' }).eq('id', id).select().single());
}

export async function updateAcquaintance(id, payload) {
  return unwrap(await supabase.from('acquaintances').update(payload).eq('id', id).select().single());
}

export async function deleteAcquaintance(id) {
  return unwrap(await supabase.from('acquaintances').delete().eq('id', id));
}

export async function createFriend(payload) {
  return unwrap(await supabase.from('friends').insert(payload).select().single());
}

export async function updateFriend(id, payload) {
  return unwrap(await supabase.from('friends').update(payload).eq('id', id).select().single());
}

export async function deleteFriend(id) {
  return unwrap(await supabase.from('friends').delete().eq('id', id));
}

export async function getReviews() {
  return unwrap(await supabase.from('reviews').select('*').order('created_at', { ascending: false }));
}

export async function createReview(payload) {
  return unwrap(await supabase.from('reviews').insert(payload));
}

export async function deleteReview(id) {
  return unwrap(await supabase.from('reviews').delete().eq('id', id));
}

export async function recordVisitor(visitorId) {
  return unwrap(await supabase.from('visitor_events').insert({ visitor_id: visitorId }));
}

export async function getMonthlyVisitorStats() {
  return unwrap(await supabase.rpc('get_monthly_visitor_stats'));
}

export async function loginAdmin(username, password) {
  const result = await supabase.auth.signInWithPassword({ email: adminEmail(username), password });
  if (result.error) return null;
  return result.data.user;
}

export async function logoutAdmin() {
  await supabase.auth.signOut();
}