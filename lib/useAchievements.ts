import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import type { Achievement } from '@/types/api';

type Status = 'loading' | 'ready' | 'error';

export function useAchievements() {
  const [data, setData] = useState<Achievement[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      setData(await api.getAchievements());
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load achievements');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, status, error, retry: load };
}
