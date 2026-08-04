import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../theme';
import type { RangeField } from '../../../../types/home';
import { formatMoneyRange } from './formatMoney';

/**
 * One labeled min–max row — `"Revenue"` → `"$1.2M – $5M"`. Shared by every body that shows a
 * financial range (Deal, Investor Corner, Search Capital all repeat this exact pattern for
 * revenue/EBITDA/ticket size/deal size), instead of each body formatting its own ranges.
 * Renders nothing when both ends are empty, so callers can list every possible range for a type
 * unconditionally.
 */
export function RangeRow({
  label,
  range,
  currency,
}: {
  label: string;
  range: RangeField | undefined;
  currency?: string | null;
}) {
  const { colors, fonts, fontSize } = useTheme();
  const text = formatMoneyRange(range, currency);

  if (!text) {
    return null;
  }

  return (
    <View style={styles.row}>
      <Text style={[fonts.medium, { fontSize: fontSize.caption, color: colors.ink3 }]}>{label}</Text>
      <Text style={[fonts.semibold, { fontSize: fontSize.caption, color: colors.ink }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
