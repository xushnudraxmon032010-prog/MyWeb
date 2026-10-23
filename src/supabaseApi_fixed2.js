import { supabase } from './lib/supabase';

export { supabase };

export function parseAcquaintance(item = {}) {
  const rawPhone = typeof item.phone === 'string' ? item.phone : '';
  const cleanPhone = rawPhone
    .split('|')[0]
    .replace(/[^\d+]/g, '')
    .trim();

  const directInstagram = typeof item.instagram === 'string' ? item.instagram : '';
  const instagram = (directInstagram || rawPhone.match(/@([A-Za-z0-9._]+)/)?.[1] || '')
    .replace(/^@/, '')
    .trim();

  return {
    cleanPhone,
    instagram,
  };
}

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

export async function getGlobalChatMessages() {
  return unwrap(
    await supabase
      .from('chat_messages')
      .select('id,sender,instagram,message,created_at')
      .neq('sender', '__SYSTEM_CONFIG__')
      .order('created_at', { ascending: false })
      .limit(200)
  );
}

export async function createGlobalChatMessage(payload) {
  return unwrap(
    await supabase
      .from('chat_messages')
      .insert({
        sender: payload.sender || 'Guest',
        instagram: payload.instagram || '',
        message: payload.message || '',
      })
      .select()
      .single()
  );
}

export function subscribeToGlobalChatMessages(onMessage) {
  const channel = supabase
    .channel('global-chat-room')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      (payload) => {
        if (payload?.new?.sender === '__SYSTEM_CONFIG__') return;
        onMessage?.();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function joinGlobalChatPresence({ instagram, sessionId, onPresence, onTyping, onStatus }) {
  const channel = supabase.channel('global-chat-presence', {
    config: { presence: { key: sessionId }, broadcast: { self: false } },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      onPresence?.(Object.values(presenceState).flat());
    })
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload?.sessionId !== sessionId) onTyping?.(payload);
    })
    .subscribe(async (status) => {
      onStatus?.(status);
      if (status === 'SUBSCRIBED') {
        await channel.track({ instagram, sessionId, onlineAt: new Date().toISOString() });
      }
    });

  return {
    sendTyping: (typing) => channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { instagram, sessionId, typing },
    }),
    unsubscribe: () => supabase.removeChannel(channel),
  };
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


export async function getChatPinSettings() {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('message')
      .eq('sender', '__SYSTEM_CONFIG__')
      .order('id', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      try {
        const parsed = JSON.parse(data[0].message);
        if (parsed && typeof parsed.pin === 'string') {
          return {
            pin: parsed.pin,
            enabled: parsed.enabled !== false,
          };
        }
      } catch (jsonErr) {
        console.warn('JSON parse error in system pin config:', jsonErr);
      }
    }
  } catch (err) {
    console.warn('Supabase getChatPinSettings fallback to local:', err);
  }

  const stored = localStorage.getItem('myweb-chat-pin-enabled');
  return {
    pin: localStorage.getItem('myweb-chat-pin') || '1234',
    enabled: stored === null ? true : stored === 'true',
  };
}

export async function updateChatPinSettings({ pin, enabled }) {
  const current = await getChatPinSettings();
  const nextPin = pin !== undefined ? pin : current.pin;
  const nextEnabled = enabled !== undefined ? enabled : current.enabled;

  localStorage.setItem('myweb-chat-pin', nextPin);
  localStorage.setItem('myweb-chat-pin-enabled', String(nextEnabled));

  try {
    const { data, error } = await supabase.from('chat_messages').insert({
      sender: '__SYSTEM_CONFIG__',
      instagram: '__system_pin__',
      message: JSON.stringify({ pin: nextPin, enabled: nextEnabled }),
    }).select().single();

    if (error) {
      console.warn('Supabase updateChatPinSettings error:', error);
    }
    return data;
  } catch (err) {
    console.warn('Supabase updateChatPinSettings failed:', err);
    return null;
  }
}

export function subscribeToChatPinSettings(onPinUpdate) {
  const channel = supabase
    .channel('global-chat-pin-updates')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      (payload) => {
        if (payload?.new?.sender === '__SYSTEM_CONFIG__') {
          try {
            const parsed = JSON.parse(payload.new.message);
            if (parsed && typeof parsed.pin === 'string') {
              onPinUpdate?.({
                pin: parsed.pin,
                enabled: parsed.enabled !== false,
              });
            }
          } catch (e) {
            console.warn('Failed to parse realtime pin settings:', e);
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}