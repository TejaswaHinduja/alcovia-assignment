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

// The fixture dates are fixed, so they drift into the past as real time moves
// on. Shift every timestamp by the same amount so the newest session happened

const newestStartedAt = Math.max(...sessions.map((s) => s.startedAt));
const offset = Date.now() - newestStartedAt;

const seedAll = db.transaction(() => {
  for (const s of students) {
    insertStudent.run(s.id, s.name, s.initials, s.totalCoins, s.currentStreak, s.dailyGoal, s.joinedAt);
  }

  for (const s of sessions) {
    const newStartedAt = s.startedAt + offset;
    insertSession.run(
      s.id, s.studentId, s.type, s.durationMs, s.coins, s.status,
      newStartedAt,
      s.completedAt == null ? null : s.completedAt + offset
    );
    if (s.timeline && s.timeline.length > 0) {
      // Timeline entries start at the session's (shifted) start time,
      // keeping the original gaps between focus/break blocks.
      const firstEntry = new Date(s.timeline[0].startedAt).getTime();
      for (const t of s.timeline) {
        const gap = new Date(t.startedAt).getTime() - firstEntry;
        insertTimeline.run(s.id, t.type, t.durationMs, new Date(newStartedAt + gap).toISOString());
      }
    }
  }

  for (const a of achievements) {
    insertAchievement.run(a.id, a.name, a.description, a.icon, a.studentId, a.unlockedAt, a.progress, a.target, a.current);
  }
});

seedAll();
console.log(`Seeded: ${students.length} students, ${sessions.length} sessions, ${achievements.length} achievements`);
