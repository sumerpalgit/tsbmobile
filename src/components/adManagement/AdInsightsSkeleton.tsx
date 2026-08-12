import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

/** Same opacity-pulse shimmer as `AdCampaignCardSkeleton.tsx`/`MemberCardSkeleton.tsx` — kept
 * local per that convention (not shared/exported across skeleton files). */
function Shimmer({ width, height, radius = 6 }: { width: number | `${number}%`; height: number; radius?: number }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceSunken }, { opacity }]} />;
}

/** Matches `AdInsightsScreen`'s real layout (hero + mini-stats, metric tabs, ranking list, status
 * donut, billing table, hourly placeholder) — this app's established loading convention is
 * skeleton UI over a card's real shape, not a spinner (`MemberCardSkeleton`/`AdCampaignCardSkeleton`
 * etc.), so this replaces the plain `ActivityIndicator` the screen used at first. */
export function AdInsightsSkeleton() {
  const { colors, radius, borderWidth } = useTheme();
  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }];

  return (
    <View style={styles.scroll}>
      <View style={card}>
        <Shimmer width="45%" height={10} />
        <Shimmer width="55%" height={34} />
        <Shimmer width="35%" height={11} />
        <View style={[styles.miniRow, { borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={{ flex: 1, gap: 5 }}>
              <Shimmer width="70%" height={8} />
              <Shimmer width="50%" height={14} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.tabsRow}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} width={78} height={34} radius={17} />
        ))}
      </View>

      <View style={card}>
        <Shimmer width="60%" height={16} />
        <View style={{ gap: 14, marginTop: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={{ gap: 6 }}>
              <Shimmer width="80%" height={12} />
              <Shimmer width="100%" height={5} radius={3} />
            </View>
          ))}
        </View>
      </View>

      <View style={card}>
        <Shimmer width="30%" height={16} />
        <View style={styles.donutRow}>
          <Shimmer width={108} height={108} radius={54} />
          <View style={{ flex: 1, gap: 9 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Shimmer key={i} width="90%" height={10} />
            ))}
          </View>
        </View>
      </View>

      <View style={card}>
        <Shimmer width="55%" height={16} />
        <View style={{ gap: 11, marginTop: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={styles.billingRow}>
              <Shimmer width="55%" height={13} />
              <Shimmer width={50} height={13} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 13,
  },
  card: {
    padding: 14,
    gap: 8,
  },
  miniRow: {
    flexDirection: 'row',
    marginTop: 13,
    paddingTop: 13,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 7,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 12,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
