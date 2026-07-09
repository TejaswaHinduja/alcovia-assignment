/**
 * Row → API-shape mappers. The DB stores snake_case columns and epoch-ms
 * timestamps; the API returns camelCase. Crucially, the sessions LIST keeps
 * timestamps as epoch-ms numbers, while the session DETAIL converts them to
 * ISO 8601 strings — this format flip is intentional (see API-SPEC.md).
 */

export interface StudentRow {
  id: string;
  name: string;
  initials: string;
  total_coins: number;
  current_streak: number;
  daily_goal: number;
  joined_at: string;
}

export interface SessionRow {
  id: string;
  student_id: string;
  type: string;
  duration_ms: number;
  coins: number;
  status: string;
  started_at: number;
  completed_at: number | null;
}

export interface TimelineRow {
  type: string;
  duration_ms: number;
  started_at: string;
}

export function toStudent(r: StudentRow) {
  return {
    id: r.id,
    name: r.name,
    initials: r.initials,
    totalCoins: r.total_coins,
    currentStreak: r.current_streak,
    dailyGoal: r.daily_goal,
    joinedAt: r.joined_at,
  };
}

/** List endpoint: timestamps stay as epoch-ms numbers. */
export function toSessionListItem(r: SessionRow) {
  return {
    id: r.id,
    studentId: r.student_id,
    type: r.type,
    durationMs: r.duration_ms,
    coins: r.coins,
    status: r.status,
    startedAt: r.started_at,
    completedAt: r.completed_at,
  };
}

/** Detail endpoint: timestamps become ISO 8601 strings. */
export function toSessionDetail(r: SessionRow, timeline: TimelineRow[]) {
  return {
    id: r.id,
    studentId: r.student_id,
    type: r.type,
    durationMs: r.duration_ms,
    coins: r.coins,
    status: r.status,
    startedAt: new Date(r.started_at).toISOString(),
    completedAt: r.completed_at != null ? new Date(r.completed_at).toISOString() : null,
    timeline: timeline.map((t) => ({
      type: t.type,
      durationMs: t.duration_ms,
      startedAt: t.started_at,
    })),
  };
}
