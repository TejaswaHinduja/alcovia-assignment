import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from './api';
import type { SessionType } from '@/types/api';


export const SESSION_OPTIONS: { type: SessionType; minutes: number; coins: number }[] = [
  { type: 'deep_focus', minutes: 25, coins: 50 },
  { type: 'quick_sprint', minutes: 15, coins: 30 },
  { type: 'pomodoro', minutes: 25, coins: 50 },
];

export type SessionOption = (typeof SESSION_OPTIONS)[number];
export type TimerPhase = 'idle' | 'running' | 'paused' | 'saving' | 'done' | 'error';

interface TimerContextValue {
  option: SessionOption;
  phase: TimerPhase;
  secondsLeft: number;
  totalSeconds: number;
  coinsEarned: number;
  error: string | null;
  selectOption: (o: SessionOption) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  retrySave: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

/**
 * The timer lives HERE, at the app root, not inside the timer screen.
 */
export function TimerProvider({ children }: { children: ReactNode }) {
  const [option, setOption] = useState(SESSION_OPTIONS[0]);
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(SESSION_OPTIONS[0].minutes * 60);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [error, setError] = useState<string | null>(null);

  
  const startedAtRef = useRef<string>('');

  const totalSeconds = option.minutes * 60;

  useEffect(() => {
    if (phase !== 'running') return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running' && secondsLeft <= 0) saveSession();
  });

  async function saveSession() {
    setPhase('saving');
    try {
      const created = await api.createSession({
        type: option.type,
        durationMs: totalSeconds * 1000,
        timeline: [
          { type: 'focus', durationMs: totalSeconds * 1000, startedAt: startedAtRef.current },
        ],
      });
      setCoinsEarned(created.coins);
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save session');
      setPhase('error');
    }
  }

  function selectOption(o: SessionOption) {
    setOption(o);
    setSecondsLeft(o.minutes * 60);
  }

  function start() {
    startedAtRef.current = new Date().toISOString();
    setSecondsLeft(totalSeconds);
    setPhase('running');
  }

  function reset() {
    setPhase('idle');
    setSecondsLeft(totalSeconds);
    setError(null);
  }

  return (
    <TimerContext.Provider
      value={{
        option,
        phase,
        secondsLeft,
        totalSeconds,
        coinsEarned,
        error,
        selectOption,
        start,
        pause: () => setPhase('paused'),
        resume: () => setPhase('running'),
        reset,
        retrySave: saveSession,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used inside <TimerProvider>');
  return ctx;
}
