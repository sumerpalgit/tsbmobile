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

/** Matches `AdCampaignDetailScreen`'s real layout (header card, metrics grid, creative,
 * targeting/schedule, activity) — this app's established loading convention is skeleton UI over a
 * card's real shape, not a spinner, so this replaces the plain `ActivityIndicator` the screen used
 * at first. */
export function AdCampaignDetailSkeleton() {
  const { colors, radius, borderWidth } = useTheme();
  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }];

  return (
    <View style={styles.scroll}>
      <View style={card}>
        <View style={styles.headerRow}>
          <Shimmer width={52} height={52} radius={radius.lg} />
          <View style={{ flex: 1, gap: 7 }}>
            <Shimmer width="40%" height={9} />
            <Shimmer width="70%" height={19} />
          </View>
        </View>
        <View style={styles.metaRow}>
          <Shimmer width={70} height={20} radius={6} />
          <Shimmer width={100} height={11} />
        </View>
        <Shimmer width="55%" height={11} />
        <View style={styles.actionsRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Shimmer key={i} width="100%" height={40} radius={radius.lg} />
          ))}
        </View>
      </View>

      <View
        style={[
          styles.metricsGrid,
          { borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin, backgroundColor: colors.surface },
        ]}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.metricCell}>
            <Shimmer width="60%" height={8} />
            <Shimmer width="45%" height={18} />
          </View>
        ))}
      </View>

      <View style={card}>
        <Shimmer width="45%" height={16} />
        <Shimmer width="65%" height={11} />
        <Shimmer width="100%" height={100} radius={radius.lg} />
      </View>

      <View style={card}>
        <Shimmer width="30%" height={16} />
        <View style={{ gap: 10, marginTop: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.rowBetween}>
              <Shimmer width="35%" height={11} />
              <Shimmer width="35%" height={11} />
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
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 3,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  metricCell: {
    width: '50%',
    padding: 13,
    gap: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
