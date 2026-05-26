import { neon } from '@neondatabase/serverless';

export function getDb() {
  return neon(process.env.DATABASE_URL!);
}

export async function initDb() {
  const sql = getDb();
  await sql`
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
      updated_at TEXT DEFAULT (now()::text)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS context_rules (
      id SERIAL PRIMARY KEY,
      trigger_keyword TEXT NOT NULL,
      response TEXT NOT NULL,
      created_at TEXT DEFAULT (now()::text)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      platform TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (now()::text)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_url TEXT NOT NULL,
      company TEXT,
      job_title TEXT,
      location TEXT,
      compensation TEXT,
      status TEXT DEFAULT 'pending',
      log TEXT,
      source TEXT DEFAULT 'manual',
      applied_at TEXT DEFAULT (now()::text)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      file_type TEXT,
      content TEXT,
      created_at TEXT DEFAULT (now()::text)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS training_examples (
      id SERIAL PRIMARY KEY,
      question_text TEXT NOT NULL,
      answer_given TEXT NOT NULL,
      job_url TEXT,
      created_at TEXT DEFAULT (now()::text)
    )
  `;
  // Seed empty profile if none exists
  const rows = await sql`SELECT id FROM profile WHERE id = 1`;
  if (rows.length === 0) {
    await sql`INSERT INTO profile (id) VALUES (1)`;
  }
}
