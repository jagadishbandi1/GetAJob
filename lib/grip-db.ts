import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'grip.db');

let db: Database.Database;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '🎯',
      color TEXT NOT NULL DEFAULT '#a3e635',
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS content_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_tag TEXT NOT NULL,
      card_type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      seen INTEGER DEFAULT 0,
      saved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      score INTEGER NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      date TEXT DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS nudges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      time_of_day TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS nudge_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nudge_id INTEGER NOT NULL REFERENCES nudges(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      logged_at TEXT DEFAULT (datetime('now')),
      date TEXT DEFAULT (date('now'))
    );
  `);
}

export type Goal = {
  id: number;
  title: string;
  emoji: string;
  color: string;
  description: string | null;
  created_at: string;
};

export type Milestone = {
  id: number;
  goal_id: number;
  text: string;
  completed: number;
  created_at: string;
};

export type ContentCard = {
  id: number;
  goal_tag: string;
  card_type: string;
  title: string;
  body: string;
  seen: number;
  saved: number;
  created_at: string;
};

export type CheckIn = {
  id: number;
  score: number;
  note: string | null;
  created_at: string;
  date: string;
};

export type Nudge = {
  id: number;
  goal_id: number;
  label: string;
  time_of_day: string;
  created_at: string;
};
