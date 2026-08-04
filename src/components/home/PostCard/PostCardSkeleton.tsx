import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme';

/** Pulses opacity in a loop rather than a moving gradient sweep (web's `background-position`
 * shimmer) — RN has no CSS gradient-position animation without a extra dependency, and a simple
 * opacity pulse reads as "loading" just as clearly without one. */
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

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.surfaceSunken },
        { opacity },
      ]}
    />
  );
}

/** One skeleton card, shaped like a real `PostCard` (same outer shell, same header/body/footer
 * proportions) — matches web's `FeedCardSkeleton` (`webSrc/src/app/dashboard/components/
 * FeedSkeleton.tsx`) block-for-block, just re-laid-out for RN. Shown in place of the feed list
 * while `useHomeFeed`'s first fetch is in flight, instead of a blank screen. */
export function PostCardSkeleton() {
  const { colors, borderWidth, elevation } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.feedCardLine, borderWidth: borderWidth.thin },
        elevation('sm'),
      ]}
    >
      <View style={styles.header}>
        <Shimmer width={44} height={44} radius={22} />
        <View style={styles.headerText}>
          <Shimmer width="38%" height={13} />
          <Shimmer width="26%" height={11} />
          <Shimmer width="20%" height={10} />
        </View>
        <View style={styles.headerButtons}>
          <Shimmer width={30} height={30} radius={8} />
          <Shimmer width={30} height={30} radius={8} />
        </View>
      </View>

      <View style={styles.body}>
        <Shimmer width={90} height={20} radius={8} />
        <Shimmer width="75%" height={15} />
        <Shimmer width="100%" height={12} />
        <Shimmer width="88%" height={12} />
        <Shimmer width="60%" height={12} />
      </View>

      <View style={[styles.footer, { borderTopColor: colors.feedCardLine, borderTopWidth: borderWidth.thin }]}>
        <Shimmer width={44} height={22} radius={8} />
        <Shimmer width={44} height={22} radius={8} />
        <Shimmer width={44} height={22} radius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 15,
    paddingBottom: 12,
  },
  headerText: {
    flex: 1,
    gap: 7,
    paddingTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  body: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 9,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    padding: 15,
    paddingTop: 12,
  },
});
