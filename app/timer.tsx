import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Radii, Shadows, Spacing } from '@/constants/Colors';
import { useTimer, SESSION_OPTIONS } from '@/lib/TimerContext';
import { SESSION_VISUALS, titleCaseType } from '@/lib/format';

const TINT_BG = {
  purple: Colors.primaryLight,
  green: Colors.successLight,
  amber: Colors.amberLight,
};

export default function TimerScreen() {
  const router = useRouter();
  const {
    option,
    phase,
    secondsLeft,
    totalSeconds,
    coinsEarned,
    error,
    selectOption,
    start,
    pause,
    resume,
    reset,
    retrySave,
  } = useTimer();

  const minutes = Math.floor(Math.max(secondsLeft, 0) / 60);
  const seconds = Math.max(secondsLeft, 0) % 60;
  const progress = phase === 'idle' ? 0 : 1 - Math.max(secondsLeft, 0) / totalSeconds;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Focus Timer</Text>
      </View>

      {phase === 'done' ? (
        <DoneView
          coins={coinsEarned}
          onClose={() => {
            reset();
            router.back();
          }}
        />
      ) : (
        <View style={styles.body}>
          {/* Session type picker — locked once the timer starts */}
          <View style={styles.options}>
            {SESSION_OPTIONS.map((o) => {
              const visual = SESSION_VISUALS[o.type];
              const active = o.type === option.type;
              return (
                <Pressable
                  key={o.type}
                  disabled={phase !== 'idle'}
                  onPress={() => selectOption(o)}
                  style={[
                    styles.option,
                    active && styles.optionActive,
                    phase !== 'idle' && !active && { opacity: 0.4 },
                  ]}
                >
                  <View style={[styles.optionIcon, { backgroundColor: TINT_BG[visual.tint] }]}>
                    <Text style={{ fontSize: 16 }}>{visual.icon}</Text>
                  </View>
                  <Text style={styles.optionName}>{titleCaseType(o.type)}</Text>
                  <Text style={styles.optionMeta}>
                    {o.minutes} min · +{o.coins}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Countdown ring */}
          <View style={styles.ringWrap}>
            <TimerRing progress={progress} />
            <View style={styles.ringLabel}>
              <Text style={styles.time}>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.timeSub}>
                {phase === 'paused' ? 'Paused' : phase === 'running' ? 'Stay focused' : 'Ready?'}
              </Text>
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          {/* Controls */}
          {phase === 'idle' ? (
            <Pressable style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]} onPress={start}>
              <Text style={styles.ctaText}>Start {titleCaseType(option.type)}</Text>
            </Pressable>
          ) : phase === 'saving' ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
          ) : phase === 'error' ? (
            <Pressable style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]} onPress={retrySave}>
              <Text style={styles.ctaText}>Retry Save</Text>
            </Pressable>
          ) : (
            <View style={styles.controls}>
              <Pressable style={styles.secondaryBtn} onPress={reset}>
                <Ionicons name="close" size={18} color={Colors.textSecondary} />
                <Text style={styles.secondaryText}>Give Up</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.cta, { flex: 1 }, pressed && { opacity: 0.9 }]}
                onPress={phase === 'running' ? pause : resume}
              >
                <Text style={styles.ctaText}>{phase === 'running' ? 'Pause' : 'Resume'}</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

/* -------------------- Countdown ring -------------------- */

function TimerRing({ progress }: { progress: number }) {
  const size = 240;
  const stroke = 8;
  const r = (100 - stroke) / 2; // radius in the 100x100 viewBox
  const circumference = 2 * Math.PI * r;

  return (
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
        strokeDasharray={`${circumference * progress} ${circumference}`}
        transform="rotate(-90 50 50)"
      />
    </Svg>
  );
}

/* -------------------- Completion view -------------------- */

function DoneView({ coins, onClose }: { coins: number; onClose: () => void }) {
  return (
    <View style={styles.doneWrap}>
      <View style={styles.doneIcon}>
        <Ionicons name="checkmark" size={40} color={Colors.success} />
      </View>
      <Text style={styles.doneTitle}>Session complete!</Text>
      <Text style={styles.doneSub}>Great work — you earned</Text>
      <Text style={styles.doneCoins}>+{coins} coins</Text>
      <Pressable style={({ pressed }) => [styles.cta, { alignSelf: 'stretch' }, pressed && { opacity: 0.9 }]} onPress={onClose}>
        <Text style={styles.ctaText}>Done</Text>
      </Pressable>
    </View>
  );
}

/* -------------------- Styles -------------------- */

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
  body: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },

  options: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.xxl,
  },
  option: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.statCard,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    ...Shadows.card,
  },
  optionActive: {
    borderColor: Colors.primary,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  optionName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
  },
  optionMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  ringLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 48,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  timeSub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  error: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  controls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cta: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.statCard,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.cta,
  },
  ctaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radii.statCard,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
  },

  doneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 60,
  },
  doneIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  doneTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: Colors.text,
    marginBottom: 4,
  },
  doneSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  doneCoins: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    color: Colors.success,
    marginVertical: Spacing.lg,
  },
});
