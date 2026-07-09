import { useMemo, useState } from 'react';
import { View,Text,StyleSheet,FlatList,Pressable,Modal,ActivityIndicator,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing } from '@/constants/Colors';
import { useAchievements } from '@/lib/useAchievements';
import { ErrorState } from '@/components/StateViews';
import { formatWhen } from '@/lib/format';
import type { Achievement } from '@/types/api';

export default function AchievementsScreen() {
  const { data, status, error, retry } = useAchievements();
  const [selected, setSelected] = useState<Achievement | null>(null);

  const unlockedCount = useMemo(() => data.filter((a) => a.unlockedAt).length, [data]);

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header unlocked={0} total={0} />
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header unlocked={0} total={0} />
        <ErrorState message={error ?? 'Failed to load achievements'} onRetry={retry} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={padToRows(data)}
        keyExtractor={(item, i) => item?.id ?? `spacer-${i}`}
        numColumns={3}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Header unlocked={unlockedCount} total={data.length} />
            <SummaryCard unlocked={unlockedCount} total={data.length} />
            <Text style={styles.sectionHead}>All Badges</Text>
          </>
        }
        renderItem={({ item }) =>
          item ? (
            <Badge achievement={item} onPress={() => setSelected(item)} />
          ) : (
            <View style={styles.badgeSpacer} />
          )
        }
      />

      <DetailModal achievement={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

/* -------------------- Header -------------------- */

function Header({ unlocked, total }: { unlocked: number; total: number }) {
  return (
    <View style={styles.header}>
      <Text style={styles.pageTitle}>Achievements</Text>
      <Text style={styles.subtitle}>
        {unlocked} of {total} unlocked
      </Text>
    </View>
  );
}

/* -------------------- Summary progress card -------------------- */

function SummaryCard({ unlocked, total }: { unlocked: number; total: number }) {
  const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
  return (
    <View style={styles.summary}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryTrophy}>
          <Ionicons name="trophy" size={22} color={Colors.amber} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryTitle}>Keep going!</Text>
          <Text style={styles.summarySub}>
            {total - unlocked} more to complete your collection
          </Text>
        </View>
        <Text style={styles.summaryPct}>{pct}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

/* -------------------- Badge -------------------- */

function Badge({ achievement, onPress }: { achievement: Achievement; onPress: () => void }) {
  const unlocked = !!achievement.unlockedAt;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.badge, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.badgeIcon, unlocked ? styles.badgeIconOn : styles.badgeIconOff]}>
        <Ionicons
          name={achievement.icon as keyof typeof Ionicons.glyphMap}
          size={22}
          color={unlocked ? Colors.primary : Colors.textTertiary}
        />
        {unlocked && (
          <View style={styles.checkDot}>
            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
          </View>
        )}
      </View>
      <Text style={[styles.badgeName, !unlocked && { color: Colors.textSecondary }]} numberOfLines={2}>
        {achievement.name}
      </Text>
      {unlocked ? (
        <Text style={styles.badgeUnlocked}>Unlocked</Text>
      ) : (
        <>
          <View style={styles.badgeTrack}>
            <View style={[styles.badgeFill, { width: `${achievement.progress}%` }]} />
          </View>
          <Text style={styles.badgeProgress}>
            {achievement.current}/{achievement.target}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/* -------------------- Detail modal -------------------- */

function DetailModal({
  achievement,
  onClose,
}: {
  achievement: Achievement | null;
  onClose: () => void;
}) {
  const unlocked = !!achievement?.unlockedAt;
  return (
    <Modal visible={!!achievement} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {achievement && (
            <>
              <View
                style={[styles.sheetIcon, unlocked ? styles.badgeIconOn : styles.badgeIconOff]}
              >
                <Ionicons
                  name={achievement.icon as keyof typeof Ionicons.glyphMap}
                  size={32}
                  color={unlocked ? Colors.primary : Colors.textTertiary}
                />
              </View>
              <Text style={styles.sheetTitle}>{achievement.name}</Text>
              <Text style={styles.sheetDesc}>{achievement.description}</Text>

              {unlocked ? (
                <View style={styles.sheetBadgeOn}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.sheetBadgeOnText}>
                    Unlocked · {formatWhen(achievement.unlockedAt as string)}
                  </Text>
                </View>
              ) : (
                <View style={{ width: '100%', marginTop: 4 }}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${achievement.progress}%` }]} />
                  </View>
                  <Text style={styles.sheetProgress}>
                    {achievement.current} / {achievement.target} · {achievement.progress}%
                  </Text>
                </View>
              )}

              <Pressable style={styles.sheetClose} onPress={onClose}>
                <Text style={styles.sheetCloseText}>Close</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* -------------------- helpers -------------------- */

// Pad the list so the final row always has 3 cells, keeping columns equal-width.
function padToRows(data: Achievement[]): (Achievement | null)[] {
  const remainder = data.length % 3;
  if (remainder === 0) return data;
  return [...data, ...Array(3 - remainder).fill(null)];
}

/* -------------------- styles -------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: Spacing.xs, marginBottom: Spacing.xl },
  pageTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textTertiary,
  },
  grid: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: 10,
  },

  summary: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.card,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: 14 },
  summaryTrophy: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.text },
  summarySub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  summaryPct: { fontFamily: 'Inter_800ExtraBold', fontSize: 18, color: Colors.primary },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.primary },

  sectionHead: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 14,
  },

 
  badge: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.statCard,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    ...Shadows.card,
  },
  badgeSpacer: { flex: 1 },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  badgeIconOn: { backgroundColor: Colors.primaryLight },
  badgeIconOff: { backgroundColor: Colors.background },
  checkDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  badgeName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
    minHeight: 30,
  },
  badgeUnlocked: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.success,
  },
  badgeTrack: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 4,
  },
  badgeFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.primary },
  badgeProgress: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: Colors.textTertiary,
  },

  // modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  sheet: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  sheetIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  sheetDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  sheetBadgeOn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sheetBadgeOnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.success,
  },
  sheetProgress: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  sheetClose: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.background,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  sheetCloseText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
});
