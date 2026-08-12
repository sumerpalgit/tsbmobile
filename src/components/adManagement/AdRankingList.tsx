import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { formatMetricValue, getMetricValue } from '../../types/adManagement';
import type { AdCampaign, AdMetricKey } from '../../types/adManagement';

/** Top campaigns by the selected metric — matches `Profile.html`'s `ins.ranks` (~line 2437),
 * real per-campaign values (see `getMetricValue`'s doc comment for why this covers spend/CPM too,
 * unlike the mockup's fixture). Top 8 only, matching real web's own cap. */
export function AdRankingList({ ads, metric }: { ads: AdCampaign[]; metric: AdMetricKey }) {
  const { colors, fonts, fontSize, radius } = useTheme();

  const ranked = [...ads]
    .map(ad => ({ ad, value: getMetricValue(ad, metric) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const maxValue = ranked[0]?.value ?? 0;

  if (ranked.length === 0 || maxValue <= 0) {
    return (
      <View style={styles.empty}>
        <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink }]}>
          No {metric === 'spend' ? 'spend' : metric} recorded yet
        </Text>
        <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 4 }]}>
          Rankings appear once your campaigns start delivering and this metric has data to compare.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {ranked.map((row, index) => (
        <View key={row.ad.id} style={styles.row}>
          <Text style={[fonts.bold, styles.rank, { color: colors.ink3 }]}>{index + 1}</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.rowTop}>
              <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink, flex: 1 }]} numberOfLines={1}>
                {row.ad.campaignName || 'Untitled campaign'}
              </Text>
              <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink }]}>{formatMetricValue(row.value, metric)}</Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.surfaceSunken, borderRadius: radius.sm }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.max(4, (row.value / maxValue) * 100)}%`,
                    backgroundColor: index === 0 ? colors.gold : colors.goldLight,
                    borderRadius: radius.sm,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rank: {
    width: 16,
    fontSize: 12,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  track: {
    height: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  empty: {
    paddingVertical: 16,
  },
});
