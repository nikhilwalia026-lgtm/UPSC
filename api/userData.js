import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

// -------------------------------------------------
// Very simple file‑based KV store (demo only).
// In production replace this with a real DB (Supabase, MongoDB, etc.).
// -------------------------------------------------
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'users.json');

async function ensureDb() {
  try {
    await mkdir(DB_DIR, { recursive: true });
    await readFile(DB_FILE);
  } catch {
    await writeFile(DB_FILE, JSON.stringify({}), 'utf8');
  }
}

export default async function handler(req, res) {
  await ensureDb();

  // -------------------------------------------------
  // GET → /api/userData?userId=xxxxx
  // -------------------------------------------------
  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId missing' });

    const raw = await readFile(DB_FILE, 'utf8');
    const db = JSON.parse(raw);
    const payload = db[userId] ?? {};

    return res.status(200).json({ payload });
  }

  // -------------------------------------------------
  // POST → /api/userData   { userId, payload }
  // -------------------------------------------------
  if (req.method === 'POST') {
    const { userId, payload } = req.body;
    if (!userId || typeof payload !== 'object')
      return res.status(400).json({ error: 'invalid body' });

    const raw = await readFile(DB_FILE, 'utf8');
    const db = JSON.parse(raw);
    db[userId] = payload; // overwrite entire bucket
    await writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8');

    return res.status(200).json({ success: true });
  }

  // -------------------------------------------------
  // Unsupported method
  // -------------------------------------------------
  return res.status(405).json({ error: 'method not allowed' });
}
