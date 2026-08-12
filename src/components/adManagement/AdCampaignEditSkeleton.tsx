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

function FieldSkeleton() {
  return (
    <View style={{ gap: 6 }}>
      <Shimmer width="35%" height={11} />
      <Shimmer width="100%" height={44} radius={10} />
    </View>
  );
}

/** Matches `AdCampaignEditScreen`'s real section-card shape (basics/status/creative/destination/
 * targeting/schedule) at a "good enough" fidelity, same spirit as `AdCampaignCardSkeleton.tsx` —
 * this app's established loading convention is skeleton UI, not a spinner. */
export function AdCampaignEditSkeleton() {
  const { colors, radius, borderWidth } = useTheme();
  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }];

  return (
    <View style={styles.scroll}>
      <View style={card}>
        <Shimmer width="45%" height={16} />
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
      </View>
      <View style={card}>
        <Shimmer width="40%" height={16} />
        <FieldSkeleton />
        <FieldSkeleton />
      </View>
      <View style={card}>
        <Shimmer width="30%" height={16} />
        <Shimmer width="100%" height={80} radius={10} />
        <FieldSkeleton />
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
    gap: 12,
  },
});
