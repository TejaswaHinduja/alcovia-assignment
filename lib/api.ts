import Constants from 'expo-constants';
import type {Student,Session,SessionDetail,SessionType,Achievement,WeeklyStats,PaginatedResponse,} from '@/types/api';

const hostUri = Constants.expoConfig?.hostUri;
const host = hostUri?.split(':')[0] ?? 'localhost';
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? `http://${host}:3000/api`;

export const STUDENT_ID = 'stu_01';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {

    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

const get = <T>(path: string) => request<T>(path);

const post = <T>(path: string, body: unknown) =>
  request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export interface SessionQuery {
  filter?: 'today' | 'week' | 'month';
  cursor?: string | null;
  limit?: number;
}

export interface NewSession {
  type: SessionType;
  durationMs: number;
  timeline: { type: 'focus' | 'break'; durationMs: number; startedAt: string }[];
}

export const api = {
  getStudent: (id: string = STUDENT_ID) => get<Student>(`/students/${id}`),

  getSessions: ({ filter, cursor, limit }: SessionQuery = {}) => {
    const qs = new URLSearchParams();
    if (filter) qs.set('filter', filter);
    if (cursor) qs.set('cursor', cursor);
    if (limit) qs.set('limit', String(limit));
    const q = qs.toString();
    return get<PaginatedResponse<Session>>(`/students/${STUDENT_ID}/sessions${q ? `?${q}` : ''}`);
  },

  getSession: (sessionId: string) =>
    get<SessionDetail>(`/students/${STUDENT_ID}/sessions/${sessionId}`),

  getAchievements: () => get<Achievement[]>(`/students/${STUDENT_ID}/achievements`),

  getStats: () => get<WeeklyStats>(`/students/${STUDENT_ID}/stats?period=week`),

  createSession: (session: NewSession) =>
    post<SessionDetail>(`/students/${STUDENT_ID}/sessions`, session),
};
