import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID, scryptSync, timingSafeEqual } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'myweb.db');
const adminSessions = new Set();

fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbPath);

const defaultProfile = {
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

const defaultFriends = [
  { id: 1, name: 'Azizbek Karimov', relation: 'Do’st', note: 'Birga loyiha ustida ishlaymiz.' },
  { id: 2, name: 'Madina Tursunova', relation: 'Tanish', note: 'Kursda birga o’qiyapmiz.' },
  { id: 3, name: 'Sardor Abdullayev', relation: 'Yaqin do’st', note: 'Frontend va dizayn bo’yicha fikr almashamiz.' },
];

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });

const hashPassword = (password) => scryptSync(password, 'myweb-admin-salt', 32).toString('hex');

const passwordMatches = (password, storedPassword) => {
  if (!storedPassword) return false;
  if (!/^[a-f0-9]{64}$/i.test(storedPassword)) return password === storedPassword;
  const expected = Buffer.from(storedPassword, 'hex');
  const actual = Buffer.from(hashPassword(password), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const requireAdmin = (req, res, next) => {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || !adminSessions.has(token)) {
    res.status(401).json({ error: 'Admin login talab qilinadi.' });
    return;
  }
  next();
};

const initializeDatabase = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      name TEXT,
      surname TEXT,
      title TEXT,
      city TEXT,
      bio TEXT,
      about TEXT,
      course TEXT,
      interests TEXT,
      achievements TEXT,
      telegram TEXT,
      instagram TEXT,
      youtube TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      relation TEXT,
      note TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS acquaintances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      age INTEGER,
      phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    )
  `);

  const existingAdmin = await get('SELECT id FROM admins WHERE lower(username) = lower(?) LIMIT 1', ['xushnudraxmon032010']);
  if (!existingAdmin) {
    await run('INSERT INTO admins (username, password) VALUES (?, ?)', ['xushnudraxmon032010', 'xushnudraxmon1234']);
  }

  const existingProfile = await get('SELECT id FROM profile WHERE id = 1');
  if (!existingProfile) {
    await run(
      `INSERT INTO profile (id, name, surname, title, city, bio, about, course, interests, achievements, telegram, instagram, youtube)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        defaultProfile.name,
        defaultProfile.surname,
        defaultProfile.title,
        defaultProfile.city,
        defaultProfile.bio,
        defaultProfile.about,
        defaultProfile.course,
        JSON.stringify(defaultProfile.interests),
        JSON.stringify(defaultProfile.achievements),
        defaultProfile.socialLinks.telegram,
        defaultProfile.socialLinks.instagram,
        defaultProfile.socialLinks.youtube,
      ],
    );
  }

  const friendCount = await get('SELECT COUNT(*) AS count FROM friends');
  if ((friendCount?.count ?? 0) === 0) {
    for (const friend of defaultFriends) {
      await run('INSERT INTO friends (id, name, relation, note) VALUES (?, ?, ?, ?)', [friend.id, friend.name, friend.relation, friend.note]);
    }
  }

};

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    res.status(400).json({ error: 'Login va parol kerak.' });
    return;
  }

  const admin = await get('SELECT id, username, password FROM admins WHERE lower(username) = lower(?) LIMIT 1', [String(username).trim()]);

  if (!admin || !passwordMatches(String(password).trim(), admin.password)) {
    res.status(401).json({ error: 'Login yoki parol noto‘g‘ri.' });
    return;
  }

  const token = randomUUID();
  adminSessions.add(token);
  if (!/^[a-f0-9]{64}$/i.test(admin.password)) {
    await run('UPDATE admins SET password = ? WHERE id = ?', [hashPassword(String(password).trim()), admin.id]);
  }
  res.json({ ok: true, username: admin.username, token });
});

app.get('/api/profile', async (req, res) => {
  const row = await get('SELECT * FROM profile WHERE id = 1');

  if (!row) {
    res.json(defaultProfile);
    return;
  }

  res.json({
    ...defaultProfile,
    name: row.name || defaultProfile.name,
    surname: row.surname || defaultProfile.surname,
    title: row.title || defaultProfile.title,
    city: row.city || defaultProfile.city,
    bio: row.bio || defaultProfile.bio,
    about: row.about || defaultProfile.about,
    course: row.course || defaultProfile.course,
    interests: row.interests ? JSON.parse(row.interests) : defaultProfile.interests,
    achievements: row.achievements ? JSON.parse(row.achievements) : defaultProfile.achievements,
    socialLinks: {
      telegram: row.telegram || defaultProfile.socialLinks.telegram,
      instagram: row.instagram || defaultProfile.socialLinks.instagram,
      youtube: row.youtube || defaultProfile.socialLinks.youtube,
    },
  });
});

app.get('/api/friends', async (req, res) => {
  const rows = await all('SELECT * FROM friends ORDER BY id DESC');
  res.json(rows);
});

app.post('/api/friends', requireAdmin, async (req, res) => {
  const { name, relation, note } = req.body || {};

  if (!name || !String(name).trim()) {
    res.status(400).json({ error: 'Ism kerak.' });
    return;
  }

  const result = await run('INSERT INTO friends (name, relation, note) VALUES (?, ?, ?)', [String(name).trim(), String(relation || 'Do’st'), String(note || 'Yangi qo’shilgan do’st.')]);
  const created = await get('SELECT * FROM friends WHERE id = ?', [result.id]);
  res.status(201).json(created);
});

app.put('/api/friends/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, relation, note } = req.body || {};

  await run('UPDATE friends SET name = ?, relation = ?, note = ? WHERE id = ?', [String(name || 'Do’st').trim(), String(relation || 'Do’st'), String(note || 'Tahrirlandi.'), Number(id)]);

  const updated = await get('SELECT * FROM friends WHERE id = ?', [Number(id)]);
  res.json(updated);
});

app.delete('/api/friends/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  await run('DELETE FROM friends WHERE id = ?', [Number(id)]);
  res.json({ ok: true });
});

app.get('/api/acquaintances', requireAdmin, async (req, res) => {
  const rows = await all('SELECT * FROM acquaintances ORDER BY id DESC');
  res.json(rows);
});

app.get('/api/acquaintances/approved', async (req, res) => {
  const rows = await all("SELECT * FROM acquaintances WHERE status = 'approved' ORDER BY id DESC");
  res.json(rows);
});

app.get('/api/acquaintances/pending', requireAdmin, async (req, res) => {
  const rows = await all("SELECT * FROM acquaintances WHERE status = 'pending' ORDER BY id DESC");
  res.json(rows);
});

app.post('/api/acquaintances', async (req, res) => {
  const { firstName, lastName, age, phone } = req.body || {};

  if (!firstName || !lastName || !phone) {
    res.status(400).json({ error: 'Ism, familya va telefon kerak.' });
    return;
  }

  const result = await run('INSERT INTO acquaintances (firstName, lastName, age, phone, status) VALUES (?, ?, ?, ?, ?)', [String(firstName).trim(), String(lastName).trim(), Number(age || 0), String(phone).trim(), 'pending']);
  const created = await get('SELECT * FROM acquaintances WHERE id = ?', [result.id]);
  res.status(201).json(created);
});

app.put('/api/acquaintances/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, age, phone } = req.body || {};

  await run('UPDATE acquaintances SET firstName = ?, lastName = ?, age = ?, phone = ? WHERE id = ?', [String(firstName || 'Tanish').trim(), String(lastName || 'Foydalanuvchi').trim(), Number(age || 0), String(phone || '+998000000000').trim(), Number(id)]);

  const updated = await get('SELECT * FROM acquaintances WHERE id = ?', [Number(id)]);
  res.json(updated);
});

app.patch('/api/acquaintances/:id/approve', requireAdmin, async (req, res) => {
  const { id } = req.params;
  await run('UPDATE acquaintances SET status = ? WHERE id = ?', ['approved', Number(id)]);
  const updated = await get('SELECT * FROM acquaintances WHERE id = ?', [Number(id)]);
  res.json(updated);
});

app.delete('/api/acquaintances/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  await run('DELETE FROM acquaintances WHERE id = ?', [Number(id)]);
  res.json({ ok: true });
});

const startServer = async () => {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`MyWeb API running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start MyWeb API:', error);
  process.exit(1);
});
