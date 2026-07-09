import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { api } from './api';
import type { Student, WeeklyStats } from '@/types/api';

type Status = 'loading' | 'ready' | 'error';

/**
 * Loads the student profile and weekly stats together. Reloads every time the
 * Dashboard tab regains focus, so numbers stay fresh after a timer session —
 * silently once data is already on screen (no skeleton flash).
 */
export function useDashboard() {
  const [student, setStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, w] = await Promise.all([api.getStudent(), api.getStats()]);
      setStudent(s);
      setStats(w);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      setStatus('error');
    }
  }, []);

  const retry = useCallback(() => {
    setStatus('loading');
    setError(null);
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { student, stats, status, error, retry };
}
