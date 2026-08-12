import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Activity, DollarSign, Eye, MousePointerClick } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { money } from '../../types/adManagement';
import type { AdKpis } from '../../types/adManagement';

type MetricKey = 'impressions' | 'clicks' | 'spend' | 'cpm';

/** 2×2 KPI grid — matches `Profile.html`'s `adKpis` (~line 2369). Values are the same
 * client-side-computed lifetime aggregates `AdInsightsScreen` drills into, not a separate
 * `/ads/kpi-summary` fetch (see the plan's decision #4 — that endpoint is dead code real web
 * itself never calls). Each cell taps through to that metric's insights screen. */
export function AdKpiStrip({ kpis, onPressMetric }: { kpis: AdKpis; onPressMetric: (metric: MetricKey) => void }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  const cells: { key: MetricKey; label: string; value: string; sub: string; Icon: typeof Eye }[] = [
    { key: 'impressions', label: 'Total impressions', value: kpis.totalImpressions.toLocaleString('en-US'), sub: 'Across all campaigns', Icon: Eye },
    {
      key: 'clicks',
      label: 'Clicks',
      value: kpis.totalClicks.toLocaleString('en-US'),
      sub: kpis.ctr != null ? `CTR ${kpis.ctr.toFixed(2)}%` : 'No clicks yet',
      Icon: MousePointerClick,
    },
    { key: 'spend', label: 'Spend', value: money(kpis.totalSpend), sub: `of ${money(kpis.totalBudget)} budget`, Icon: DollarSign },
    {
      key: 'cpm',
      label: 'Avg. CPM',
      value: kpis.cpm != null ? `$${kpis.cpm.toFixed(2)}` : '—',
      sub: 'Cost per 1k impressions',
      Icon: Activity,
    },
  ];

  return (
    <View style={styles.grid}>
      {cells.map(cell => (
        <Pressable
          key={cell.key}
          onPress={() => onPressMetric(cell.key)}
          style={({ pressed }) => [
            styles.cell,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin },
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.topRow}>
            <View style={[styles.iconWell, { backgroundColor: colors.chip, borderRadius: radius.md }]}>
              <cell.Icon size={14} color={colors.goldDark} strokeWidth={1.8} />
            </View>
            <Text style={[fonts.bold, styles.label, { color: colors.ink3 }]} numberOfLines={1}>
              {cell.label.toUpperCase()}
            </Text>
          </View>
          <Text style={[fonts.display, styles.value, { color: colors.ink }]} numberOfLines={1}>
            {cell.value}
          </Text>
          <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]} numberOfLines={1}>
            {cell.sub}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  cell: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 13,
    gap: 7,
    alignItems: 'flex-start',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    width: '100%',
  },
  iconWell: {
    flexShrink: 0,
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flexShrink: 1,
    fontSize: 8.5,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 25,
  },
  pressed: {
    opacity: 0.7,
  },
});
