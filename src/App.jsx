import { useEffect, useState } from 'react';
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
  getMonthlyVisitorStats,
  loginAdmin,
  createReview,
  recordVisitor,
  deleteReview,
  updateAcquaintance as updateSupabaseAcquaintance,
  updateFriend as updateSupabaseFriend,
  logoutAdmin,
} from './supabaseApi_fixed2';

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

function App() {
  const [role, setRole] = useState(() => localStorage.getItem('myweb-role') || 'people');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [friends, setFriends] = useState([]);
  const [acquaintances, setAcquaintances] = useState([]);
  const [friendForm, setFriendForm] = useState({ name: '', relation: 'Do’st', note: '' });
  const [acquaintanceForm, setAcquaintanceForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    phone: '',
  });
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [acquaintanceError, setAcquaintanceError] = useState('');
  const [showAcquaintanceSuccess, setShowAcquaintanceSuccess] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [visitorStats, setVisitorStats] = useState([]);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 0, comment: '' });
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
  });

  const loadAppData = async () => {
    try {
      const [profileData, friendsData, pendingData, approvedData, reviewsData, visitorStatsData] = await Promise.all([
        getProfile(),
        getFriends(),
        isAdminLoggedIn ? getPendingAcquaintances() : Promise.resolve([]),
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

  const pendingAcquaintances = acquaintances.filter((item) => item.status === 'pending');
  const approvedAcquaintances = acquaintances.filter((item) => item.status === 'approved');

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

    try {
      if (!reviewForm.name.trim()) {
        setReviewError('Ismingizni kiriting.');
        return;
      }

      await createReview({
        name: reviewForm.name.trim(),
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });
      setReviewForm({ name: '', rating: 0, comment: '' });
      setShowAlert(false);
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

    try {
      await createSupabaseAcquaintance({
        firstName: acquaintanceForm.firstName.trim(),
        lastName: acquaintanceForm.lastName.trim(),
        age: Number(acquaintanceForm.age || 0),
        phone: acquaintanceForm.phone.trim(),
        status: 'pending',
      });

      setAcquaintanceForm({ firstName: '', lastName: '', age: '', phone: '' });
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
    } catch (error) {
      console.error('Acquaintance approve failed:', error);
    }
  };

  const addAcquaintanceAsFriend = async (item) => {
    try {
      const newFriend = await createSupabaseFriend({
        name: `${item.firstName} ${item.lastName}`.trim(),
        relation: 'Do’st',
        note: item.phone ? `Telefon: ${item.phone}` : 'Yangi qo’shilgan do’st.',
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
    setEditingAcquaintanceId(item.id);
    setAcquaintanceDraft({
      firstName: item.firstName,
      lastName: item.lastName,
      age: String(item.age || ''),
      phone: item.phone,
    });
  };

  const saveAcquaintanceEdit = (id) => {
    updateOneAcquaintance(id, {
      firstName: acquaintanceDraft.firstName.trim() || 'Tanish',
      lastName: acquaintanceDraft.lastName.trim() || 'Foydalanuvchi',
      age: Number(acquaintanceDraft.age || 0),
      phone: acquaintanceDraft.phone.trim(),
    });
    setEditingAcquaintanceId(null);
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
      <header className="topbar">
        <div className="brand-wrap">
          <img className="brand-logo" src="/favicon.svg" alt="MyWeb logo" />
          <span>{brand.name}</span>
        </div>

        <nav className="nav">
          <a href="#home">Bosh sahifa</a>
          <a href="#about">Men haqimda</a>
          <a href="#projects">Loyihalar</a>
          <a href="#services">Xizmatlar</a>
          <a href="#interests">Qiziqishlar</a>
          <a href="#friends">Dostlar</a>
          <a href="#friends">Tanishlar</a>
          <a href="#donate">Donate</a>
          <a href="#contact">Bog’lanish</a>
        </nav>

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
      </header>

      <div
        className={`sidebar-backdrop${isSidebarOpen ? ' is-visible' : ''}`}
        aria-hidden="true"
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside className={`sidebar${isSidebarOpen ? ' is-open' : ''}`} aria-label="Asosiy menyu">
        <div className="sidebar-header">
          <span className="section-label">Menyu</span>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Menyuni yopish"
            onClick={() => setIsSidebarOpen(false)}
          >
            ×
          </button>
        </div>
        <nav className="sidebar-nav">
          <a href="#home" onClick={() => setIsSidebarOpen(false)}>Bosh sahifa</a>
          <a href="#about" onClick={() => setIsSidebarOpen(false)}>Men haqimda</a>
          <a href="#projects" onClick={() => setIsSidebarOpen(false)}>Loyihalar</a>
          <a href="#services" onClick={() => setIsSidebarOpen(false)}>Xizmatlar</a>
          <a href="#interests" onClick={() => setIsSidebarOpen(false)}>Qiziqishlar</a>
          <a href="#friends" onClick={() => setIsSidebarOpen(false)}>Dostlar</a>
          <a href="#friends" onClick={() => setIsSidebarOpen(false)}>Tanishlar</a>
          <a href="#donate" onClick={() => setIsSidebarOpen(false)}>Donate</a>
          <a href="#contact" onClick={() => setIsSidebarOpen(false)}>Bog’lanish</a>
        </nav>
        <button type="button" className="role-toggle sidebar-login" onClick={handleAdminButtonClick}>
          {isAdminLoggedIn ? 'Super admin' : 'Login'}
        </button>
      </aside>

      {role === 'people' ? (
        <main>
          <section id="home" className="hero">
            <div className="hero-copy">
              <p className="eyebrow">SALOM, MEN {profile.name.toUpperCase()} </p>
              <h1>
                Men {profile.title}
                <span>.</span>
              </h1>
              <p className="lead">{profile.bio}</p>

              <div className="hero-actions">
                <a href="#about" className="primary-btn">
                  Men haqimda
                </a>
                <a href="#contact" className="secondary-btn">
                  Bog’lanish
                </a>
                <a
                  href={profile.socialLinks.telegram}
                  className="telegram-btn"
                  target="_blank"
                  rel="noreferrer"
                >
                  Telegram orqali yozish <span aria-hidden="true">↗</span>
                </a>
                <a href="#contact" className="donate-btn">
                  Donate <span aria-hidden="true">↗</span>
                </a>
              </div>

              <div className="mini-meta">
                <span>{profile.city}</span>
                <span>{profile.course}</span>
              </div>
            </div>

            <div className="hero-card">
              <div className="avatar-box">{profile.name.charAt(0)}</div>
              <h3>
                {profile.name} {profile.surname}
              </h3>
              <p>{profile.title}</p>
            </div>
          </section>

          <section id="about" className="info-section">
            <div className="section-title-wrap">
              <p className="section-label">01 / MEN HAQIMDA</p>
              <h2>Men haqimda</h2>
            </div>

            <div className="content-grid about-grid">
              <p>{profile.about}</p>
              <div className="facts-box">
                <h4>Yutuqlar</h4>
                <ul>
                {profile.achievements?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              </div>
            </div>
          </section>

          <section id="projects" className="info-section projects-section">
            <div className="section-title-wrap projects-heading">
              <div>
                <p className="section-label">02 / LOYIHALARIM</p>
                <h2>Qilgan ishlarim</h2>
              </div>
              <p>O‘rgangan bilimlarimni amaliy loyihalarda sinab, foydali va qulay mahsulotlar yarataman.</p>
            </div>

            <div className="project-grid">
              {projects.map((project) => (
                <article key={project.number} className={`project-card ${project.tone}`}>
                  <div className="project-card-top">
                    <span className="project-number">{project.number}</span>
                    <span className="project-mark" aria-hidden="true">↗</span>
                  </div>
                  <div>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                  </div>
                  <div className="project-tags">
                    {project.technologies.map((technology) => (
                      <span key={technology}>{technology}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="services" className="info-section services-section">
            <div className="section-title-wrap services-heading">
              <div>
                <p className="section-label">03 / XIZMATLARIM</p>
                <h2>Nima qila olaman?</h2>
              </div>
              <a
                href={profile.socialLinks.telegram}
                className="primary-btn"
                target="_blank"
                rel="noreferrer"
              >
                Buyurtma berish <span aria-hidden="true">↗</span>
              </a>
            </div>

            <div className="service-grid">
              {services.map((service) => (
                <article key={service.number} className={`service-card ${service.tone}`}>
                  <span className="service-number">{service.number}</span>
                  <div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                  </div>
                  <a href={profile.socialLinks.telegram} target="_blank" rel="noreferrer">
                    Batafsil yozish <span aria-hidden="true">→</span>
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section id="interests" className="info-section light-section">
            <div className="section-title-wrap">
              <p className="section-label">02 / QIZIQISHLARIM</p>
              <h2>Qiziqishlarim</h2>
            </div>

           <div className="interest-grid">
            {profile.interests?.map((item, index) => (
              <article key={item} className={`interest-card tone-${index + 1}`}>
                <span>{index + 1}</span>
                <h3>{item}</h3>
              </article>
            ))}
          </div>
          </section>

          <section id="friends" className="info-section">
            <div className="section-title-wrap">
              <p className="section-label">03 / DOSTLAR</p>
              <h2>Dostlar</h2>
            </div>

            <div className="card-grid">
              {friends.length === 0 ? (
                <p className="empty-message">Hozircha hech kim yo‘q.</p>
              ) : (
                friends.map((friend) => (
                  <article key={friend.id} className="person-card">
                    <div className="person-avatar">{friend.name.charAt(0)}</div>
                    <div>
                      <h3>{friend.name}</h3>
                      <p className="role-tag">{friend.relation}</p>
                      <small>{friend.note}</small>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section id="acquaintances" className="info-section">
            <div className="section-title-wrap">
              <p className="section-label">04 / TANISHLAR</p>
              <h2>Tanishlar</h2>
            </div>

            <div className="card-grid">
              {approvedAcquaintances.length === 0 ? (
                <p className="empty-message">Hozircha hech kim yo‘q.</p>
              ) : (
                approvedAcquaintances.map((item) => (
                  <article key={item.id} className="person-card">
                    <div className="person-avatar">{item.firstName.charAt(0)}</div>
                    <div>
                      <h3>
                        {item.firstName} {item.lastName}
                      </h3>
                      <p className="role-tag">Tanish</p>
                      <small>
                        {item.age ? `${item.age} yosh` : 'Yosh noma’lum'} • Aloqa tasdiqlangan
                      </small>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section id="acquaintance-form" className="info-section form-section">
            <div className="section-title-wrap">
              <p className="section-label">05 / TANISH QOLDIRISH</p>
              <h2>Tanishlar</h2>
            </div>

            <form className="acquaintance-form" onSubmit={addAcquaintance}>
              <div className="field-row two-cols">
                <label>
                  Ism
                  <input
                    type="text"
                    value={acquaintanceForm.firstName}
                    onChange={(event) =>
                      setAcquaintanceForm((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                    placeholder="Ismingiz"
                    required
                  />
                </label>
                <label>
                  Familya
                  <input
                    type="text"
                    value={acquaintanceForm.lastName}
                    onChange={(event) =>
                      setAcquaintanceForm((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                    placeholder="Familyangiz"
                    required
                  />
                </label>
              </div>

              <div className="field-row two-cols">
                <label>
                  Yosh
                  <input
                    type="number"
                    min="1"
                    value={acquaintanceForm.age}
                    onChange={(event) =>
                      setAcquaintanceForm((prev) => ({ ...prev, age: event.target.value }))
                    }
                    placeholder="Yoshingiz"
                  />
                </label>
                <label>
                  Telefon raqami
                  <input
                    type="tel"
                    value={acquaintanceForm.phone}
                    onChange={(event) =>
                      setAcquaintanceForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    placeholder="+998..."
                    required
                  />
                </label>
              </div>

              <button type="submit" className="primary-btn wide-btn">
                Yuborish
              </button>
              {acquaintanceError && <p className="login-error">Xato: {acquaintanceError}</p>}
            </form>
          </section>

          <section id="donate" className="donate-section">
            <div className="donate-intro">
              <div>
                <p className="section-label">06 / DONATE XIZMATI</p>
                <h2>Sevimli o‘yiningizni yanada qiziqarli qiling.</h2>
              </div>
              <p>
                Sizga istalgan o‘yinga donate xizmati mavjud. Tez, qulay va ishonchli yordam kerak bo‘lsa,
                men bilan bog‘laning.
              </p>
            </div>

            <div className="donate-grid">
              <article className="donate-card donate-card-main">
                <span className="donate-number">01</span>
                <div>
                  <span className="donate-icon" aria-hidden="true">✦</span>
                  <h3>Istalgan o‘yinga</h3>
                  <p>Sevimli o‘yiningiz uchun kerakli donate xizmatini topamiz.</p>
                </div>
              </article>
              <article className="donate-card donate-card-fast">
                <span className="donate-number">02</span>
                <div>
                  <span className="donate-icon" aria-hidden="true">↗</span>
                  <h3>Tezkor xizmat</h3>
                  <p>Buyurtmangizni ortiqcha kutishlarsiz ko‘rib chiqamiz.</p>
                </div>
              </article>
              <article className="donate-card donate-card-trust">
                <span className="donate-number">03</span>
                <div>
                  <span className="donate-icon" aria-hidden="true">♥</span>
                  <h3>Sizning tanlovingiz</h3>
                  <p>O‘yin, server va kerakli paketni ayting, mos variantni birga tanlaymiz.</p>
                </div>
              </article>
            </div>

            <div className="donate-details">
              <div>
                <span className="section-label">QANDAY BUYURTMA BERILADI?</span>
                <ol className="donate-steps">
                  <li><strong>O‘yinni ayting</strong><span>O‘yin nomi va serveringizni yuboring.</span></li>
                  <li><strong>Paketni tanlang</strong><span>Kerakli donate miqdorini birga aniqlaymiz.</span></li>
                  <li><strong>Natijani kuting</strong><span>Buyurtma holati haqida Telegram’da xabar olasiz.</span></li>
                </ol>
              </div>
              <div className="donate-requirements">
                <span className="section-label">KERAK BO‘LADIGAN MA’LUMOTLAR</span>
                <p>O‘yin nomi, player ID, server va paket nomi kifoya. Hech qachon akkaunt parolingizni yubormang.</p>
              </div>
            </div>

            <a href="#contact" className="primary-btn donate-cta">
              Donate kerakmi? Men bilan bog‘laning <span aria-hidden="true">→</span>
            </a>
          </section>

          <section className="info-section reviews-section">
            <div className="section-title-wrap reviews-heading">
              <div>
                <p className="section-label">07 / FOYDALANUVCHILAR FIKRI</p>
                <h2>Men haqimda nima deyishadi?</h2>
              </div>
              <button type="button" className="secondary-btn" onClick={() => setShowAlert(true)}>
                Fikr qoldirish <span aria-hidden="true">★</span>
              </button>
            </div>

            {reviews.length === 0 ? (
              <div className="reviews-empty">
                <p>Hali fikrlar yo‘q. Birinchi bo‘lib fikringizni qoldiring.</p>
                <button type="button" className="primary-btn" onClick={() => setShowAlert(true)}>
                  Fikr qoldirish
                </button>
              </div>
            ) : (
              <div className="public-review-grid">
                {reviews.map((review) => (
                  <article key={review.id} className="public-review-card">
                    <div className="public-review-top">
                      <strong>{review.name || 'Foydalanuvchi'}</strong>
                      <span className="review-stars" aria-label={`${review.rating} yulduz`}>
                        {'★'.repeat(review.rating)}
                      </span>
                    </div>
                    <p>{review.comment}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="contact" className="footer-contact">
            <div>
              <p className="section-label">05 / BOG’LANISH</p>
              <h2>Men bilan bog’laning</h2>
            </div>

            <div className="social-links">
              <a className="telegram-link" href={profile.socialLinks.telegram} target="_blank" rel="noreferrer">
                Telegram
              </a>
              <a href={profile.socialLinks.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a href={profile.socialLinks.youtube} target="_blank" rel="noreferrer">
                YouTube
              </a>
            </div>
          </section>
        </main>
      ) : (
        <main className="admin-panel">
          <section className="admin-header">
            <div>
              <p className="section-label">SUPER ADMIN</p>
              <h2>Admin panel</h2>
            </div>
            <button
              type="button"
              className="role-toggle dull"
              onClick={() => {
                logoutAdmin();
                setRole('people');
                setIsAdminLoggedIn(false);
                setShowLogin(false);
              }}
            >
              Chiqish
            </button>
          </section>

          <section className="admin-card analytics-card">
            <div className="analytics-heading">
              <div>
                <p className="section-label">TASHRIFLAR STATISTIKASI</p>
                <h3>Oylik tashrifchilar</h3>
              </div>
              <span className="analytics-note">Anonim noyob brauzerlar</span>
            </div>
            {visitorStats.length === 0 ? (
              <p className="empty-message">Hali statistika yig‘ilmadi yoki jadval sozlanmagan.</p>
            ) : (
              <div className="analytics-list">
                {visitorStats.map((stat) => {
                  const maximum = Math.max(...visitorStats.map((item) => Number(item.unique_visitors) || 0), 1);
                  const visitors = Number(stat.unique_visitors) || 0;
                  const monthLabel = new Date(`${stat.month}T00:00:00`).toLocaleDateString('uz-UZ', {
                    month: 'long',
                    year: 'numeric',
                  });

                  return (
                    <div key={stat.month} className="analytics-row">
                      <span className="analytics-month">{monthLabel}</span>
                      <div className="analytics-bar-track" aria-hidden="true">
                        <span className="analytics-bar" style={{ width: `${Math.max((visitors / maximum) * 100, 3)}%` }} />
                      </div>
                      <strong>{visitors}</strong>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="admin-grid">
            <section className="admin-card">
              <h3>Dost qo’shish</h3>
              <form onSubmit={addFriend} className="admin-form">
                <label>
                  Ism
                  <input
                    type="text"
                    value={friendForm.name}
                    onChange={(event) => setFriendForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Do’stning ismi"
                    required
                  />
                </label>

                <label>
                  Aloqa turi
                  <select
                    value={friendForm.relation}
                    onChange={(event) => setFriendForm((prev) => ({ ...prev, relation: event.target.value }))}
                  >
                    <option value="Do’st">Do’st</option>
                    <option value="Tanish">Tanish</option>
                    <option value="Yaqin do’st">Yaqin do’st</option>
                  </select>
                </label>

                <label>
                  Izoh
                  <textarea
                    value={friendForm.note}
                    onChange={(event) => setFriendForm((prev) => ({ ...prev, note: event.target.value }))}
                    placeholder="Qisqa izoh..."
                  />
                </label>

                <button type="submit" className="primary-btn wide-btn">
                  Qo’shish
                </button>
              </form>
            </section>

            <section className="admin-card">
              <h3>Tanishlar ro’yxati</h3>

              {pendingAcquaintances.length === 0 ? (
                <p className="empty-message">Hozircha yangi tanishlar yo’q.</p>
              ) : (
                pendingAcquaintances.map((item) => (
                  <div key={item.id} className="request-card">
                    <div>
                      <strong>
                        {item.firstName} {item.lastName}
                      </strong>
                      <p>
                        {item.age || 'Yosh nomalum'} yosh • {item.phone}
                      </p>
                    </div>
                    <div className="request-actions">
                      <button type="button" onClick={() => approveOneAcquaintance(item.id)}>
                        Tasdiqlash
                      </button>
                      <button type="button" onClick={() => addAcquaintanceAsFriend(item)}>
                        Do’stga qo’shish
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => removeAcquaintance(item.id)}
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          <section className="admin-card approved-card">
            <h3>Baholar va izohlar</h3>
            {reviews.length === 0 ? (
              <p className="empty-message">Hozircha izohlar yo‘q.</p>
            ) : (
              <div className="review-list">
                {reviews.map((review) => (
                  <article key={review.id} className="review-card">
                    <div>
                      <strong>{review.name || 'Noma’lum'}</strong>
                      <div className="review-stars" aria-label={`${review.rating} yulduz`}>{'★'.repeat(review.rating)}</div>
                      <p>{review.comment}</p>
                      <small>{new Date(review.created_at).toLocaleString('uz-UZ')}</small>
                    </div>
                    <button type="button" className="danger-btn" onClick={() => removeReview(review.id)}>
                      Delete
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="admin-card approved-card">
            <h3>Approved tanishlar</h3>
            <div className="card-grid admin-card-grid">
              {approvedAcquaintances.length === 0 ? (
                <p className="empty-message">Hozircha hech kim yo‘q.</p>
              ) : (
                approvedAcquaintances.map((item) => (
                  <article key={item.id} className="person-card admin-person-card">
                    {editingAcquaintanceId === item.id ? (
                      <div className="inline-edit-form">
                        <input
                          type="text"
                          value={acquaintanceDraft.firstName}
                          onChange={(event) =>
                            setAcquaintanceDraft((prev) => ({ ...prev, firstName: event.target.value }))
                          }
                        />
                        <input
                          type="text"
                          value={acquaintanceDraft.lastName}
                          onChange={(event) =>
                            setAcquaintanceDraft((prev) => ({ ...prev, lastName: event.target.value }))
                          }
                        />
                        <input
                          type="number"
                          value={acquaintanceDraft.age}
                          onChange={(event) =>
                            setAcquaintanceDraft((prev) => ({ ...prev, age: event.target.value }))
                          }
                        />
                        <input
                          type="tel"
                          value={acquaintanceDraft.phone}
                          onChange={(event) =>
                            setAcquaintanceDraft((prev) => ({ ...prev, phone: event.target.value }))
                          }
                        />
                        <div className="inline-actions">
                          <button type="button" onClick={() => saveAcquaintanceEdit(item.id)}>
                            Saqlash
                          </button>
                          <button type="button" className="danger-btn" onClick={() => setEditingAcquaintanceId(null)}>
                            Bekor qilish
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="person-avatar">{item.firstName.charAt(0)}</div>
                        <div>
                          <h3>
                            {item.firstName} {item.lastName}
                          </h3>
                          <p className="role-tag">Approved</p>
                          <small>
                            {item.age} yosh • {item.phone}
                          </small>
                        </div>
                        <div className="card-actions">
                          <button type="button" onClick={() => startEditingAcquaintance(item)}>
                            Edit
                          </button>
                          <button type="button" className="danger-btn" onClick={() => removeAcquaintance(item.id)}>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="admin-card approved-card">
            <h3>Dostlar ro’yxati</h3>
            <div className="card-grid admin-card-grid">
              {friends.length === 0 ? (
                <p className="empty-message">Hozircha hech kim yo‘q.</p>
              ) : (
                friends.map((friend) => (
                  <article key={friend.id} className="person-card admin-person-card">
                    {editingFriendId === friend.id ? (
                      <div className="inline-edit-form">
                        <input
                          type="text"
                          value={friendDraft.name}
                          onChange={(event) => setFriendDraft((prev) => ({ ...prev, name: event.target.value }))}
                        />
                        <select
                          value={friendDraft.relation}
                          onChange={(event) =>
                            setFriendDraft((prev) => ({ ...prev, relation: event.target.value }))
                          }
                        >
                          <option value="Do’st">Do’st</option>
                          <option value="Tanish">Tanish</option>
                          <option value="Yaqin do’st">Yaqin do’st</option>
                        </select>
                        <textarea
                          value={friendDraft.note}
                          onChange={(event) => setFriendDraft((prev) => ({ ...prev, note: event.target.value }))}
                        />
                        <div className="inline-actions">
                          <button type="button" onClick={() => saveFriendEdit(friend.id)}>
                            Saqlash
                          </button>
                          <button type="button" className="danger-btn" onClick={() => setEditingFriendId(null)}>
                            Bekor qilish
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="person-avatar">{friend.name.charAt(0)}</div>
                        <div>
                          <h3>{friend.name}</h3>
                          <p className="role-tag">{friend.relation}</p>
                          <small>{friend.note}</small>
                        </div>
                        <div className="card-actions">
                          <button type="button" onClick={() => startEditingFriend(friend)}>
                            Edit
                          </button>
                          <button type="button" className="danger-btn" onClick={() => removeFriend(friend.id)}>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </main>
      )}

      <button type="button" className="feedback-trigger" onClick={() => setShowAlert(true)}>
        <span className="feedback-icon" aria-hidden="true">★</span>
        <span>MyWeb ni baholang</span>
      </button>

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
            <label>
              Ismingiz
              <input
                type="text"
                value={reviewForm.name}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Ismingizni kiriting"
                maxLength="80"
                required
              />
            </label>
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
    </div>
  );
}

export default App;
