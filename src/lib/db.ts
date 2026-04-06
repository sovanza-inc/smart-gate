import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export default sql;

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      iqama TEXT NOT NULL,
      contractor TEXT NOT NULL,
      job TEXT NOT NULL,
      phone TEXT DEFAULT '',
      telegram TEXT DEFAULT '',
      nationality TEXT DEFAULT '',
      expiry_raw TEXT NOT NULL,
      expiry_display TEXT NOT NULL,
      digits TEXT NOT NULL,
      status TEXT DEFAULT 'outside',
      last_entry TEXT,
      face_photo TEXT,
      eye_photo TEXT,
      eye_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY,
      worker_id TEXT NOT NULL,
      name TEXT NOT NULL,
      job TEXT NOT NULL,
      contractor TEXT NOT NULL,
      nationality TEXT DEFAULT '',
      face_photo TEXT,
      type TEXT NOT NULL,
      time TEXT NOT NULL,
      date TEXT NOT NULL,
      speed REAL DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS speeds (
      id SERIAL PRIMARY KEY,
      value REAL NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pending_workers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      iqama TEXT NOT NULL,
      contractor TEXT NOT NULL,
      job TEXT NOT NULL,
      phone TEXT DEFAULT '',
      telegram TEXT DEFAULT '',
      nationality TEXT DEFAULT '',
      expiry_raw TEXT NOT NULL,
      expiry_display TEXT NOT NULL,
      digits TEXT NOT NULL,
      face_photo TEXT,
      eye_photo TEXT,
      eye_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT DEFAULT 'pending'
    )
  `;
}
