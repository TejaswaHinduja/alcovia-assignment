import { initDb, getDb } from './db';
import students from '../fixtures/students.json';
import sessions from '../fixtures/sessions.json';
import achievements from '../fixtures/achievements.json';

initDb();
const db = getDb();

db.exec('DELETE FROM session_timeline');
db.exec('DELETE FROM streak_notifications');
db.exec('DELETE FROM achievements');
db.exec('DELETE FROM sessions');
db.exec('DELETE FROM students');

const insertStudent = db.prepare(`
  INSERT INTO students (id, name, initials, total_coins, current_streak, daily_goal, joined_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertSession = db.prepare(`
  INSERT INTO sessions (id, student_id, type, duration_ms, coins, status, started_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertTimeline = db.prepare(`
  INSERT INTO session_timeline (session_id, type, duration_ms, started_at)
  VALUES (?, ?, ?, ?)
`);

const insertAchievement = db.prepare(`
  INSERT INTO achievements (id, name, description, icon, student_id, unlocked_at, progress, target, current)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const seedAll = db.transaction(() => {
  for (const s of students) {
    insertStudent.run(s.id, s.name, s.initials, s.totalCoins, s.currentStreak, s.dailyGoal, s.joinedAt);
  }

  for (const s of sessions) {
    insertSession.run(s.id, s.studentId, s.type, s.durationMs, s.coins, s.status, s.startedAt, s.completedAt);
    if (s.timeline) {
      for (const t of s.timeline) {
        insertTimeline.run(s.id, t.type, t.durationMs, t.startedAt);
      }
    }
  }

  for (const a of achievements) {
    insertAchievement.run(a.id, a.name, a.description, a.icon, a.studentId, a.unlockedAt, a.progress, a.target, a.current);
  }
});

seedAll();
console.log(`Seeded: ${students.length} students, ${sessions.length} sessions, ${achievements.length} achievements`);
