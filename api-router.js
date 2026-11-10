import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const INITIAL_DATA = {
  events: [
    {
      id: 'e1111111-1111-1111-1111-111111111111',
      name: 'Kerja Bakti Asrama',
      event_date: '2026-11-10',
      event_time: '17.00 WIB',
      location: 'Lorong 3 & 4',
      description: 'Pembersihan kamar mandi baru dan wastafel',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ],
  residents: [
    { id: 'r01', name: 'Ahmad Fauzi', hallway: 'Lorong 3', is_active: true, created_at: new Date().toISOString() },
    { id: 'r02', name: 'Budi Santoso', hallway: 'Lorong 3', is_active: true, created_at: new Date().toISOString() },
    { id: 'r03', name: 'Dimas Pratama', hallway: 'Lorong 3', is_active: true, created_at: new Date().toISOString() },
    { id: 'r04', name: 'Fajar Ramadhan', hallway: 'Lorong 3', is_active: true, created_at: new Date().toISOString() },
    { id: 'r05', name: 'Gilang Perkasa', hallway: 'Lorong 3', is_active: true, created_at: new Date().toISOString() },
    { id: 'r06', name: 'Hendra Wijaya', hallway: 'Lorong 3', is_active: true, created_at: new Date().toISOString() },
    { id: 'r07', name: 'Irfan Hakim', hallway: 'Lorong 3', is_active: true, created_at: new Date().toISOString() },
    { id: 'r08', name: 'Aditya Pratama', hallway: 'Lorong 4', is_active: true, created_at: new Date().toISOString() },
    { id: 'r09', name: 'Bagus Nugroho', hallway: 'Lorong 4', is_active: true, created_at: new Date().toISOString() },
    { id: 'r10', name: 'Candra Kusuma', hallway: 'Lorong 4', is_active: true, created_at: new Date().toISOString() },
    { id: 'r11', name: 'Dwi Saputra', hallway: 'Lorong 4', is_active: true, created_at: new Date().toISOString() },
    { id: 'r12', name: 'Farhan Maulana', hallway: 'Lorong 4', is_active: true, created_at: new Date().toISOString() },
    { id: 'r13', name: 'Hafizh Firdaus', hallway: 'Lorong 4', is_active: true, created_at: new Date().toISOString() },
    { id: 'r14', name: 'Rizky Alamsyah', hallway: 'Lorong 4', is_active: true, created_at: new Date().toISOString() },
  ],
  attendances: [],
};

export function readDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
    return INITIAL_DATA;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file, using fallback:', err);
    return INITIAL_DATA;
  }
}

export function writeDb(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export const ADMIN_TOKENS = new Set();
export const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admingacor123',
};

export const apiRouter = express.Router();
apiRouter.use(express.json());

// 1. Get active event
apiRouter.get('/active-event', (req, res) => {
  const db = readDb();
  const activeEvent = db.events.find((e) => e.is_active) || null;
  res.json({ success: true, data: activeEvent });
});

// 2. Get active residents
apiRouter.get('/active-residents', (req, res) => {
  const db = readDb();
  const list = db.residents
    .filter((r) => r.is_active)
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));
  res.json({ success: true, data: list });
});

// 3. Submit attendance
apiRouter.post('/attendance', (req, res) => {
  const { eventId, residentId, status, excuseReason } = req.body;

  if (!eventId || !residentId || !status) {
    return res.status(400).json({ success: false, error: 'Data absensi tidak lengkap.' });
  }

  if (!['Hadir', 'Izin'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Status kehadiran tidak valid.' });
  }

  const cleanReason = String(excuseReason || '').trim();
  if (status === 'Izin' && !cleanReason) {
    return res.status(400).json({ success: false, error: 'Alasan izin wajib diisi.' });
  }

  const db = readDb();
  const event = db.events.find((e) => e.id === eventId && e.is_active);
  if (!event) {
    return res.status(400).json({ success: false, error: 'Kegiatan tidak aktif atau tidak ditemukan.' });
  }

  const resident = db.residents.find((r) => r.id === residentId && r.is_active);
  if (!resident) {
    return res.status(400).json({ success: false, error: 'Data penghuni tidak aktif atau tidak ditemukan.' });
  }

  // Check duplicate
  const existing = db.attendances.find((a) => a.event_id === eventId && a.resident_id === residentId);
  if (existing) {
    return res.json({
      success: false,
      alreadyRecorded: true,
      error: 'Absensi sudah tercatat sebelumnya.',
      attendance: {
        residentName: resident.name,
        hallway: resident.hallway,
        status: existing.status,
        recordedAt: existing.created_at,
        excuseReason: existing.excuse_reason,
      },
    });
  }

  const recordedAt = new Date().toISOString();
  const newAttendance = {
    id: genId('att'),
    event_id: eventId,
    resident_id: residentId,
    status,
    excuse_reason: status === 'Izin' ? cleanReason : null,
    created_at: recordedAt,
  };

  db.attendances.push(newAttendance);
  writeDb(db);

  return res.json({
    success: true,
    alreadyRecorded: false,
    attendance: {
      residentName: resident.name,
      hallway: resident.hallway,
      status,
      recordedAt,
      excuseReason: newAttendance.excuse_reason,
    },
  });
});

// 4. Admin login
apiRouter.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const cleanUser = String(username || '').trim().toLowerCase();

  if (
    (cleanUser === DEFAULT_ADMIN.username || cleanUser === 'admin@asrama.local') &&
    password === DEFAULT_ADMIN.password
  ) {
    const token = `adm_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    ADMIN_TOKENS.add(token);
    return res.json({ success: true, token });
  }

  return res.status(401).json({
    success: false,
    error: 'Username atau password salah. Gunakan username "admin" dan password yang benar.',
  });
});

apiRouter.post('/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  ADMIN_TOKENS.delete(token);
  return res.json({ success: true });
});

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (token && ADMIN_TOKENS.has(token)) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Akses ditolak. Silakan login sebagai pengurus.' });
}

apiRouter.get('/admin/check-session', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (token && ADMIN_TOKENS.has(token)) {
    return res.json({ success: true, authenticated: true });
  }
  return res.json({ success: true, authenticated: false });
});

apiRouter.get('/admin/dashboard-records', requireAdmin, (req, res) => {
  const { eventId } = req.query;
  const db = readDb();

  const event = db.events.find((e) => (eventId ? e.id === eventId : e.is_active)) || db.events[0];
  if (!event) {
    return res.json({
      success: true,
      records: [],
      stats: { totalResidents: 0, hadir: 0, izin: 0, belumHadir: 0, attendancePercentage: 0 },
    });
  }

  const activeResidents = db.residents.filter((r) => r.is_active);
  const attendances = db.attendances.filter((a) => a.event_id === event.id);

  const attMap = new Map();
  attendances.forEach((a) => attMap.set(a.resident_id, a));

  const records = activeResidents.map((r) => {
    const a = attMap.get(r.id);
    const status = a ? a.status : 'Belum Hadir';
    return {
      resident_id: r.id,
      name: r.name,
      hallway: r.hallway,
      status,
      excuse_reason: a ? a.excuse_reason : null,
      recorded_at: a ? a.created_at : null,
      attendance_id: a ? a.id : null,
    };
  });

  const totalResidents = activeResidents.length;
  const hadir = records.filter((r) => r.status === 'Hadir').length;
  const izin = records.filter((r) => r.status === 'Izin').length;
  const belumHadir = totalResidents - hadir - izin;
  const attendancePercentage = totalResidents > 0 ? Math.round((hadir / totalResidents) * 100) : 0;

  return res.json({
    success: true,
    records,
    stats: {
      totalResidents,
      hadir,
      izin,
      belumHadir,
      attendancePercentage,
    },
  });
});

apiRouter.get('/admin/residents', requireAdmin, (req, res) => {
  const db = readDb();
  const sorted = [...db.residents].sort((a, b) => {
    if (a.hallway === b.hallway) {
      return a.name.localeCompare(b.name, 'id');
    }
    return a.hallway.localeCompare(b.hallway);
  });
  res.json({ success: true, data: sorted });
});

apiRouter.post('/admin/residents', requireAdmin, (req, res) => {
  const { name, hallway } = req.body;
  const cleanName = String(name || '').trim();

  if (!cleanName) {
    return res.status(400).json({ success: false, error: 'Nama penghuni wajib diisi.' });
  }
  if (!['Lorong 3', 'Lorong 4'].includes(hallway)) {
    return res.status(400).json({ success: false, error: 'Pilih Lorong 3 atau Lorong 4.' });
  }

  const db = readDb();
  const newResident = {
    id: genId('res'),
    name: cleanName,
    hallway,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  db.residents.push(newResident);
  writeDb(db);
  res.json({ success: true, data: newResident });
});

apiRouter.put('/admin/residents/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, hallway } = req.body;
  const cleanName = String(name || '').trim();

  if (!cleanName) {
    return res.status(400).json({ success: false, error: 'Nama penghuni wajib diisi.' });
  }
  if (!['Lorong 3', 'Lorong 4'].includes(hallway)) {
    return res.status(400).json({ success: false, error: 'Pilih Lorong 3 atau Lorong 4.' });
  }

  const db = readDb();
  const resident = db.residents.find((r) => r.id === id);
  if (!resident) {
    return res.status(404).json({ success: false, error: 'Penghuni tidak ditemukan.' });
  }

  resident.name = cleanName;
  resident.hallway = hallway;
  writeDb(db);
  res.json({ success: true, data: resident });
});

apiRouter.patch('/admin/residents/:id/toggle', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  const db = readDb();
  const resident = db.residents.find((r) => r.id === id);
  if (!resident) {
    return res.status(404).json({ success: false, error: 'Penghuni tidak ditemukan.' });
  }

  resident.is_active = Boolean(is_active);
  writeDb(db);
  res.json({ success: true, data: resident });
});
