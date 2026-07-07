import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'alcovia.db');
let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      total_coins INTEGER NOT NULL DEFAULT 0,
      current_streak INTEGER NOT NULL DEFAULT 0,
      daily_goal INTEGER NOT NULL DEFAULT 3,
      joined_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('deep_focus', 'quick_sprint', 'pomodoro')),
      duration_ms INTEGER NOT NULL,
      coins INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('completed', 'abandoned')),
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS session_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('focus', 'break')),
      duration_ms INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      student_id TEXT NOT NULL,
      unlocked_at TEXT,
      progress INTEGER NOT NULL DEFAULT 0,
      target INTEGER NOT NULL,
      current INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS streak_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      day TEXT NOT NULL,
      notified_at TEXT NOT NULL,
      UNIQUE(student_id, day)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_student ON sessions(student_id, started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_achievements_student ON achievements(student_id);
  `);
}
