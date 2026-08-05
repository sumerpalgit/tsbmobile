import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

/** Same opacity-pulse shimmer as `EventListCardSkeleton.tsx`/`PostCardSkeleton.tsx` — kept local
 * for the same reason those do (not exported outside their own folder). */
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

/** One skeleton row, shaped like a real `ConversationRow` (avatar circle, name line, preview
 * line, time) — shown in place of the inbox list while `useConversations`'s first fetch is in
 * flight, instead of the misleading "No messages yet" empty state. */
export function ConversationRowSkeleton() {
  const { colors, radius } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderRadius: radius.xl }]}>
      <Shimmer width={46} height={46} radius={23} />
      <View style={styles.info}>
        <Shimmer width="45%" height={13} />
        <Shimmer width="70%" height={11} />
      </View>
      <Shimmer width={30} height={10} />
    </View>
  );
}

/** N skeleton rows, matching `EventsSkeleton`/`FeedSkeleton`'s own convention. */
export function ConversationListSkeleton({ count = 7 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <ConversationRowSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
});
