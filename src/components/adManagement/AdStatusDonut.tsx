import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme';
import { getStatusColors, STATUS_LABELS } from '../../types/adManagement';
import type { AdStatus } from '../../types/adManagement';

const SIZE = 108;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STATUS_ORDER: AdStatus[] = ['active', 'review', 'paused', 'draft', 'ended'];

/** Hand-rolled SVG donut (`react-native-svg`, already a dependency — no new charting library
 * needed) — real per-status counts computed client-side from the account's own campaigns, unlike
 * the mockup's hardcoded 2/3-Active-1/3-Ended fixture arcs (plan decision #8). */
export function AdStatusDonut({ counts, total }: { counts: Record<AdStatus, number>; total: number }) {
  const { colors, fonts, fontSize } = useTheme();

  let cumulative = 0;
  const segments = STATUS_ORDER.filter(s => counts[s] > 0).map(status => {
    const count = counts[status];
    const fraction = total > 0 ? count / total : 0;
    const dashOffset = -cumulative * CIRCUMFERENCE;
    cumulative += fraction;
    return { status, count, fraction, dashOffset };
  });

  return (
    <View style={styles.row}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.surfaceSunken} strokeWidth={STROKE} fill="none" />
          {segments.map(seg => (
            <Circle
              key={seg.status}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={getStatusColors(seg.status, colors).fg}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${seg.fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
              rotation={-90}
              originX={SIZE / 2}
              originY={SIZE / 2}
            />
          ))}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={[fonts.display, styles.centerValue, { color: colors.ink }]}>{total}</Text>
          <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]}>Campaigns</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {STATUS_ORDER.filter(s => counts[s] > 0).map(status => (
          <View key={status} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: getStatusColors(status, colors).fg }]} />
            <Text style={[fonts.semibold, { fontSize: fontSize.caption, color: colors.ink, flex: 1 }]}>{STATUS_LABELS[status]}</Text>
            <Text style={[fonts.bold, { fontSize: fontSize.caption, color: colors.ink3 }]}>{counts[status]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 12,
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: 22,
  },
  legend: {
    flex: 1,
    gap: 9,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
