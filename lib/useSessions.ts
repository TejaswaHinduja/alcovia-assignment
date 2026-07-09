import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type SessionQuery } from './api';
import type { Session } from '@/types/api';

export type SessionFilter = SessionQuery['filter'];
type Status = 'loading' | 'ready' | 'error';

/**
 * Owns all of the History screen's data concerns: first load, filter switching,
 * pull-to-refresh, and cursor-based infinite scroll. A monotonically increasing
 * request id guards against out-of-order responses (e.g. tapping filters fast).
 */
export function useSessions(initialFilter: SessionFilter = 'week') {
  const [filter, setFilter] = useState<SessionFilter>(initialFilter);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const reqId = useRef(0);

  const load = useCallback(async (f: SessionFilter, mode: 'initial' | 'refresh') => {
    const id = ++reqId.current;
    if (mode === 'initial') setStatus('loading');
    else setRefreshing(true);
    setError(null);
    try {
      const res = await api.getSessions({ filter: f });
      if (id !== reqId.current) return; // a newer request superseded this one
      setSessions(res.data);
      setCursor(res.cursor);
      setHasMore(res.hasMore);
      setStatus('ready');
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load sessions');
      setStatus('error');
    } finally {
      if (id === reqId.current) setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || status !== 'ready') return;
    const id = reqId.current;
    setLoadingMore(true);
    try {
      const res = await api.getSessions({ filter, cursor });
      if (id !== reqId.current) return; // filter changed mid-flight — drop this page
      setSessions((prev) => [...prev, ...res.data]);
      setCursor(res.cursor);
      setHasMore(res.hasMore);
    } catch {
      // Keep the list we already have; the footer just stops.
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [filter, cursor, hasMore, loadingMore, status]);

  const changeFilter = useCallback(
    (f: SessionFilter) => {
      if (f === filter) return;
      setFilter(f);
      setSessions([]);
      load(f, 'initial');
    },
    [filter, load]
  );

  const refresh = useCallback(() => load(filter, 'refresh'), [filter, load]);
  const retry = useCallback(() => load(filter, 'initial'), [filter, load]);

  useEffect(() => {
    load(initialFilter, 'initial');
  }, [load, initialFilter]);

  return {
    filter,
    changeFilter,
    sessions,
    status,
    error,
    refreshing,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
    retry,
  };
}
