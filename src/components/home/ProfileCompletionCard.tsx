import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import { useProfileCompletion } from '../../hooks/useProfileCompletion';
import { Icon } from '../icons/Icon';

const DISMISSED_KEY = 'profileCompletionBannerDismissed';

/** `linear-gradient(140deg, ...)`'s direction as `react-native-linear-gradient`'s normalized
 * `start`/`end` points: CSS angles are measured clockwise from "up" (0deg), so the direction
 * vector is `(sin(a), -cos(a))`, centered in the unit square. 140deg points down-and-right,
 * matching the reference's white-top-left → gold-cream-bottom-right card background. */
const GRADIENT_START = { x: 0.18, y: 0.12 };
const GRADIENT_END = { x: 0.82, y: 0.88 };

/**
 * "Complete your profile" nudge card — matches the app bar/drawer/home reference (`TSB Home
 * FV.html`)'s mockup exactly for layout/copy: icon badge, title + description, dismiss button,
 * a "Profile strength" progress bar, and a full-width dark CTA that navigates to the profile
 * screen. webSrc's dashboard banner (`webSrc/src/app/dashboard/page.tsx`) is closely related but
 * NOT the visual source here — its copy/CTA styling differ slightly (e.g. "actively looking",
 * a compact gold button) from the mockup, and the mockup wins per project convention. The card
 * background is the mockup's exact `linear-gradient(140deg, var(--surf) 0%, var(--chip) 130%)`
 * (`react-native-linear-gradient`, added for this — RN has no gradient primitive built in,
 * unlike `colors.avatarFallback`'s flat approximation elsewhere) — `--chip` matches the existing
 * `colors.chip` token exactly in both themes; the `130%` second stop (past the gradient line's
 * end) is simplified to a plain `100%` stop since the softening it produces is negligible at this
 * card's size.
 *
 * Self-contained: fetches its own completion percentage (`useProfileCompletion`) and persists
 * its own dismissed state (`AsyncStorage`, mirroring web's `localStorage` flag), the same way
 * `DrawerContent` fetches its own `useMe()` rather than receiving it as a prop. Hidden entirely
 * while completion/dismissed state is still loading, once dismissed, or once the profile is
 * 100% complete — same conditions as web's `!bannerDismissed && completion_percentage < 100`.
 */
export function ProfileCompletionCard({ onCompleteProfile }: { onCompleteProfile: () => void }) {
  const { colors, fonts, fontSize, spacing, radius, borderWidth } = useTheme();
  const { data } = useProfileCompletion();
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(DISMISSED_KEY)
      .then(stored => {
        if (!cancelled) setDismissed(stored === '1');
      })
      .catch(() => {
        if (!cancelled) setDismissed(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    AsyncStorage.setItem(DISMISSED_KEY, '1').catch(() => {
      // Dismissed for this session either way; a failed write just means it
      // reappears next launch.
    });
  };

  if (dismissed !== false || !data || data.completionPercentage >= 100) {
    return null;
  }

  const pct = Math.max(0, Math.min(100, Math.round(data.completionPercentage)));

  return (
    <LinearGradient
      colors={[colors.surface, colors.chip]}
      start={GRADIENT_START}
      end={GRADIENT_END}
      style={[
        styles.card,
        {
          borderColor: colors.homeCardBorder,
          borderWidth: borderWidth.thin,
          borderRadius: 18,
          padding: spacing.lg,
          gap: spacing.md,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.gold, borderRadius: 10 }]}>
          <Icon name="star" size={19} color={colors.onGold} />
        </View>

        <View style={styles.meta}>
          <Text style={[fonts.bold, styles.title, { color: colors.ink }]}>Complete your profile</Text>
          <Text style={[fonts.regular, styles.description, { color: colors.ink2 }]}>
            Unlock AI matching and get discovered by investors looking for searchers like you.
          </Text>
        </View>

        <Pressable
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={8}
          style={({ pressed }) => [
            styles.closeButton,
            { backgroundColor: pressed ? colors.surface : 'transparent' },
          ]}
        >
          <Icon name="close" size={13} color={colors.ink3} />
        </Pressable>
      </View>

      <View style={styles.progressRow}>
        <Text style={[fonts.medium, styles.progressLabel, { color: colors.ink3 }]}>Profile strength</Text>
        <View style={[styles.track, { backgroundColor: colors.goldExtraLight, borderRadius: radius.sm }]}>
          <View
            style={[
              styles.fill,
              { width: `${pct}%`, backgroundColor: colors.gold, borderRadius: radius.sm },
            ]}
          />
        </View>
        <Text style={[fonts.bold, styles.progressPct, { color: colors.goldDark, fontSize: fontSize.body }]}>
          {pct}%
        </Text>
      </View>

      <Pressable
        onPress={onCompleteProfile}
        accessibilityRole="button"
        style={[styles.cta, { backgroundColor: colors.accentSolid, borderRadius: radius.xl }]}
      >
        <Text style={[fonts.bold, styles.ctaLabel, { color: colors.onAccent }]}>Complete profile</Text>
        <Icon name="arrowRight" size={15} color={colors.onAccent} strokeWidth={1.8} />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
  },
  iconBadge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
  },
  title: {
    fontSize: 16.5,
    marginBottom: 3,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressLabel: {
    fontSize: 11,
  },
  track: {
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  progressPct: {
    fontVariant: ['tabular-nums'],
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    width: '100%',
  },
  ctaLabel: {
    fontSize: 14.5,
  },
});
