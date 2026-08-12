import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { getStatusColors, STATUS_LABELS } from '../../types/adManagement';
import type { AdStatus } from '../../types/adManagement';

/** Shared status pill — reused by the dashboard's campaign cards, the detail header, and the
 * edit screen's status select. Colors need no new theme tokens: the mockup's own status hex
 * literals are exact matches for existing `colors.success`/`ink2`/`ink3`/`danger` (+ their
 * surface/chip/sunken backgrounds) — see the plan's decision #12. */
export function AdStatusBadge({ status }: { status: AdStatus }) {
  const { colors, fonts, radius } = useTheme();
  const { fg, bg } = getStatusColors(status, colors);

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: radius.sm }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[fonts.bold, styles.label, { color: fg }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
