import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

/**
 * Single-select segmented control — matches the app bar/drawer/home reference
 * (`TSB Home FV.html`)'s "Posted within" control: a pill-shaped translucent track with segments
 * that highlight when active. Generic (not filter-specific) so any screen needing a single-select
 * segment group can reuse it.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  const { colors, fonts, elevation } = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: colors.segmentedTrack }]}>
      {options.map(option => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.segment,
              active && { backgroundColor: colors.surface },
              active && elevation('sm'),
            ]}
          >
            <Text
              style={[
                active ? fonts.bold : fonts.semibold,
                styles.label,
                { color: active ? colors.ink : colors.ink3 },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 13,
  },
  segment: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  label: {
    fontSize: 12.5,
  },
});
