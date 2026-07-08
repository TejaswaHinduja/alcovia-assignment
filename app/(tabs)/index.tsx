import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Shadows, Radii, Spacing } from '@/constants/Colors';
import type { Student, WeeklyStats } from '@/types/api';

/**
 * Mock data shaped exactly like the API responses (GET /students/:id and
 * GET /students/:id/stats?period=week). The screen reads only from these
 * objects, so swapping in a real `fetch` later is a drop-in change.
 */
const student: Student = {
  id: 'stu_01',
  name: 'Arjun Mehta',
  initials: 'AM',
  totalCoins: 340,
  currentStreak: 5,
  dailyGoal: 3,
  joinedAt: '2026-05-15T10:00:00.000Z',
};

const stats: WeeklyStats = {
  totalSessions: 12,
  totalCoins: 340,
  streak: 5,
  todayCompleted: 2,
  dailyGoal: 3,
  sessionsPerDay: [
    { day: 'mon', count: 2 },
    { day: 'tue', count: 3 },
    { day: 'wed', count: 1 },
    { day: 'thu', count: 2 },
    { day: 'fri', count: 2 },
    { day: 'sat', count: 2 }, // current day (highlighted)
    { day: 'sun', count: 0 },
  ],
};

// The API sends the current day server-side; here we pin it to Saturday to
// mirror the design mockup.
const TODAY = 'sat';

export default function DashboardScreen() {
  const firstName = student.name.split(' ')[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Greeting ---- */}
        <View style={styles.greeting}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{student.initials}</Text>
          </View>
          <View>
            <Text style={styles.greetingTitle}>Hey, {firstName}</Text>
            <Text style={styles.greetingSubtitle}>Let's crush this week</Text>
          </View>
        </View>

        {/* ---- Stats row ---- */}
        <View style={styles.statsRow}>
          <StatCard tint="purple" icon="🎯" value={stats.totalSessions} label="Sessions" />
          <StatCard tint="green" icon="🪙" value={stats.totalCoins} label="Coins" />
          <StatCard tint="amber" icon="🔥" value={stats.streak} label="Day Streak" />
        </View>

        {/* ---- This Week chart ---- */}
        <Text style={styles.sectionHead}>This Week</Text>
        <WeekChart data={stats.sessionsPerDay} today={TODAY} />

        {/* ---- Today's Progress ---- */}
        <Text style={styles.sectionHead}>Today's Progress</Text>
        <ProgressCard done={stats.todayCompleted} goal={stats.dailyGoal} />

        {/* ---- CTA ---- */}
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={() => {
            // Navigates to the Focus Timer screen (built separately).
          }}
        >
          <Text style={styles.ctaText}>Start Session</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------- Stat card -------------------- */

type Tint = 'purple' | 'green' | 'amber';

function StatCard({ tint, icon, value, label }: { tint: Tint; icon: string; value: number; label: string }) {
  const bg =
    tint === 'purple' ? Colors.primaryLight : tint === 'green' ? Colors.successLight : Colors.amberLight;
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}



const CHART_HEIGHT = 100;

function WeekChart({ data, today }: { data: WeeklyStats['sessionsPerDay']; today: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <View style={styles.chart}>
      {data.map((d, i) => {
        const isToday = d.day === today;
        const barHeight = (d.count / max) * CHART_HEIGHT;
        return (
          <View key={i} style={styles.chartCol}>
            <View style={styles.chartTrack}>
              <View
                style={[
                  styles.chartBar,
                  { height: barHeight },
                  isToday && { backgroundColor: Colors.primary },
                ]}
              />
            </View>
            <Text style={[styles.chartDay, isToday && styles.chartDayToday]}>
              {d.day.charAt(0).toUpperCase()}
            </Text>
          </View>
        );
      })}
    </View>
  );
}



function ProgressCard({ done, goal }: { done: number; goal: number }) {
  const size = 72;
  const stroke = 7;
  const r = (100 - stroke) / 2; // radius in the 100x100 viewBox
  const circumference = 2 * Math.PI * r;
  const fraction = goal > 0 ? Math.min(done / goal, 1) : 0;
  const remaining = Math.max(goal - done, 0);

  return (
    <View style={styles.progressCard}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r={r} stroke={Colors.border} strokeWidth={stroke} fill="none" />
          <Circle
            cx="50"
            cy="50"
            r={r}
            stroke={Colors.primary}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference * fraction} ${circumference}`}
            transform="rotate(-90 50 50)"
          />
        </Svg>
        <View style={styles.ringLabel}>
          <Text style={styles.ringValue}>
            {done}/{goal}
          </Text>
          <Text style={styles.ringUnit}>sessions</Text>
        </View>
      </View>
      <View style={styles.progressText}>
        <Text style={styles.progressTitle}>{remaining === 0 ? 'Goal complete!' : 'Almost there!'}</Text>
        <Text style={styles.progressSubtitle}>
          {remaining === 0
            ? 'You hit your daily goal 🎉'
            : `${remaining} more session${remaining > 1 ? 's' : ''} to keep your streak alive`}
        </Text>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl, // 20
    paddingBottom: Spacing.xxl,
  },

  
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md, // 12
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl, // 24
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.primary,
  },
  greetingTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: Colors.text,
  },
  greetingSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },

 
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: Radii.statCard, // 14
  },
  statIcon: {
    fontSize: 18,
    marginBottom: Spacing.sm,
  },
  statNumber: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 26,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Section heading
  sectionHead: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 14,
  },

  // Chart
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm, // 8
    marginBottom: Spacing.xxl,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  chartTrack: {
    width: '100%',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: '100%',
    maxWidth: 36,
    minHeight: 4,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: Colors.primaryLight,
  },
  chartDay: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.textTertiary,
  },
  chartDayToday: {
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
  },

  // Progress card
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radii.card, // 16
    padding: Spacing.xl, // 20
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  ringLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18,
    color: Colors.text,
  },
  ringUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: Colors.textSecondary,
  },
  progressText: {
    flex: 1,
  },
  progressTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  progressSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // CTA
  cta: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.statCard, // 14
    paddingVertical: Spacing.lg, // 16
    alignItems: 'center',
    ...Shadows.cta,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
