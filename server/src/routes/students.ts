import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { encodeCursor, decodeCursor } from '../lib/pagination';
import { getReferenceNow, filterBounds, weekBounds, dayBounds } from '../lib/time';
import {toStudent,toSessionListItem,toSessionDetail,type StudentRow,type SessionRow,type TimelineRow,} from '../lib/mappers';

const router = Router();

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const COINS_BY_TYPE: Record<string, number> = {
  deep_focus: 50,
  quick_sprint: 30,
  pomodoro: 50,
};
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] ;

/** Small helpers for consistent error shapes. */
function fail(res: Response, status: number, code: string, error: string) {
  res.status(status).json({ error, code });
}
function findStudent(id: string): StudentRow | undefined {
  return getDb().prepare('SELECT * FROM students WHERE id = ?').get(id) as StudentRow | undefined;
}


// GET /students/:id

router.get('/:id', (req: Request, res: Response) => {
  const student = findStudent(req.params.id);
  if (!student) return fail(res, 404, 'NOT_FOUND', 'Student not found');
  res.json(toStudent(student));
});


// GET /students/:id/sessions   (cursor pagination + filter)

router.get('/:id/sessions', (req: Request, res: Response) => {
  const { id } = req.params;
  if (!findStudent(id)) return fail(res, 404, 'NOT_FOUND', 'Student not found');

  
  let limit = DEFAULT_LIMIT;
  if (req.query.limit !== undefined) {
    const parsed = Number(req.query.limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
      return fail(res, 400, 'BAD_REQUEST', `limit must be an integer between 1 and ${MAX_LIMIT}`);
    }
    limit = parsed;
  }

  let bounds: [number, number] | null;
  try {
    bounds = filterBounds(req.query.filter as string | undefined, getReferenceNow(id));
  } catch {
    return fail(res, 400, 'BAD_REQUEST', 'filter must be one of: today, week, month');
  }

  
  const clauses = ['student_id = ?'];
  const args: (string | number)[] = [id];
  if (bounds) {
    clauses.push('started_at >= ? AND started_at < ?');
    args.push(bounds[0], bounds[1]);
  }
  if (req.query.cursor !== undefined) {
    try {
      const c = decodeCursor(String(req.query.cursor));
      // rows are ordered started_at DESC, id DESC → fetch the "next" ones
      clauses.push('(started_at < ? OR (started_at = ? AND id < ?))');
      args.push(c.startedAt, c.startedAt, c.id);
    } catch {
      return fail(res, 400, 'BAD_REQUEST', 'Invalid cursor');
    }
  }

  // fetch limit + 1 to know whether another page exists
  const rows = getDb()
    .prepare(
      `SELECT * FROM sessions WHERE ${clauses.join(' AND ')}
       ORDER BY started_at DESC, id DESC LIMIT ?`
    )
    .all(...args, limit + 1) as SessionRow[];

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  res.json({
    data: page.map(toSessionListItem),
    cursor: hasMore && last ? encodeCursor({ startedAt: last.started_at, id: last.id }) : null,
    hasMore,
  });
});


// GET /students/:id/sessions/:sessionId   (ISO dates + timeline)

router.get('/:id/sessions/:sessionId', (req: Request, res: Response) => {
  const { id, sessionId } = req.params;
  if (!findStudent(id)) return fail(res, 404, 'NOT_FOUND', 'Student not found');

  const session = getDb()
    .prepare('SELECT * FROM sessions WHERE id = ? AND student_id = ?')
    .get(sessionId, id) as SessionRow | undefined;
  if (!session) return fail(res, 404, 'NOT_FOUND', 'Session not found');

  const timeline = getDb()
    .prepare('SELECT type, duration_ms, started_at FROM session_timeline WHERE session_id = ? ORDER BY id')
    .all(sessionId) as TimelineRow[];

  res.json(toSessionDetail(session, timeline));
});


// GET /students/:id/stats?period=week

router.get('/:id/stats', (req: Request, res: Response) => {
  const { id } = req.params;
  const student = findStudent(id);
  if (!student) return fail(res, 404, 'NOT_FOUND', 'Student not found');

  const refNow = getReferenceNow(id);
  const [weekStart, weekEnd] = weekBounds(refNow);
  const [todayStart, todayEnd] = dayBounds(refNow);

  const weekRows = getDb()
    .prepare(
      `SELECT started_at FROM sessions
       WHERE student_id = ? AND status = 'completed' AND started_at >= ? AND started_at < ?`
    )
    .all(id, weekStart, weekEnd) as { started_at: number }[];

  // bucket by weekday
  const counts: Record<string, number> = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
  for (const r of weekRows) {
    counts[DAY_KEYS[new Date(r.started_at).getUTCDay()]]++;
  }
  const sessionsPerDay = (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((day) => ({
    day,
    count: counts[day],
  }));

  const todayCompleted = weekRows.filter(
    (r) => r.started_at >= todayStart && r.started_at < todayEnd
  ).length;

  res.json({
    totalSessions: weekRows.length,
    totalCoins: student.total_coins,
    streak: student.current_streak,
    todayCompleted,
    dailyGoal: student.daily_goal,
    sessionsPerDay,
  });
});


router.post('/:id/sessions', (req: Request, res: Response) => {
  const { id } = req.params;
  const student = findStudent(id);
  if (!student) return fail(res, 404, 'NOT_FOUND', 'Student not found');

  const { type, durationMs, timeline } = req.body ?? {};
  if (!type || !(type in COINS_BY_TYPE)) {
    return fail(res, 400, 'BAD_REQUEST', 'type must be deep_focus, quick_sprint, or pomodoro');
  }
  if (typeof durationMs !== 'number' || durationMs <= 0) {
    return fail(res, 400, 'BAD_REQUEST', 'durationMs must be a positive number');
  }

  const db = getDb();
  const now = Date.now();
  const sessionId = `ses_${randomUUID().slice(0, 8)}`;
  const coins = COINS_BY_TYPE[type];

  const insert = db.transaction(() => {
    db.prepare(
      `INSERT INTO sessions (id, student_id, type, duration_ms, coins, status, started_at, completed_at)
       VALUES (?, ?, ?, ?, ?, 'completed', ?, ?)`
    ).run(sessionId, id, type, durationMs, coins, now, now);

    if (Array.isArray(timeline)) {
      const ins = db.prepare(
        'INSERT INTO session_timeline (session_id, type, duration_ms, started_at) VALUES (?, ?, ?, ?)'
      );
      for (const t of timeline) {
        ins.run(sessionId, t.type, t.durationMs, t.startedAt);
      }
    }
    db.prepare('UPDATE students SET total_coins = total_coins + ? WHERE id = ?').run(coins, id);
  });
  insert();

  maybeFireStreakWebhook(id, student.name, student.current_streak);

  const created = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as SessionRow;
  const tl = db
    .prepare('SELECT type, duration_ms, started_at FROM session_timeline WHERE session_id = ? ORDER BY id')
    .all(sessionId) as TimelineRow[];
  res.status(201).json(toSessionDetail(created, tl));
});

/**
 * Idempotent by design: the streak_notifications table has UNIQUE(student_id, day),
 * so INSERT OR IGNORE only "wins" once per student per day — we fire the webhook
 * only on that winning insert.
 */
function maybeFireStreakWebhook(studentId: string, studentName: string, streak: number) {
  const db = getDb();
  const [start, end] = dayBounds(Date.now());
  const { c: sessionsToday } = db
    .prepare(
      `SELECT COUNT(*) AS c FROM sessions
       WHERE student_id = ? AND status = 'completed' AND started_at >= ? AND started_at < ?`
    )
    .get(studentId, start, end) as { c: number };

  if (sessionsToday < 3) return;

  const day = new Date().toISOString().slice(0, 10);
  const result = db
    .prepare('INSERT OR IGNORE INTO streak_notifications (student_id, day, notified_at) VALUES (?, ?, ?)')
    .run(studentId, day, new Date().toISOString());
  if (result.changes === 0) return; // already notified today

  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return; // webhook not configured — notification is still recorded
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, studentName, sessionsToday, streak, date: day }),
  }).catch((err) => console.error('Streak webhook failed:', err));
}

export default router;
