import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';

/**
 * Multi-select toggle chip — matches the app bar/drawer/home reference (`TSB Home FV.html`)'s
 * filter chips exactly (Post Type, Posted By, Topic & Sector). Generic (not filter-specific) so
 * any screen needing the same toggle-chip look can reuse it.
 */
export function Pill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, fonts, fontSize, borderWidth } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.pill,
        {
          borderWidth: borderWidth.thin,
          borderColor: selected ? colors.accentSolid : colors.border,
          backgroundColor: selected ? colors.accentSolid : colors.surface,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          fonts.semibold,
          { fontSize: fontSize.body, color: selected ? colors.onAccent : colors.ink2 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  pressed: {
    opacity: 0.65,
  },
});
