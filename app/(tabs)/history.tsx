import { useEffect, useRef } from 'react';
import {View,Text,StyleSheet,FlatList,Pressable,RefreshControl,ActivityIndicator,Animated,ScrollView,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radii, Shadows, Spacing } from '@/constants/Colors';
import { useSessions, type SessionFilter } from '@/lib/useSessions';
import { SESSION_VISUALS, titleCaseType, formatDuration, formatWhen } from '@/lib/format';
import { EmptyState, ErrorState } from '@/components/StateViews';
import type { Session } from '@/types/api';

const FILTERS: { label: string; value: SessionFilter }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All', value: undefined },
];

const TINT_BG = {
  purple: Colors.primaryLight,
  green: Colors.successLight,
  amber: Colors.amberLight,
};

export default function HistoryScreen() {
  const router = useRouter();
  const {filter,changeFilter,sessions,status,error,refreshing,loadingMore,hasMore,loadMore,refresh,retry,} = useSessions('week');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>History</Text>

      {/* Filter pills stay interactive in every state.
          flexGrow: 0 keeps the ScrollView at its natural height — without it,
          the list below squeezes the pills until the text is clipped. */}
      <ScrollView
        horizontal
        style={styles.filtersBar}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((f) => {
          const active = f.value === filter;
          return (
            <Pressable
              key={f.label}
              onPress={() => changeFilter(f.value)}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {status === 'loading' ? (
        <SkeletonList />
      ) : status === 'error' ? (
        <ErrorState message={error ?? 'Failed to load sessions'} onRetry={retry} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SessionCard session={item} onPress={() => router.push(`/session/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyState
              icon="time-outline"
              title="No sessions yet"
              subtitle="Sessions you complete will show up here."
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.primary} />
            ) : !hasMore && sessions.length > 0 ? (
              <Text style={styles.endText}>You're all caught up</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

/* -------------------- Session card -------------------- */

function SessionCard({ session, onPress }: { session: Session; onPress: () => void }) {
  const visual = SESSION_VISUALS[session.type];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.cardIcon, { backgroundColor: TINT_BG[visual.tint] }]}>
        <Text style={{ fontSize: 18 }}>{visual.icon}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{titleCaseType(session.type)}</Text>
        <Text style={styles.cardMeta}>
          {formatDuration(session.durationMs)} · {formatWhen(session.startedAt)}
        </Text>
      </View>
      <Text style={styles.cardCoins}>+{session.coins}</Text>
    </Pressable>
  );
}

/* -------------------- Loading skeleton -------------------- */

function SkeletonList() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.list}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Animated.View key={i} style={[styles.card, { opacity }]}>
          <View style={[styles.cardIcon, styles.skelBlock]} />
          <View style={styles.cardInfo}>
            <View style={[styles.skelBlock, styles.skelLineWide]} />
            <View style={[styles.skelBlock, styles.skelLineNarrow]} />
          </View>
          <View style={[styles.skelBlock, styles.skelCoins]} />
        </Animated.View>
      ))}
    </View>
  );
}

/* -------------------- Styles -------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pageTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: Colors.text,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  filtersBar: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filters: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.statCard,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    marginBottom: 10,
    ...Shadows.card,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, minWidth: 0, gap: 3 },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  cardMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textTertiary,
  },
  cardCoins: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: Colors.success,
  },
  endText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  // skeleton
  skelBlock: {
    backgroundColor: Colors.border,
    borderRadius: 6,
  },
  skelLineWide: { height: 13, width: '55%' },
  skelLineNarrow: { height: 11, width: '35%' },
  skelCoins: { height: 14, width: 34 },
});
