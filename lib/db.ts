import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  username: string;
  passwordHash: string; // stored as plain password for simplicity in this prototype
  nama: string;
  role: 'admin' | 'siswa';
  kelas?: string;
  avatar: string;
}

export interface Report {
  id: string;
  pelaporId: string;
  pelaporNama: string;
  pelaporKelas?: string;
  isAnonim: boolean;
  jenis: string; // "Bullying Verbal", "Bullying Fisik", "Cyber Bullying", "Bullying Sosial"
  deskripsi: string;
  lokasi: string;
  prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
  status: 'Baru' | 'Proses' | 'Selesai';
  catatan: string;
  tanggal: string; // e.g. "08 Mei 2026, 23.00"
  createdAt: string; // ISO format
  frekuensi?: string;
  relasi?: string;
}

export interface ChatMessage {
  id: string;
  pengirimId: string;
  penerimaId: string;
  teks: string;
  tanggal: string; // e.g. "11.18" or "12.30"
  timestamp: string; // ISO format
}

export interface PanicTrigger {
  id: string;
  siswaId: string;
  siswaNama: string;
  siswaKelas?: string;
  status: 'Aktif' | 'Selesai';
  timestamp: string; // ISO format
}

export interface Schema {
  users: User[];
  reports: Report[];
  messages: ChatMessage[];
  panics: PanicTrigger[];
}

const DEFAULT_USERS: User[] = [
  {
    id: 'admin-1',
    username: 'adminspeakup1',
    passwordHash: '3P26D5!',
    nama: 'Admin SpeakUp 1',
    role: 'admin',
    avatar: 'A'
  },
  {
    id: 'admin-2',
    username: 'adminspeakup2',
    passwordHash: 'AUD668!',
    nama: 'Admin SpeakUp 2',
    role: 'admin',
    avatar: 'A'
  },
  {
    id: 'admin-3',
    username: 'adminspeakup3',
    passwordHash: '75T621!',
    nama: 'Admin SpeakUp 3',
    role: 'admin',
    avatar: 'A'
  },
  {
    id: 'siswa-1',
    username: 'adam',
    passwordHash: 'XNV283!',
    nama: 'Adam',
    role: 'siswa',
    kelas: 'Kelas 10 MIPA 1',
    avatar: 'A'
  },
  {
    id: 'siswa-2',
    username: 'siti',
    passwordHash: 'N3E959!',
    nama: 'Siti Aminah',
    role: 'siswa',
    kelas: 'Kelas 10 IPS 2',
    avatar: 'S'
  }
];

const DEFAULT_REPORTS: Report[] = [
  {
    id: 'rep-1',
    pelaporId: 'siswa-1',
    pelaporNama: 'Adam',
    pelaporKelas: 'Kelas 10 MIPA 1',
    isAnonim: false,
    jenis: 'Bullying Verbal',
    deskripsi: 'Diejek di depan kelas.',
    lokasi: 'Ruang Kelas 10A',
    prioritas: 'Sedang',
    status: 'Selesai',
    catatan: 'Sudah dimediasi oleh Admin.',
    tanggal: '08 Mei 2026, 23.00',
    createdAt: '2026-05-08T23:00:00.000Z'
  }
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    pengirimId: 'admin-1',
    penerimaId: 'siswa-1',
    teks: 'Halo Adam, kami lihat ada laporan dari kamu. Ingin bercerita lebih detail di sini?',
    tanggal: '11.18',
    timestamp: '2026-05-08T11:18:00.000Z'
  }
];

const DEFAULT_PANICS: PanicTrigger[] = [];

// Use Node's global object for hot-reload-safe/in-memory server state
interface CustomGlobal {
  __speakup_db?: Schema;
}

const g = global as unknown as CustomGlobal;

function getDbPath() {
  return path.join(process.cwd(), 'lib_db.json');
}

export function getDatabase(): Schema {
  const ensureSchema = (db: Schema): Schema => {
    if (!db.users) db.users = [];
    if (!db.reports) db.reports = [];
    if (!db.messages) db.messages = [];
    if (!db.panics) db.panics = [];
    return db;
  };

  if (g.__speakup_db) {
    return ensureSchema(g.__speakup_db);
  }

  // Attempt to read from file
  try {
    const dbPath = getDbPath();
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      g.__speakup_db = ensureSchema(JSON.parse(data));
      return g.__speakup_db!;
    }
  } catch (e) {
    console.error('Failed to read SpeakUp DB file, using default seeds', e);
  }

  // Fallback / Initial seeding
  g.__speakup_db = ensureSchema({
    users: DEFAULT_USERS,
    reports: DEFAULT_REPORTS,
    messages: DEFAULT_MESSAGES,
    panics: DEFAULT_PANICS
  });
  saveDatabase(g.__speakup_db);
  return g.__speakup_db;
}

export function saveDatabase(db: Schema): void {
  g.__speakup_db = db;
  try {
    const dbPath = getDbPath();
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save SpeakUp DB file', e);
  }
}
