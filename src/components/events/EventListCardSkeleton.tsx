import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

/** Same opacity-pulse shimmer as `PostCardSkeleton.tsx` (Home feed's loading state) — kept local
 * rather than importing that one, since it isn't exported for reuse outside `components/home/`. */
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

/** One skeleton card, shaped like a real `EventListCard` (accent bar, date block, type/status
 * row, title, time/location row, action buttons) — shown in place of the events list while
 * `useMyEvents`'s first fetch is in flight, instead of a plain "Loading events…" text. */
export function EventListCardSkeleton() {
  const { colors, radius, borderWidth } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}>
      <View style={[styles.accentBar, { backgroundColor: colors.surfaceSunken }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Shimmer width={46} height={50} radius={10} />
          <View style={styles.info}>
            <Shimmer width="40%" height={9} />
            <Shimmer width="85%" height={14} />
            <Shimmer width="60%" height={11} />
          </View>
        </View>
        <View style={styles.actionsRow}>
          <Shimmer width="100%" height={40} radius={8} />
          <Shimmer width="70%" height={40} radius={8} />
        </View>
      </View>
    </View>
  );
}

/** N skeleton cards, matching `FeedSkeleton.tsx`'s own convention on Home. */
export function EventsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <EventListCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    overflow: 'hidden',
  },
  accentBar: {
    height: 3,
  },
  body: {
    padding: 13,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 8,
    paddingTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
