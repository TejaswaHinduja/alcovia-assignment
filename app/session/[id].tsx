import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing } from '@/constants/Colors';
import { api } from '@/lib/api';
import { SESSION_VISUALS, titleCaseType, formatDuration, formatWhen } from '@/lib/format';
import { ErrorState } from '@/components/StateViews';
import type { SessionDetail, TimelineEntry } from '@/types/api';

const TINT_BG = {
  purple: Colors.primaryLight,
  green: Colors.successLight,
  amber: Colors.amberLight,
};

type Status = 'loading' | 'ready' | 'error';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      setSession(await api.getSession(id));
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load session');
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Session Detail</Text>
      </View>

      {status === 'loading' ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} />
      ) : status === 'error' || !session ? (
        <ErrorState message={error ?? 'Failed to load session'} onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SummaryCard session={session} />

          <Text style={styles.sectionHead}>Timeline</Text>
          {session.timeline.length === 0 ? (
            <Text style={styles.timelineEmpty}>No timeline recorded for this session.</Text>
          ) : (
            session.timeline.map((entry, i) => <TimelineRow key={i} entry={entry} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}



function SummaryCard({ session }: { session: SessionDetail }) {
  const visual = SESSION_VISUALS[session.type];
  const completed = session.status === 'completed';

  return (
    <View style={styles.summary}>
      <View style={styles.summaryTop}>
        <View style={[styles.summaryIcon, { backgroundColor: TINT_BG[visual.tint] }]}>
          <Text style={{ fontSize: 24 }}>{visual.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryTitle}>{titleCaseType(session.type)}</Text>
          <Text style={styles.summaryMeta}>{formatWhen(session.startedAt)}</Text>
        </View>
        <View style={[styles.statusChip, completed ? styles.statusDone : styles.statusAbandoned]}>
          <Text style={[styles.statusText, { color: completed ? Colors.success : Colors.error }]}>
            {completed ? 'Completed' : 'Abandoned'}
          </Text>
        </View>
      </View>

      <View style={styles.summaryStats}>
        <Stat label="Duration" value={formatDuration(session.durationMs)} />
        <Stat label="Coins" value={`+${session.coins}`} />
        <Stat
          label="Finished"
          value={session.completedAt ? formatWhen(session.completedAt).split(', ')[1] : '—'}
        />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}


function TimelineRow({ entry }: { entry: TimelineEntry }) {
  const isFocus = entry.type === 'focus';
  return (
    <View style={styles.timelineRow}>
      <View
        style={[
          styles.timelineDot,
          { backgroundColor: isFocus ? Colors.primaryLight : Colors.amberLight },
        ]}
      >
        <Ionicons
          name={isFocus ? 'flash' : 'cafe'}
          size={14}
          color={isFocus ? Colors.primary : Colors.amber}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.timelineType}>{isFocus ? 'Focus' : 'Break'}</Text>
        <Text style={styles.timelineMeta}>{formatWhen(entry.startedAt)}</Text>
      </View>
      <Text style={styles.timelineDuration}>{formatDuration(entry.durationMs)}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  topTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.text,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },

  summary: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.card,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    ...Shadows.card,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.text,
  },
  summaryMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statusChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
  },
  statusDone: { backgroundColor: Colors.successLight },
  statusAbandoned: { backgroundColor: '#FEE2E2' },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  summaryStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  sectionHead: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 14,
  },
  timelineEmpty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textTertiary,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.statCard,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    marginBottom: 10,
    ...Shadows.card,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineType: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  timelineMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  timelineDuration: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
