import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data.db');

let db: Database.Database;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY,
      full_name TEXT,
      email TEXT,
      phone TEXT,
      location TEXT,
      linkedin TEXT,
      website TEXT,
      resume_text TEXT,
      free_context TEXT,
      resume_file_name TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS context_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trigger_keyword TEXT NOT NULL,
      response TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_url TEXT NOT NULL,
      company TEXT,
      job_title TEXT,
      status TEXT DEFAULT 'pending',
      log TEXT,
      source TEXT DEFAULT 'manual',
      applied_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      file_type TEXT,
      content TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS training_examples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_text TEXT NOT NULL,
      answer_given TEXT NOT NULL,
      job_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Add columns that may not exist in older DBs
  try { db.exec('ALTER TABLE applications ADD COLUMN location TEXT'); } catch {}
  try { db.exec('ALTER TABLE applications ADD COLUMN compensation TEXT'); } catch {}

  // Seed empty profile if none exists
  const profile = db.prepare('SELECT id FROM profile WHERE id = 1').get();
  if (!profile) {
    db.prepare(`INSERT INTO profile (id) VALUES (1)`).run();
  }
}
