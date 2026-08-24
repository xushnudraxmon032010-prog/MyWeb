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
  loginAdmin,
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
    instagram: 'https://instagram.com/_sherqulovv_010',
    youtube: 'https://youtube.com/@yourchannel',
  },
};

const initialFriends = [
  { id: 1, name: 'Azizbek Karimov', relation: 'Do’st', note: 'Birga loyiha ustida ishlaymiz.' },
  { id: 2, name: 'Madina Tursunova', relation: 'Tanish', note: 'Kursda birga o’qiyapmiz.' },
  { id: 3, name: 'Sardor Abdullayev', relation: 'Yaqin do’st', note: 'Frontend va dizayn bo’yicha fikr almashamiz.' },
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
  const [showAlert, setShowAlert] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
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
      const [profileData, friendsData, pendingData, approvedData] = await Promise.all([
        getProfile(),
        getFriends(),
        isAdminLoggedIn ? getPendingAcquaintances() : Promise.resolve([]),
        getApprovedAcquaintances(),
      ]);

      const allAcquaintances = [...(Array.isArray(pendingData) ? pendingData : []), ...(Array.isArray(approvedData) ? approvedData : [])];

      setProfile(profileData || initialProfile);
      setFriends(Array.isArray(friendsData) ? friendsData : initialFriends);
      setAcquaintances(allAcquaintances);
    } catch (error) {
      console.error('Failed to load app data:', error);
      setProfile(initialProfile);
      setFriends(initialFriends);
      setAcquaintances([]);
    }
  };

  useEffect(() => {
    localStorage.setItem('myweb-role', role);
  }, [role]);

  useEffect(() => {
    void loadAppData();
  }, [isAdminLoggedIn]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAlert(true);
      alert('Mening websitem sizga yoqdimi?');
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const pendingAcquaintances = acquaintances.filter((item) => item.status === 'pending');
  const approvedAcquaintances = acquaintances.filter((item) => item.status === 'approved');

  const handleAdminButtonClick = () => {
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

    try {
      const newAcq = await createSupabaseAcquaintance({
        firstName: acquaintanceForm.firstName.trim(),
        lastName: acquaintanceForm.lastName.trim(),
        age: Number(acquaintanceForm.age || 0),
        phone: acquaintanceForm.phone.trim(),
        status: 'pending',
      });

      setAcquaintances((prev) => [newAcq, ...prev]);
      setAcquaintanceForm({ firstName: '', lastName: '', age: '', phone: '' });
      alert('So’rovingiz yuborildi. Super admin tasdiqlashini kuting.');
    } catch (error) {
      console.error('Acquaintance create failed:', error);
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
          <span className="brand-logo">MW</span>
          <span>{brand.name}</span>
        </div>

        <nav className="nav">
          <a href="#home">Bosh sahifa</a>
          <a href="#about">Men haqimda</a>
          <a href="#interests">Qiziqishlar</a>
          <a href="#friends">Dostlar</a>
          <a href="#contact">Bog’lanish</a>
        </nav>

        <button type="button" className="role-toggle" onClick={handleAdminButtonClick}>
          {isAdminLoggedIn ? 'Super admin' : 'Login'}
        </button>
      </header>

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

          <section className="info-section">
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
                        {item.age ? `${item.age} yosh` : 'Yosh noma’lum'} • {item.phone}
                      </small>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="info-section form-section">
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
            </form>
          </section>

          <section id="contact" className="footer-contact">
            <div>
              <p className="section-label">05 / BOG’LANISH</p>
              <h2>Iltimos, bog’laning</h2>
            </div>

            <div className="social-links">
              <a href={profile.socialLinks.telegram} target="_blank" rel="noreferrer">
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

      {showAlert && (
        <div className="popup">
          <button type="button" className="close-btn" onClick={() => setShowAlert(false)}>
            ×
          </button>
          <p>MyWeb sizga yoqdimi?</p>
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
