import { useEffect, useState, useRef } from 'react';
import './App.css';
import {
  approveAcquaintance as approveSupabaseAcquaintance,
  createAcquaintance as createSupabaseAcquaintance,
  createFriend as createSupabaseFriend,
  deleteAcquaintance as deleteSupabaseAcquaintance,
  deleteFriend as deleteSupabaseFriend,
  getApprovedAcquaintances,
  getFriends,
  getPendingAcquaintances,
  getProfile,
  getReviews,
  getGlobalChatMessages,
  getMonthlyVisitorStats,
  loginAdmin,
  createReview,
  createGlobalChatMessage,
  subscribeToGlobalChatMessages,
  joinGlobalChatPresence,
  recordVisitor,
  deleteReview,
  updateAcquaintance as updateSupabaseAcquaintance,
  updateFriend as updateSupabaseFriend,
  logoutAdmin,
  parseAcquaintance,
  supabase,
} from './supabaseApi_fixed2';
import HomePage from './pages/HomePage';
import FriendsPage from './pages/FriendsPage';
import ProjectsPage from './pages/ProjectsPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';
import LiveVideoRoom from './components/LiveVideoRoom';

const brand = {
  name: 'MyWeb',
  tagline: 'Men haqimda, qiziqishlarim va yutuqlarim.',
  colors: {
    ink: '#102E24',
    forest: '#064332',
    forestDark: '#03261D',
    leaf: '#0B5A43',
    gold: '#F7B625',
    goldDark: '#D89110',
    paper: '#FFF9EE',
    paperMuted: '#F4EAD7',
    line: '#E8D9BD',
    text: '#17211D',
    muted: '#6F766F',
    danger: '#B42318',
  },
};

const initialProfile = {
  name: 'Xushnudraxmon',
  surname: 'Sherqulov',
  title: 'Frontend Developer',
  city: 'Tashkent, Uzbekistan',
  bio: 'Men dasturlashni sevaman, yangi texnologiyalarni o’rganishni va foydali veb-ilovalar yaratishni maqsad qilganman.',
  about:
    'Men dasturlashni o’rganish bilan birga, foydalanuvchilar uchun qulay va chiroyli interfeyslar yaratishga qiziqam. Bu yo’lda HTML, CSS, JavaScript va React bilan ishlashni yaxshi bilaman.',
  course: 'Dasturlash kursi',
  interests: ['Dasturlash', 'Kitob o’qish', 'Veb dizayn', 'Sun’iy intellekt'],
  achievements: [
    'HTML, CSS va JavaScript asoslarini o’rgandim',
    'React va komponenta arxitekturasi bo’yicha amaliy mashg’ulotlar qildim',
    'Loyihalar yaratib, amaliy tajriba oldim',
    'Dasturlashga qiziqishni yanada chuqurlashtirdim',
  ],
  socialLinks: {
    telegram: 'https://t.me/+998200101026',
    instagram: 'https://instagram.com/_sherqulovv_o1',
    youtube: 'https://youtube.com/@Xushnudraxmon01',
  },
};

const projects = [
  {
    number: '01',
    title: 'MyWeb portfolio',
    description: 'Shaxsiy ma’lumotlar, yutuqlar va bog‘lanish uchun zamonaviy portfolio sahifasi.',
    technologies: ['React', 'CSS', 'Supabase'],
    tone: 'project-card-green',
  },
  {
    number: '02',
    title: 'Donate xizmati',
    description: 'O‘yinchilar uchun tezkor buyurtma va yordam olishga mo‘ljallangan xizmat sahifasi.',
    technologies: ['UI/UX', 'Forms', 'API'],
    tone: 'project-card-gold',
  },
  {
    number: '03',
    title: 'Responsive interfeyslar',
    description: 'Telefon, planshet va kompyuterda qulay ishlaydigan moslashuvchan dizaynlar.',
    technologies: ['HTML', 'JavaScript', 'Responsive'],
    tone: 'project-card-blue',
  },
];

const services = [
  {
    number: '01',
    title: 'Landing page',
    description: 'Biznes yoki shaxsiy brend uchun tezkor va zamonaviy bir sahifali sayt.',
    tone: 'service-card-light',
  },
  {
    number: '02',
    title: 'React ilova',
    description: 'Qulay boshqaruv, formalar va ma’lumotlar bazasiga ulangan web-ilova.',
    tone: 'service-card-green',
  },
  {
    number: '03',
    title: 'Responsive dizayn',
    description: 'Telefon, planshet va kompyuterda birdek chiroyli ishlaydigan interfeys.',
    tone: 'service-card-gold',
  },
];

const playSmsTone = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.4);
  } catch {
    // Audio context not allowed or unsupported
  }
};

function App() {
  const [role, setRole] = useState(() => localStorage.getItem('myweb-role') || 'people');
  const [currentPage, setCurrentPage] = useState('home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [friends, setFriends] = useState([]);
  const [acquaintances, setAcquaintances] = useState([]);
  const [friendForm, setFriendForm] = useState({ name: '', relation: 'Do’st', note: '' });

  const getInitialInstagram = () => {
    try {
      if (typeof window !== 'undefined' && window.location?.search) {
        const searchParams = new URLSearchParams(window.location.search);
        const igParam = searchParams.get('ig') || searchParams.get('instagram') || searchParams.get('user');
        if (igParam) {
          const clean = igParam.replace(/^@/, '').trim();
          if (clean) {
            localStorage.setItem('myweb-user-instagram', clean);
            return clean;
          }
        }
      }
    } catch {
      // ignore
    }
    return localStorage.getItem('myweb-user-instagram') || '';
  };

  const [acquaintanceForm, setAcquaintanceForm] = useState(() => ({
    firstName: localStorage.getItem('myweb-user-firstname') || '',
    lastName: localStorage.getItem('myweb-user-lastname') || '',
    age: localStorage.getItem('myweb-user-age') || '',
    phone: localStorage.getItem('myweb-user-phone') || '',
    instagram: getInitialInstagram(),
  }));

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [acquaintanceError, setAcquaintanceError] = useState('');
  const [showAcquaintanceSuccess, setShowAcquaintanceSuccess] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [visitorStats, setVisitorStats] = useState([]);

  const [reviewForm, setReviewForm] = useState(() => {
    const fName = localStorage.getItem('myweb-user-firstname') || '';
    const lName = localStorage.getItem('myweb-user-lastname') || '';
    const fullName = [fName, lName].filter(Boolean).join(' ');
    return {
      name: localStorage.getItem('myweb-user-name') || fullName || '',
      instagram: getInitialInstagram(),
      rating: 0,
      comment: '',
    };
  });

  const [reviewError, setReviewError] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingFriendId, setEditingFriendId] = useState(null);
  const [friendDraft, setFriendDraft] = useState({ name: '', relation: 'Do’st', note: '' });
  const [editingAcquaintanceId, setEditingAcquaintanceId] = useState(null);
  const [acquaintanceDraft, setAcquaintanceDraft] = useState({
    firstName: '',
    lastName: '',
    age: '',
    phone: '',
    instagram: '',
  });

  const [showSmsModal, setShowSmsModal] = useState(false);
  const [showChatJoin, setShowChatJoin] = useState(false);
  const [isVideoChatOpen, setIsVideoChatOpen] = useState(false);
  const [chatJoinForm, setChatJoinForm] = useState(() => ({
    instagram: localStorage.getItem('myweb-chat-instagram') || localStorage.getItem('myweb-user-instagram') || '',
    phone: localStorage.getItem('myweb-chat-phone') || '',
  }));
  const [chatDraft, setChatDraft] = useState('');
  const [globalChatMessages, setGlobalChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatConnectionStatus, setChatConnectionStatus] = useState('CONNECTING');
  const [chatOnlineUsers, setChatOnlineUsers] = useState([]);
  const [chatTypingUsers, setChatTypingUsers] = useState([]);
  const [chatSessionId] = useState(() => {
    const storedSessionId = localStorage.getItem('myweb-chat-session-id');
    if (storedSessionId) return storedSessionId;
    const sessionId = window.crypto?.randomUUID?.() || `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('myweb-chat-session-id', sessionId);
    return sessionId;
  });
  const globalChatEndRef = useRef(null);
  const chatPresenceRef = useRef(null);
  const chatTypingTimerRef = useRef(null);
  const remoteTypingTimersRef = useRef(new Map());
  const sendingChatMessageRef = useRef(false);
  const [newSmsNotification, setNewSmsNotification] = useState(null);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [approvedUserNotice, setApprovedUserNotice] = useState(null);
  const [mySentRequest, setMySentRequest] = useState(() => {
    try {
      const saved = localStorage.getItem('myweb-sent-acquaintance');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isMyRequestApproved, setIsMyRequestApproved] = useState(false);
  const knownPendingIdsRef = useRef(new Set());

  const pendingAcquaintances = acquaintances.filter((item) => item.status === 'pending');
  const approvedAcquaintances = acquaintances.filter((item) => item.status === 'approved');

  const loadGlobalChatMessages = async () => {
    const currentInstagram = (chatJoinForm.instagram || localStorage.getItem('myweb-chat-instagram') || '').replace(/^@/, '').trim().toLowerCase();

    setChatLoading(true);
    setChatError('');
    try {
      const messages = await getGlobalChatMessages();
      if (Array.isArray(messages)) {
        const mapped = messages.reverse().map((message) => {
          const senderInstagram = (message.instagram || message.sender || '').replace(/^@/, '').trim().toLowerCase();
          return {
            id: message.id,
            sender: message.sender || 'Guest',
            text: message.message || '',
            mine: senderInstagram === currentInstagram,
            time: new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: message.created_at,
            instagram: message.instagram || '',
            phone: message.phone || '',
          };
        });

        setGlobalChatMessages(mapped);
        return;
      }
    } catch (error) {
      console.error('Chat load failed:', error);
      if (error?.code === 'PGRST205' || error?.message?.includes("Could not find the table 'public.chat_messages'")) {
        setChatError('Chat jadvali Supabase’da topilmadi. Supabase SQL Editor’da supabase/schema.sql faylini ishga tushiring.');
      } else {
        setChatError('Xabarlarni yuklab bo‘lmadi. Supabase ulanish sozlamalarini tekshirib, qayta urinib ko‘ring.');
      }
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!showSmsModal) return undefined;
    void loadGlobalChatMessages();
    const cleanup = subscribeToGlobalChatMessages(() => {
      void loadGlobalChatMessages();
    });

    return () => cleanup();
  }, [showSmsModal, chatJoinForm.instagram]);

  useEffect(() => {
    if (!showSmsModal) return undefined;
    const instagram = (chatJoinForm.instagram || localStorage.getItem('myweb-chat-instagram') || '').replace(/^@/, '').trim();
    if (!instagram) return undefined;

    setChatConnectionStatus('CONNECTING');
    const presence = joinGlobalChatPresence({
      instagram,
      sessionId: chatSessionId,
      onPresence: (users) => setChatOnlineUsers(users),
      onTyping: ({ instagram: typingInstagram, sessionId, typing }) => {
        if (!sessionId) return;
        const username = (typingInstagram || '').trim();
        if (typing) {
          setChatTypingUsers((users) => [
            ...users.filter((user) => user.sessionId !== sessionId),
            { sessionId, instagram: username },
          ]);
          const previousTimer = remoteTypingTimersRef.current.get(sessionId);
          if (previousTimer) window.clearTimeout(previousTimer);
          remoteTypingTimersRef.current.set(sessionId, window.setTimeout(() => {
            setChatTypingUsers((users) => users.filter((user) => user.sessionId !== sessionId));
            remoteTypingTimersRef.current.delete(sessionId);
          }, 2500));
        } else {
          const previousTimer = remoteTypingTimersRef.current.get(sessionId);
          if (previousTimer) window.clearTimeout(previousTimer);
          remoteTypingTimersRef.current.delete(sessionId);
          setChatTypingUsers((users) => users.filter((user) => user.sessionId !== sessionId));
        }
      },
      onStatus: setChatConnectionStatus,
    });
    chatPresenceRef.current = presence;

    return () => {
      chatPresenceRef.current = null;
      setChatConnectionStatus('CLOSED');
      if (chatTypingTimerRef.current) window.clearTimeout(chatTypingTimerRef.current);
      remoteTypingTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      remoteTypingTimersRef.current.clear();
      setChatTypingUsers([]);
      void presence.unsubscribe();
    };
  }, [showSmsModal, chatJoinForm.instagram, chatSessionId]);

  useEffect(() => {
    globalChatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [globalChatMessages, chatTypingUsers]);

  const openChatModal = () => {
    setIsVideoChatOpen(false);
    const savedInstagram = localStorage.getItem('myweb-chat-instagram') || localStorage.getItem('myweb-user-instagram');

    if (savedInstagram?.trim()) {
      setChatJoinForm((previous) => ({ ...previous, instagram: savedInstagram.replace(/^@/, '').trim() }));
      setShowSmsModal(true);
      return;
    }

    setShowChatJoin(true);
  };

  const handleChatJoinSubmit = (event) => {
    event.preventDefault();

    const instagram = chatJoinForm.instagram.trim().replace(/^@/, '');
    const phone = chatJoinForm.phone.trim();

    if (!instagram) {
      return;
    }

    localStorage.setItem('myweb-chat-instagram', instagram);
    if (phone) localStorage.setItem('myweb-chat-phone', phone);
    else localStorage.removeItem('myweb-chat-phone');
    setShowChatJoin(false);
    setShowSmsModal(true);
  };

  const sendLiveChatMessage = async () => {
    if (!chatDraft.trim() || sendingChatMessageRef.current) return;

    const trimmed = chatDraft.trim();
    const currentInstagram = (chatJoinForm.instagram || localStorage.getItem('myweb-chat-instagram') || '').replace(/^@/, '').trim();
    const currentUserName = currentInstagram || profile?.name || 'Siz';

    sendingChatMessageRef.current = true;
    setChatSending(true);
    setChatError('');
    try {
      const savedMessage = await createGlobalChatMessage({
        sender: currentUserName,
        instagram: currentInstagram,
        message: trimmed,
      });

      const message = {
        id: savedMessage?.id ?? `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sender: savedMessage?.sender || currentUserName,
        text: savedMessage?.message || trimmed,
        mine: true,
        time: new Date(savedMessage?.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: savedMessage?.created_at || new Date().toISOString(),
      };

      setGlobalChatMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
      setChatDraft('');
      broadcastChatTyping(false);
    } catch (error) {
      console.error('Chat send failed:', error);
      setChatError('Xabar yuborilmadi. Qayta urinib ko‘ring.');
    } finally {
      sendingChatMessageRef.current = false;
      setChatSending(false);
    }
  };

  const broadcastChatTyping = (typing) => {
    const pending = chatPresenceRef.current?.sendTyping(typing);
    pending?.catch((error) => console.error('Chat typing update failed:', error));
  };

  const loadAppData = async () => {
    try {
      const [profileData, friendsData, pendingData, approvedData, reviewsData, visitorStatsData] = await Promise.all([
        getProfile(),
        getFriends(),
        getPendingAcquaintances(),
        getApprovedAcquaintances(),
        getReviews(),
        isAdminLoggedIn ? getMonthlyVisitorStats() : Promise.resolve([]),
      ]);

      const allAcquaintances = [...(Array.isArray(pendingData) ? pendingData : []), ...(Array.isArray(approvedData) ? approvedData : [])];

      setProfile(profileData || initialProfile);
      setFriends(Array.isArray(friendsData) ? friendsData : []);
      setAcquaintances(allAcquaintances);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setVisitorStats(Array.isArray(visitorStatsData) ? visitorStatsData : []);
    } catch (error) {
      console.error('Failed to load app data:', error);
      setProfile(initialProfile);
      setFriends([]);
      setAcquaintances([]);
      setReviews([]);
      setVisitorStats([]);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('acquaintances-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acquaintances' }, () => {
        void loadAppData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdminLoggedIn]);

  useEffect(() => {
    const checkPendingRequests = async () => {
      try {
        const freshPending = await getPendingAcquaintances();
        if (Array.isArray(freshPending)) {
          const known = knownPendingIdsRef.current;
          const newlyAdded = freshPending.filter((item) => !known.has(item.id));

          if (newlyAdded.length > 0) {
            const latest = newlyAdded[0];
            const parsed = parseAcquaintance(latest);
            playSmsTone();
            setNewSmsNotification({
              id: latest.id,
              sender: `${latest.firstName} ${latest.lastName}`,
              instagram: parsed.instagram,
              phone: parsed.cleanPhone,
              age: latest.age,
            });
          }

          freshPending.forEach((item) => known.add(item.id));

          setAcquaintances((prev) => {
            const approved = prev.filter((p) => p.status === 'approved');
            return [...freshPending, ...approved];
          });
        }
      } catch (err) {
        console.error('SMS polling error:', err);
      }
    };

    void checkPendingRequests();
    const interval = setInterval(checkPendingRequests, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (acquaintances.length === 0) return undefined;

    const saved = localStorage.getItem('myweb-sent-acquaintance');
    const seenDismissed = localStorage.getItem('myweb-request-approved-seen');
    let noticeTimer;

    if (saved) {
      try {
        const myReq = JSON.parse(saved);
        setMySentRequest(myReq);

        const found = approvedAcquaintances.find((item) => {
          const parsed = parseAcquaintance(item);
          const itemCleanPhone = (parsed.cleanPhone || '').replace(/\D/g, '');
          const myCleanPhone = (myReq.cleanPhone || myReq.phone || '').replace(/\D/g, '');

          if (itemCleanPhone && myCleanPhone && itemCleanPhone === myCleanPhone) return true;
          if (parsed.instagram && myReq.instagram && parsed.instagram.toLowerCase() === myReq.instagram.toLowerCase()) {
            return true;
          }
          if (
            item.firstName?.trim().toLowerCase() === myReq.firstName?.trim().toLowerCase() &&
            item.lastName?.trim().toLowerCase() === myReq.lastName?.trim().toLowerCase()
          ) {
            return true;
          }
          return false;
        });

        if (found) {
          setIsMyRequestApproved(true);
          if (!seenDismissed) {
            noticeTimer = window.setTimeout(() => {
              setApprovedUserNotice(found);
              setShowApprovedModal(true);
            }, 2000);
          }
        }
      } catch (e) {
        console.error('Approved check error:', e);
      }
    }

    return () => window.clearTimeout(noticeTimer);
  }, [acquaintances]);

  useEffect(() => {
    if (role !== 'people') return;

    const today = new Date().toISOString().slice(0, 10);
    let visitorId = localStorage.getItem('myweb-visitor-id');

    if (!visitorId) {
      visitorId = window.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('myweb-visitor-id', visitorId);
    }

    if (localStorage.getItem('myweb-last-visit') === today) return;

    void recordVisitor(visitorId)
      .then(() => localStorage.setItem('myweb-last-visit', today))
      .catch((error) => console.error('Visitor tracking failed:', error));
  }, [role]);

  useEffect(() => {
    localStorage.setItem('myweb-role', role);
  }, [role]);

  useEffect(() => {
    void loadAppData();
  }, [isAdminLoggedIn]);

  useEffect(() => {
    if (!isSidebarOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const handleAdminButtonClick = () => {
    setIsSidebarOpen(false);

    if (isAdminLoggedIn) {
      setRole('super-admin');
      setShowLogin(false);
      return;
    }

    setShowLogin(true);
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    try {
      const user = await loginAdmin(loginData.username.trim(), loginData.password.trim());

      if (!user) {
        setLoginError('Login yoki parol noto‘g‘ri.');
        return;
      }

      setIsAdminLoggedIn(true);
      setRole('super-admin');
      setShowLogin(false);
      setLoginError('');
      setLoginData({ username: '', password: '' });
    } catch (error) {
      setLoginError(error.message || 'Login yoki parol noto‘g‘ri.');
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewError('');

    if (!reviewForm.rating || !reviewForm.comment.trim()) {
      setReviewError('Yulduzli baho va izoh qoldiring.');
      return;
    }

    if (!reviewForm.name.trim()) {
      setReviewError('Ismingizni kiriting.');
      return;
    }

    const cleanInstagram = (reviewForm.instagram || '').replace(/^@/, '').trim();
    const displayName = cleanInstagram
      ? `${reviewForm.name.trim()} (@${cleanInstagram})`
      : reviewForm.name.trim();

    try {
      await createReview({
        name: displayName,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });

      if (cleanInstagram) {
        localStorage.setItem('myweb-user-instagram', cleanInstagram);
        setAcquaintanceForm((prev) => ({ ...prev, instagram: cleanInstagram }));
      }
      localStorage.setItem('myweb-user-name', reviewForm.name.trim());

      setReviewForm((prev) => ({ ...prev, rating: 0, comment: '' }));
      setShowAlert(false);

      const reviewsData = await getReviews();
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      setReviewError(error.message || 'Izohni yuborib bo‘lmadi.');
    }
  };

  const removeReview = async (id) => {
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((review) => review.id !== id));
    } catch (error) {
      console.error('Review delete failed:', error);
    }
  };

  const addFriend = async (event) => {
    event.preventDefault();
    if (!friendForm.name.trim()) return;

    try {
      const newFriend = await createSupabaseFriend({
        name: friendForm.name.trim(),
        relation: friendForm.relation || 'Do’st',
        note: friendForm.note.trim() || 'Yangi qo’shilgan do’st.',
      });

      setFriends((prev) => [newFriend, ...prev]);
      setFriendForm({ name: '', relation: 'Do’st', note: '' });
    } catch (error) {
      console.error('Friend create failed:', error);
    }
  };

  const handleFriendUpdate = async (id, values) => {
    try {
      const updated = await updateSupabaseFriend(id, values);
      setFriends((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (error) {
      console.error('Friend update failed:', error);
    }
  };

  const removeFriend = async (id) => {
    try {
      await deleteSupabaseFriend(id);
      setFriends((prev) => prev.filter((item) => item.id !== id));
      if (editingFriendId === id) {
        setEditingFriendId(null);
      }
    } catch (error) {
      console.error('Friend delete failed:', error);
    }
  };

  const addAcquaintance = async (event) => {
    event.preventDefault();
    if (!acquaintanceForm.firstName || !acquaintanceForm.lastName || !acquaintanceForm.phone) return;
    setAcquaintanceError('');

    const cleanInstagram = (acquaintanceForm.instagram || '').replace(/^@/, '').trim();
    const phoneVal = acquaintanceForm.phone.trim();
    const combinedPhone = cleanInstagram ? `${phoneVal} | @${cleanInstagram}` : phoneVal;

    try {
      await createSupabaseAcquaintance({
        firstName: acquaintanceForm.firstName.trim(),
        lastName: acquaintanceForm.lastName.trim(),
        age: Number(acquaintanceForm.age || 0),
        phone: combinedPhone,
        status: 'pending',
      });

      const sentReq = {
        firstName: acquaintanceForm.firstName.trim(),
        lastName: acquaintanceForm.lastName.trim(),
        phone: phoneVal,
        cleanPhone: phoneVal.replace(/\D/g, ''),
        instagram: cleanInstagram,
        age: acquaintanceForm.age,
        submittedAt: new Date().toISOString(),
      };

      localStorage.setItem('myweb-sent-acquaintance', JSON.stringify(sentReq));
      localStorage.removeItem('myweb-request-approved-seen');
      setMySentRequest(sentReq);
      setIsMyRequestApproved(false);

      if (cleanInstagram) {
        localStorage.setItem('myweb-user-instagram', cleanInstagram);
        setReviewForm((prev) => ({ ...prev, instagram: cleanInstagram }));
      }
      localStorage.setItem('myweb-user-firstname', acquaintanceForm.firstName.trim());
      localStorage.setItem('myweb-user-lastname', acquaintanceForm.lastName.trim());
      localStorage.setItem('myweb-user-phone', phoneVal);
      if (acquaintanceForm.age) localStorage.setItem('myweb-user-age', acquaintanceForm.age);

      setShowAcquaintanceSuccess(true);
    } catch (error) {
      console.error('Acquaintance create failed:', error);
      setAcquaintanceError(error.message || 'So‘rov yuborilmadi.');
    }
  };

  const approveOneAcquaintance = async (id) => {
    try {
      const updated = await approveSupabaseAcquaintance(id);
      setAcquaintances((prev) => prev.map((item) => (item.id === id ? updated : item)));
      if (newSmsNotification && newSmsNotification.id === id) {
        setNewSmsNotification(null);
      }
    } catch (error) {
      console.error('Acquaintance approve failed:', error);
    }
  };

  const addAcquaintanceAsFriend = async (item) => {
    const parsed = parseAcquaintance(item);
    try {
      const newFriend = await createSupabaseFriend({
        name: `${item.firstName} ${item.lastName}`.trim(),
        relation: 'Do’st',
        note: parsed.cleanPhone ? `Telefon: ${parsed.cleanPhone}${parsed.instagram ? ` • IG: @${parsed.instagram}` : ''}` : 'Yangi qo’shilgan do’st.',
      });

      await deleteSupabaseAcquaintance(item.id);
      setFriends((prev) => [newFriend, ...prev]);
      setAcquaintances((prev) => prev.filter((acquaintance) => acquaintance.id !== item.id));
    } catch (error) {
      console.error('Acquaintance to friend conversion failed:', error);
    }
  };

  const updateOneAcquaintance = async (id, values) => {
    try {
      const updated = await updateSupabaseAcquaintance(id, values);
      setAcquaintances((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (error) {
      console.error('Acquaintance update failed:', error);
    }
  };

  const removeAcquaintance = async (id) => {
    try {
      await deleteSupabaseAcquaintance(id);
      setAcquaintances((prev) => prev.filter((item) => item.id !== id));
      if (editingAcquaintanceId === id) {
        setEditingAcquaintanceId(null);
      }
      if (newSmsNotification && newSmsNotification.id === id) {
        setNewSmsNotification(null);
      }
    } catch (error) {
      console.error('Acquaintance delete failed:', error);
    }
  };

  const startEditingFriend = (friend) => {
    setEditingFriendId(friend.id);
    setFriendDraft({
      name: friend.name,
      relation: friend.relation,
      note: friend.note,
    });
  };

  const saveFriendEdit = (id) => {
    handleFriendUpdate(id, {
      name: friendDraft.name.trim() || 'Do’st',
      relation: friendDraft.relation,
      note: friendDraft.note.trim() || 'Tahrirlandi.',
    });
    setEditingFriendId(null);
  };

  const startEditingAcquaintance = (item) => {
    const parsed = parseAcquaintance(item);
    setEditingAcquaintanceId(item.id);
    setAcquaintanceDraft({
      firstName: item.firstName,
      lastName: item.lastName,
      age: String(item.age || ''),
      phone: parsed.cleanPhone,
      instagram: parsed.instagram,
    });
  };

  const saveAcquaintanceEdit = (id) => {
    const cleanIg = (acquaintanceDraft.instagram || '').replace(/^@/, '').trim();
    const phoneVal = acquaintanceDraft.phone.trim();
    const combinedPhone = cleanIg ? `${phoneVal} | @${cleanIg}` : phoneVal;

    updateOneAcquaintance(id, {
      firstName: acquaintanceDraft.firstName.trim() || 'Tanish',
      lastName: acquaintanceDraft.lastName.trim() || 'Foydalanuvchi',
      age: Number(acquaintanceDraft.age || 0),
      phone: combinedPhone,
    });
    setEditingAcquaintanceId(null);
  };

  const isAdminDashboard = role === 'super-admin';

  const handlePageClick = (pageName) => {
    setCurrentPage(pageName);
    setIsSidebarOpen(false);
  };

  const renderPublicPage = () => {
    switch (currentPage) {
      case 'projects':
        return <ProjectsPage projects={projects} profile={profile} />;
      case 'services':
        return <ServicesPage services={services} reviews={reviews} openReviewModal={() => setShowAlert(true)} />;
      case 'friends':
        return (
          <FriendsPage
            friends={friends}
            approvedAcquaintances={approvedAcquaintances}
            parseAcquaintance={parseAcquaintance}
            acquaintanceForm={acquaintanceForm}
            setAcquaintanceForm={setAcquaintanceForm}
            addAcquaintance={addAcquaintance}
            acquaintanceError={acquaintanceError}
            isMyRequestApproved={isMyRequestApproved}
            mySentRequest={mySentRequest}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            setShowAlert={setShowAlert}
          />
        );
      case 'contact':
        return (
          <ContactPage
            profile={profile}
            acquaintanceForm={acquaintanceForm}
            setAcquaintanceForm={setAcquaintanceForm}
            addAcquaintance={addAcquaintance}
            acquaintanceError={acquaintanceError}
            isMyRequestApproved={isMyRequestApproved}
            mySentRequest={mySentRequest}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            setShowAlert={setShowAlert}
          />
        );
      default:
        return (
          <HomePage
            profile={profile}
            friends={friends}
            approvedAcquaintances={approvedAcquaintances}
            parseAcquaintance={parseAcquaintance}
            onOpenAcquaintanceForm={() => setCurrentPage('contact')}
          />
        );
    }
  };

  return (
    <div
      className="myweb-app"
      style={{
        '--ink': brand.colors.ink,
        '--forest': brand.colors.forest,
        '--forest-dark': brand.colors.forestDark,
        '--leaf': brand.colors.leaf,
        '--gold': brand.colors.gold,
        '--gold-dark': brand.colors.goldDark,
        '--paper': brand.colors.paper,
        '--paper-muted': brand.colors.paperMuted,
        '--line': brand.colors.line,
        '--text': brand.colors.text,
        '--muted': brand.colors.muted,
        '--danger': brand.colors.danger,
      }}
    >
      {!isAdminDashboard && (
        <>
          <header className="topbar">
            <div className="brand-wrap">
              <img className="brand-logo" src="/favicon.svg" alt="MyWeb logo" />
              <span>{brand.name}</span>
            </div>

            <nav className="nav">
              <a href="#home" onClick={(event) => { event.preventDefault(); handlePageClick('home'); }}>Bosh sahifa</a>
              <a href="#projects" onClick={(event) => { event.preventDefault(); handlePageClick('projects'); }}>Loyihalar</a>
              <a href="#services" onClick={(event) => { event.preventDefault(); handlePageClick('services'); }}>Xizmatlar</a>
              <a href="#friends" onClick={(event) => { event.preventDefault(); handlePageClick('friends'); }}>Dostlar</a>
              <a href="#contact" onClick={(event) => { event.preventDefault(); handlePageClick('contact'); }}>Bog’lanish</a>
            </nav>

            <div className="topbar-actions">
              <button
                type="button"
                className="sms-toggle-btn"
                title="Chat qutisi"
                aria-label="Chat qutisi"
                onClick={openChatModal}
              >
                <span className="sms-icon" aria-hidden="true">💬</span>
                <span className="sms-btn-label">Chat</span>
                {pendingAcquaintances.length > 0 && (
                  <span className="sms-badge-count">{pendingAcquaintances.length}</span>
                )}
              </button>

              <button
                type="button"
                className="menu-toggle"
                aria-label="Menyuni ochish"
                aria-expanded={isSidebarOpen}
                onClick={() => setIsSidebarOpen(true)}
              >
                <span />
                <span />
                <span />
              </button>

              <button type="button" className="role-toggle" onClick={handleAdminButtonClick}>
                {isAdminLoggedIn ? 'Super admin' : 'Login'}
              </button>
            </div>
          </header>

          <div
            className={`sidebar-backdrop${isSidebarOpen ? ' is-visible' : ''}`}
            aria-hidden="true"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className={`sidebar${isSidebarOpen ? ' is-open' : ''}`} aria-label="Asosiy menyu">
            <div className="sidebar-header">
              <span className="section-label">Menyu</span>
              <button type="button" className="sidebar-close" aria-label="Menyuni yopish" onClick={() => setIsSidebarOpen(false)}>
                ×
              </button>
            </div>
            <nav className="sidebar-nav">
              <a href="#home" onClick={(event) => { event.preventDefault(); handlePageClick('home'); }}>Bosh sahifa</a>
              <a href="#projects" onClick={(event) => { event.preventDefault(); handlePageClick('projects'); }}>Loyihalar</a>
              <a href="#services" onClick={(event) => { event.preventDefault(); handlePageClick('services'); }}>Xizmatlar</a>
              <a href="#friends" onClick={(event) => { event.preventDefault(); handlePageClick('friends'); }}>Dostlar</a>
              <a href="#contact" onClick={(event) => { event.preventDefault(); handlePageClick('contact'); }}>Bog’lanish</a>
            </nav>

            <div className="sidebar-bottom-actions">
              <button
                type="button"
                className="sms-toggle-btn sidebar-sms-btn"
                onClick={() => {
                  setIsSidebarOpen(false);
                  openChatModal();
                }}
              >
                <span className="sms-icon" aria-hidden="true">💬</span>
                <span>Chat qutisi</span>
                {pendingAcquaintances.length > 0 && (
                  <span className="sms-badge-count">{pendingAcquaintances.length}</span>
                )}
              </button>

              <button type="button" className="role-toggle sidebar-login" onClick={handleAdminButtonClick}>
                {isAdminLoggedIn ? 'Super admin' : 'Login'}
              </button>
            </div>
          </aside>
        </>
      )}

      {role === 'people' ? (
        <main>{renderPublicPage()}</main>
      ) : (
        <AdminPage
          visitorStats={visitorStats}
          addFriend={addFriend}
          friendForm={friendForm}
          setFriendForm={setFriendForm}
          pendingAcquaintances={pendingAcquaintances}
          approveOneAcquaintance={approveOneAcquaintance}
          addAcquaintanceAsFriend={addAcquaintanceAsFriend}
          removeAcquaintance={removeAcquaintance}
          reviews={reviews}
          removeReview={removeReview}
          approvedAcquaintances={approvedAcquaintances}
          parseAcquaintance={parseAcquaintance}
          editingAcquaintanceId={editingAcquaintanceId}
          setEditingAcquaintanceId={setEditingAcquaintanceId}
          acquaintanceDraft={acquaintanceDraft}
          setAcquaintanceDraft={setAcquaintanceDraft}
          saveAcquaintanceEdit={saveAcquaintanceEdit}
          startEditingAcquaintance={startEditingAcquaintance}
          editingFriendId={editingFriendId}
          setEditingFriendId={setEditingFriendId}
          friendDraft={friendDraft}
          setFriendDraft={setFriendDraft}
          saveFriendEdit={saveFriendEdit}
          startEditingFriend={startEditingFriend}
          removeFriend={removeFriend}
          friends={friends}
          setShowSmsModal={setShowSmsModal}
          logoutAdmin={logoutAdmin}
          setRole={setRole}
          setIsAdminLoggedIn={setIsAdminLoggedIn}
          setShowLogin={setShowLogin}
        />
      )}

      {!isAdminDashboard && (
        <button type="button" className="feedback-trigger" onClick={() => setShowAlert(true)}>
          <span className="feedback-icon" aria-hidden="true">★</span>
          <span>MyWeb ni baholang</span>
        </button>
      )}

      {showAcquaintanceSuccess && (
        <div className="success-toast" role="status">
          <div className="success-toast-icon" aria-hidden="true">✓</div>
          <div className="success-toast-content">
            <strong>So‘rovingiz uchun rahmat!</strong>
            <p>Ma’lumotlaringiz yuborildi. Tasdiqlangach, tanishlar ro‘yxatida ko‘rinadi.</p>
          </div>
          <button
            type="button"
            className="success-toast-close"
            aria-label="Xabarni yopish"
            onClick={() => setShowAcquaintanceSuccess(false)}
          >
            ×
          </button>
        </div>
      )}

      {showAlert && (
        <div className="login-backdrop" onClick={() => setShowAlert(false)}>
          <form className="review-modal" onSubmit={handleReviewSubmit} onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-btn login-close" onClick={() => setShowAlert(false)}>
              ×
            </button>
            <p className="section-label">MyWeb</p>
            <h2>Baholang</h2>
            <div className="field-row two-cols">
              <label>
                Ismingiz
                <input
                  type="text"
                  value={reviewForm.name}
                  onChange={(event) => {
                    const val = event.target.value;
                    setReviewForm((prev) => ({ ...prev, name: val }));
                    localStorage.setItem('myweb-user-name', val);
                  }}
                  placeholder="Ismingizni kiriting"
                  maxLength="80"
                  required
                />
              </label>
              <label>
                Instagram (avtomatik)
                <div className="input-with-prefix">
                  <span className="input-prefix" aria-hidden="true">@</span>
                  <input
                    type="text"
                    value={reviewForm.instagram}
                    onChange={(event) => {
                      const clean = event.target.value.replace(/^@/, '').trim();
                      setReviewForm((prev) => ({ ...prev, instagram: clean }));
                      localStorage.setItem('myweb-user-instagram', clean);
                      setAcquaintanceForm((prev) => ({ ...prev, instagram: clean }));
                    }}
                    placeholder="username"
                  />
                </div>
              </label>
            </div>
            <div className="rating-input" role="radiogroup" aria-label="Yulduzli baho">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={rating <= reviewForm.rating ? 'selected' : ''}
                  aria-label={`${rating} yulduz`}
                  aria-checked={rating === reviewForm.rating}
                  role="radio"
                  onClick={() => setReviewForm((prev) => ({ ...prev, rating }))}
                >
                  ★
                </button>
              ))}
            </div>
            <label>
              Izoh
              <textarea
                value={reviewForm.comment}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                placeholder="Izohingizni yozing..."
                rows="4"
                required
              />
            </label>
            {reviewError && <p className="login-error">Xato: {reviewError}</p>}
            <button type="submit" className="primary-btn wide-btn login-submit">
              Izohni yuborish
            </button>
          </form>
        </div>
      )}

      {showLogin && (
        <div className="login-backdrop" onClick={() => setShowLogin(false)}>
          <form className="login-card" onSubmit={handleLoginSubmit} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="close-btn login-close" onClick={() => setShowLogin(false)}>
              ×
            </button>
            <div className="login-mark">MW</div>
            <p className="section-label">Super admin</p>
            <h2>Login</h2>
            <label>
              Login
              <input
                type="text"
                value={loginData.username}
                onChange={(event) => setLoginData((prev) => ({ ...prev, username: event.target.value }))}
                placeholder="Loginni kiriting"
                autoComplete="username"
                autoFocus
                required
              />
            </label>
            <label>
              Parol
              <input
                type="password"
                value={loginData.password}
                onChange={(event) => setLoginData((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Parolni kiriting"
                autoComplete="current-password"
                required
              />
            </label>
            {loginError && <p className="login-error">{loginError}</p>}
            <button type="submit" className="primary-btn wide-btn login-submit">
              Admin panelga kirish
            </button>
          </form>
        </div>
      )}

      {newSmsNotification && (
        <aside className="sms-incoming-banner" role="alert">
          <div className="sms-banner-header">
            <span className="sms-banner-icon" aria-hidden="true">💬</span>
            <span className="sms-banner-title">Yangi chat xabari (Tanishuv)</span>
            <button type="button" className="sms-banner-close" aria-label="Yopish" onClick={() => setNewSmsNotification(null)}>
              ×
            </button>
          </div>
          <div className="sms-banner-body">
            <p>
              <strong>{newSmsNotification.sender}</strong>
              {newSmsNotification.instagram && (
                <span className="sms-banner-ig"> (@{newSmsNotification.instagram})</span>
              )}{' '}
              siz bilan tanishmoqchi!
            </p>
            <div className="sms-banner-meta">
              <span>📞 {newSmsNotification.phone}</span>
              {newSmsNotification.age ? <span> • {newSmsNotification.age} yosh</span> : null}
            </div>
          </div>
          <div className="sms-banner-actions">
            {newSmsNotification.id && (
              <button
                type="button"
                className="sms-banner-btn-approve"
                onClick={() => {
                  void approveOneAcquaintance(newSmsNotification.id);
                  setNewSmsNotification(null);
                }}
              >
                Tasdiqlash ✓
              </button>
            )}
            <button
              type="button"
              className="sms-banner-btn-open"
              onClick={() => {
                setNewSmsNotification(null);
                openChatModal();
              }}
            >
              Chatni ochish ↗
            </button>
          </div>
        </aside>
      )}

      {showChatJoin && (
        <div className="login-backdrop" onClick={() => setShowChatJoin(false)}>
          <form className="chat-join-card" onSubmit={handleChatJoinSubmit} onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-btn login-close" onClick={() => setShowChatJoin(false)}>
              ×
            </button>
            <p className="section-label">Live chat</p>
            <h2>Chatga kirish</h2>
            <p className="chat-join-description">Umumiy suhbatga qo‘shilish uchun Instagram nomingizni kiriting.</p>
            <label>
              Instagram username
              <input
                type="text"
                value={chatJoinForm.instagram}
                onChange={(event) => setChatJoinForm((prev) => ({ ...prev, instagram: event.target.value }))}
                placeholder="@username"
                autoFocus
                required
                maxLength={30}
              />
            </label>
            <label>
              Telefon raqam (ixtiyoriy)
              <input
                type="tel"
                value={chatJoinForm.phone}
                onChange={(event) => setChatJoinForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+998 xx xxx xx xx"
              />
            </label>
            <button type="submit" className="primary-btn wide-btn login-submit">
              Chatga kirish
            </button>
          </form>
        </div>
      )}

      {showSmsModal && (
        <div className="login-backdrop" onClick={() => setShowSmsModal(false)}>
          <div className="sms-inbox-modal telegram-chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sms-inbox-header chat-room-header">
              <div className="chat-room-avatar" aria-hidden="true">💬</div>
              <div className="sms-inbox-title-wrap chat-room-title">
                <h2>MyWeb chat</h2>
                <div className="chat-room-status">
                  <span className={`chat-connection-dot ${chatConnectionStatus === 'SUBSCRIBED' ? 'is-connected' : ''}`} />
                    <span>{chatConnectionStatus === 'SUBSCRIBED' ? 'Real-time ulangan' : 'Ulanmoqda...'}</span>
                  <span className="chat-status-divider">·</span>
                  <span>{chatOnlineUsers.length} online</span>
                </div>
              </div>
              <div className="chat-room-actions">
                <span className="chat-identity-chip" title="Chatdagi Instagram profilingiz">
                  @{(chatJoinForm.instagram || localStorage.getItem('myweb-chat-instagram') || localStorage.getItem('myweb-user-instagram') || 'guest').replace(/^@/, '')}
                </span>
              </div>
              <button type="button" className="close-btn" aria-label="Yopish" onClick={() => setShowSmsModal(false)}>
                ×
              </button>
            </div>

            <div className="chat-mode-tabs" role="tablist" aria-label="Chat turi">
              <button
                type="button"
                role="tab"
                aria-selected={!isVideoChatOpen}
                className={`chat-mode-tab${isVideoChatOpen ? '' : ' is-active'}`}
                onClick={() => setIsVideoChatOpen(false)}
              >
                💬 Matnli chat
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isVideoChatOpen}
                className={`chat-mode-tab${isVideoChatOpen ? ' is-active' : ''}`}
                onClick={() => setIsVideoChatOpen(true)}
              >
                🎥 Live chat
              </button>
            </div>

            {isVideoChatOpen ? (
              <LiveVideoRoom
                instagram={(chatJoinForm.instagram || localStorage.getItem('myweb-chat-instagram') || localStorage.getItem('myweb-user-instagram') || 'guest').replace(/^@/, '').trim()}
              />
            ) : (
            <div className="global-chat-wrap">
              <div className="global-chat-body" role="log" aria-live="polite" aria-label="Umumiy chat xabarlari">
                {chatLoading && globalChatMessages.length === 0 ? (
                  <div className="chat-state-card">
                    <span className="chat-loading-spinner" />
                    <p>Xabarlar yuklanmoqda...</p>
                  </div>
                ) : chatError && globalChatMessages.length === 0 ? (
                  <div className="chat-state-card">
                    <span className="chat-state-icon" aria-hidden="true">!</span>
                    <p>{chatError}</p>
                    <button type="button" onClick={() => void loadGlobalChatMessages()}>Qayta urinish</button>
                  </div>
                ) : globalChatMessages.length === 0 ? (
                  <div className="global-chat-empty">
                    <span className="chat-empty-icon" aria-hidden="true">✦</span>
                    <p>Hali suhbat boshlanmadi</p>
                    <span>Salom deb yozing — boshqalar ham shu yerda ko‘radi.</span>
                  </div>
                ) : (
                  globalChatMessages.map((message, index) => {
                    const messageDate = new Date(message.createdAt || Date.now());
                    const previousMessageDate = index > 0
                      ? new Date(globalChatMessages[index - 1].createdAt || Date.now())
                      : null;
                    const dayLabel = messageDate.toLocaleDateString([], {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    });
                    const showDayLabel = !previousMessageDate
                      || messageDate.toDateString() !== previousMessageDate.toDateString();

                    return (
                      <div key={message.id}>
                        {showDayLabel && <div className="chat-day-divider"><span>{dayLabel}</span></div>}
                        <div className={`global-chat-row ${message.mine ? 'mine' : ''}`}>
                          {!message.mine && (
                            <span className="chat-message-avatar" aria-hidden="true">
                              {(message.instagram || message.sender || '?').replace(/^@/, '').charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="global-chat-bubble">
                            <strong className="chat-message-sender">
                              {message.mine ? 'Siz' : `@${(message.instagram || message.sender || 'guest').replace(/^@/, '')}`}
                            </strong>
                            <p>{message.text}</p>
                            <span className="chat-message-time">
                              {message.time}
                              {message.mine && <span className="chat-message-check" aria-label="Yuborildi">✓✓</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {chatTypingUsers.length > 0 && (
                  <div className="chat-typing-row" aria-live="polite">
                    <span className="chat-typing-dots"><i /><i /><i /></span>
                    <span>
                      {chatTypingUsers.map((user) => `@${user.instagram || 'foydalanuvchi'}`).join(', ')}
                      {chatTypingUsers.length === 1 ? ' yozmoqda...' : ' yozishyapti...'}
                    </span>
                  </div>
                )}
                <div ref={globalChatEndRef} />
              </div>

              <div className="global-chat-input-row">
                <input
                  type="text"
                  value={chatDraft}
                  onChange={(event) => {
                    const value = event.target.value;
                    setChatDraft(value);
                    broadcastChatTyping(Boolean(value.trim()));
                    if (chatTypingTimerRef.current) window.clearTimeout(chatTypingTimerRef.current);
                    if (value.trim()) {
                      chatTypingTimerRef.current = window.setTimeout(() => {
                        broadcastChatTyping(false);
                      }, 2000);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void sendLiveChatMessage();
                    }
                  }}
                  placeholder="Xabaringizni yozing..."
                  aria-label="Xabar yozing"
                  maxLength={2000}
                />
                <button
                  type="button"
                  className="primary-btn chat-send-btn"
                  onClick={() => void sendLiveChatMessage()}
                  disabled={!chatDraft.trim() || chatSending}
                  aria-label={chatSending ? 'Xabar yuborilmoqda' : 'Xabar yuborish'}
                >
                  {chatSending ? 'Yuborilmoqda...' : 'Yuborish'}
                </button>
              </div>
              {chatError && globalChatMessages.length > 0 && <p className="chat-inline-error" role="alert">{chatError}</p>}
              <div className="chat-footer-note">Hurmat bilan yozing · xabarlar hammaga ko‘rinadi</div>
            </div>
            )}
          </div>
        </div>
      )}

      {showApprovedModal && (
        <div
          className="login-backdrop"
          onClick={() => {
            setShowApprovedModal(false);
            localStorage.setItem('myweb-request-approved-seen', 'true');
          }}
        >
          <div className="approved-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="approved-sparkle-icon" aria-hidden="true">🎉</div>
            <p className="section-label">Ajoyib xushxabar!</p>
            <h2>So‘rovingiz tasdiqlandi!</h2>
            <p className="approved-modal-text">
              Endi o‘zingizni Tanishlar bo‘limida ko‘rishingiz mumkin.
            </p>

            {approvedUserNotice && (
              <div className="approved-preview-chip">
                <div className="person-avatar">{approvedUserNotice.firstName?.charAt(0) || '✓'}</div>
                <div>
                  <strong>{approvedUserNotice.firstName} {approvedUserNotice.lastName}</strong>
                  <span className="role-tag approved-green-tag">Tasdiqlangan tanish ✓</span>
                </div>
              </div>
            )}

            <div className="approved-modal-buttons">
              <a
                href="#friends"
                className="primary-btn wide-btn"
                onClick={() => {
                  setShowApprovedModal(false);
                  localStorage.setItem('myweb-request-approved-seen', 'true');
                }}
              >
                Tanishlar ro‘yxatida ko‘rish →
              </a>
              <button
                type="button"
                className="secondary-btn wide-btn"
                onClick={() => {
                  setShowApprovedModal(false);
                  localStorage.setItem('myweb-request-approved-seen', 'true');
                }}
              >
                Rahmat, tushundim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
