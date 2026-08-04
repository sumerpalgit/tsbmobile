import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../theme';

/** Generic label/value line — the non-financial counterpart to `RangeRow`, for fields like
 * `role_type`, `experience_level`, `format`. Renders nothing when `value` is empty, so bodies
 * can list every optional field unconditionally instead of each guarding its own render. */
export function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const { colors, fonts, fontSize } = useTheme();

  if (!value) {
    return null;
  }

  return (
    <View style={styles.row}>
      <Text style={[fonts.medium, { fontSize: fontSize.caption, color: colors.ink3 }]}>{label}</Text>
      <Text style={[fonts.semibold, styles.value, { fontSize: fontSize.caption, color: colors.ink }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
