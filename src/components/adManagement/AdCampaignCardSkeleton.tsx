import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

/** Same opacity-pulse shimmer as `MemberCardSkeleton.tsx` — kept local per that file's own
 * convention (not shared/exported across skeleton files). */
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

export function AdCampaignCardSkeleton() {
  const { colors, radius, borderWidth } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
      <View style={styles.topRow}>
        <Shimmer width={40} height={40} radius={11} />
        <View style={styles.info}>
          <Shimmer width="60%" height={14} />
          <Shimmer width="80%" height={11} />
        </View>
      </View>
      <Shimmer width="100%" height={30} />
      <Shimmer width="100%" height={4} radius={3} />
      <Shimmer width="50%" height={11} />
    </View>
  );
}

export function AdCampaignListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <AdCampaignCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    padding: 14,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
});
