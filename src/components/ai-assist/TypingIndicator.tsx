import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';

/** 3-dot "thinking" bubble shown while a reply is streaming in but no token has arrived yet.
 * Matches the mockup's `tsbBlink` keyframe (staggered opacity pulse) — built with `Animated`
 * instead of CSS keyframes, no new dependency. */
export function TypingIndicator() {
  const { colors, radius, borderWidth } = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: colors.gold, borderRadius: radius.md }]}>
        <Icon name="aiAssist" size={15} color="#fff" />
      </View>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSoft,
            borderWidth: borderWidth.thin,
            borderRadius: radius.lg,
          },
        ]}
      >
        <Dot delay={0} color={colors.ink3} />
        <Dot delay={200} color={colors.ink3} />
        <Dot delay={400} color={colors.ink3} />
      </View>
    </View>
  );
}

function Dot({ delay, color }: { delay: number; color: string }) {
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.25, duration: 660, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity]);

  return <Animated.View style={[styles.dot, { backgroundColor: color, opacity }]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
