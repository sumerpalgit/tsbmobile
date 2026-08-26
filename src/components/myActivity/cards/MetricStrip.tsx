import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

export type Metric = { label: string; value: string };

/** The gold-tick-mark metric strip at the bottom of every mini-card's white body — matches
 * `DealBuyerMiniCard.tsx` (and every sibling mini-card) exactly: a small gold bar above each
 * uppercase label, divided by hairline borders, `borderTop` separating it from the description
 * above. */
export function MetricStrip({ metrics }: { metrics: Metric[] }) {
  const { colors, fonts } = useTheme();

  return (
    <View style={[styles.strip, { borderTopColor: colors.creamDark }]}>
      {metrics.map((metric, i) => (
        <View key={metric.label} style={[styles.cell, i > 0 && { borderLeftColor: colors.creamDark, borderLeftWidth: StyleSheet.hairlineWidth }]}>
          <View style={[styles.tick, { backgroundColor: colors.gold }]} />
          <Text style={[fonts.semibold, styles.label, { color: colors.ink3 }]} numberOfLines={1}>
            {metric.label.toUpperCase()}
          </Text>
          <Text style={[fonts.bold, styles.value, { color: colors.ink }]} numberOfLines={1}>
            {metric.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 11,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 6,
  },
  tick: {
    width: 16,
    height: 2.5,
    borderRadius: 2,
    marginBottom: 5,
  },
  label: {
    fontSize: 8,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 11.5,
    letterSpacing: -0.15,
  },
});
