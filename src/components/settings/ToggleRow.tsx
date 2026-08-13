import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Switch } from '../Switch';

/** Label + description + `Switch`, the recurring row shape across Visibility (5), Matching
 * audience (7) + behavior (3), Notifications (5), and Account's single Login Alerts toggle — 21
 * rows total across Settings. */
export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  last = false,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  /** Suppresses the bottom border for the last row in a card. */
  last?: boolean;
}) {
  const { colors, fonts, fontSize, borderWidth } = useTheme();

  return (
    <View style={[styles.row, !last && { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[fonts.semibold, { fontSize: fontSize.ui, color: colors.ink }]}>{label}</Text>
        {!!description && (
          <Text style={[fonts.regular, styles.description, { fontSize: fontSize.caption, color: colors.ink3 }]}>{description}</Text>
        )}
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
  },
  description: {
    lineHeight: 16,
    marginTop: 3,
  },
});
