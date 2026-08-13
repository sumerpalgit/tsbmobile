import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { STATUS_LABELS } from '../../types/adManagement';
import type { AdStatus } from '../../types/adManagement';

const TABS: { key: AdStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: STATUS_LABELS.active },
  { key: 'review', label: STATUS_LABELS.review },
  { key: 'paused', label: STATUS_LABELS.paused },
  { key: 'draft', label: STATUS_LABELS.draft },
  { key: 'ended', label: STATUS_LABELS.ended },
];

/** Matches `Profile.html`'s `adStatusChips` (~line 2334) — horizontal-scroll status tabs with a
 * live count per status, computed client-side (`useAdCampaigns`'s `statusCounts`). */
export function AdStatusChipsRow({
  active,
  onChange,
  counts,
  total,
}: {
  active: AdStatus | 'all';
  onChange: (status: AdStatus | 'all') => void;
  counts: Record<AdStatus, number>;
  total: number;
}) {
  const { colors, fonts, radius, borderWidth } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {TABS.map(tab => {
        const isActive = active === tab.key;
        const count = tab.key === 'all' ? total : counts[tab.key];
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [
              styles.chip,
              {
                borderRadius: radius.lg,
                borderWidth: borderWidth.thin,
                borderColor: isActive ? '#182E43' : colors.border,
                backgroundColor: isActive ? '#182E43' : colors.surface,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[fonts.semibold, styles.label, { color: isActive ? '#fff' : colors.ink2 }]}>{tab.label}</Text>
            <View style={[styles.countWell, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.surfaceSunken }]}>
              <Text style={[fonts.bold, styles.countText, { color: isActive ? '#fff' : colors.ink3 }]}>{count}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 7,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    fontSize: 12.5,
  },
  countWell: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 9.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
