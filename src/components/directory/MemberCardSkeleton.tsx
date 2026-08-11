import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

/** Same opacity-pulse shimmer as `ConversationRowSkeleton.tsx`/`ChapterListSkeleton.tsx` — kept
 * local for the same reason those do (not exported outside their own folder). */
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

/** One skeleton card, shaped like a real `MemberCard` — shown in place of the results list
 * whenever `useDirectory`'s `isLoading` is true (a fresh search/filter fetch, not just the very
 * first load), instead of leaving the previous query's stale cards on screen until the new ones
 * silently swap in. */
export function MemberCardSkeleton() {
  const { colors, radius, borderWidth } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
      <View style={styles.topRow}>
        <Shimmer width={46} height={46} radius={23} />
        <View style={styles.info}>
          <Shimmer width="55%" height={14} />
          <Shimmer width="70%" height={11} />
          <Shimmer width="40%" height={11} />
        </View>
      </View>
      <Shimmer width="100%" height={11} />
      <Shimmer width="65%" height={11} />
      <Shimmer width={80} height={22} radius={7} />
      <Shimmer width="100%" height={44} radius={12} />
    </View>
  );
}

export function DirectoryListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <MemberCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    padding: 14,
    gap: 11,
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
