import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 26;
const KNOB_SIZE = 20;
const KNOB_INSET = 3;

/**
 * Custom on/off toggle — matches the app bar/drawer/home reference (`TSB Home FV.html`)'s
 * relevance-toggle switches exactly (44×26 track, 20×20 knob, gold when on). RN's built-in
 * `Switch` renders the platform's native control instead, which doesn't match this design, so
 * this is hand-built like `DualRangeSlider`/`ChipMultiSelect` elsewhere in the app. Generic (not
 * filter-specific) so any screen needing the same toggle look can reuse it.
 */
export function Switch({
  value,
  onValueChange,
  onColor,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  /** Overrides the default `colors.gold` "on" track color — e.g. Settings' Visibility toggles
   * use `#182e43` instead. */
  onColor?: string;
}) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, progress]);

  const knobLeft = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [KNOB_INSET, TRACK_WIDTH - KNOB_SIZE - KNOB_INSET],
  });
  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, onColor ?? colors.gold],
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.knob, { left: knobLeft }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  knob: {
    position: 'absolute',
    top: KNOB_INSET,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
});
