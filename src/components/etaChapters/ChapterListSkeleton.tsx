import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import type { ChapterListView } from './ChapterListControls';

/** Same opacity-pulse shimmer pattern as `EventListCardSkeleton.tsx`/`ConversationRowSkeleton.tsx`. */
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

function ChapterCardSkeleton({ grid }: { grid: boolean }) {
  const { colors, radius, borderWidth } = useTheme();

  return (
    <View style={[styles.card, { flex: grid ? 1 : undefined, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}>
      {grid ? (
        <>
          <Shimmer width="100%" height={86} radius={0} />
          <View style={styles.gridBody}>
            <Shimmer width="70%" height={14} />
            <Shimmer width="50%" height={11} />
            <Shimmer width="40%" height={11} />
          </View>
        </>
      ) : (
        <View style={styles.rowBody}>
          <Shimmer width={56} height={56} radius={12} />
          <View style={styles.rowInfo}>
            <Shimmer width="60%" height={14} />
            <Shimmer width="40%" height={11} />
            <Shimmer width="45%" height={11} />
          </View>
        </View>
      )}
    </View>
  );
}

export function ChapterListSkeleton({ view = 'grid', count = 6 }: { view?: ChapterListView; count?: number }) {
  const grid = view === 'grid';
  return (
    <View style={grid ? styles.gridWrap : styles.rowsWrap}>
      {Array.from({ length: count }).map((_, i) => (
        <ChapterCardSkeleton key={i} grid={grid} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
  },
  rowsWrap: {
    gap: 10,
    paddingHorizontal: 16,
  },
  card: {
    overflow: 'hidden',
    minWidth: '47%',
  },
  gridBody: {
    padding: 12,
    gap: 8,
  },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
  },
  rowInfo: {
    flex: 1,
    gap: 8,
  },
});
