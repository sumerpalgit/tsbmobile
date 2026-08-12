import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { avatarColor, getInitials } from '../../types/messages';
import {
  deriveStatus,
  formatDateShort,
  getBudgetAmount,
  getBudgetProgress,
  getCtr,
  getEndText,
  getTierLabel,
  hasBudgetSet,
  money,
} from '../../types/adManagement';
import { AdStatusBadge } from './AdStatusBadge';
import type { AdCampaign } from '../../types/adManagement';

/** Matches `Profile.html`'s `adCampaigns` card (~line 369) for layout, but the meta line's real
 * *content* matches web's `AdCampaignTable.tsx` row instead of the mockup's own "brand · tier ·
 * placement" — web actually shows "brand · tier · Created {date}", not placement (placement is
 * still visible via the detail screen and the filter chips). A 3-col impressions/clicks/CTR row,
 * a budget-used progress bar, and a footer (end date, "View →"). */
export function AdCampaignCard({ ad, onOpen }: { ad: AdCampaign; onOpen: () => void }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  const status = deriveStatus(ad);
  const ctr = getCtr(ad);
  const budget = getBudgetAmount(ad);
  const progress = getBudgetProgress(ad);
  const hasBudget = hasBudgetSet(ad);

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: avatarColor(ad.campaignName || ad.brandName), borderRadius: radius.md }]}>
          <Text style={[fonts.bold, styles.avatarText]}>{getInitials(ad.campaignName || ad.brandName)}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[fonts.bold, styles.name, { color: colors.ink }]} numberOfLines={1}>
            {ad.campaignName || 'Untitled campaign'}
          </Text>
          <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 2 }]} numberOfLines={1}>
            {[ad.brandName, getTierLabel(ad), `Created ${formatDateShort(ad.createdAt)}`].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <AdStatusBadge status={status} />
      </View>

      <View style={styles.metricsRow}>
        <MetricCell label="Impressions" value={ad.impressions != null ? ad.impressions.toLocaleString('en-US') : '—'} />
        <MetricCell label="Clicks" value={ad.clicks != null ? ad.clicks.toLocaleString('en-US') : '—'} />
        <MetricCell label="CTR" value={ctr != null ? `${ctr.toFixed(2)}%` : '—'} />
      </View>

      <View style={styles.budgetBlock}>
        <View style={styles.budgetLabelRow}>
          <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]}>Budget used</Text>
          <Text style={[fonts.semibold, { fontSize: fontSize.caption, color: colors.ink2 }]}>
            {hasBudget ? `${money(ad.spendToDate)} / ${money(budget)}` : '—'}
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSunken }]}>
          {hasBudget && <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.gold }]} />}
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
        <View style={styles.footerGroup}>
          <Calendar size={12} color={colors.ink3} strokeWidth={1.6} />
          <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]}>{getEndText(ad, status)}</Text>
        </View>
        <View style={styles.footerGroup}>
          <Text style={[fonts.bold, { fontSize: fontSize.caption, color: colors.goldDark }]}>View</Text>
          <ChevronRight size={12} color={colors.goldDark} strokeWidth={1.8} />
        </View>
      </View>
    </Pressable>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={[fonts.bold, styles.metricLabel, { color: colors.ink3 }]}>{label.toUpperCase()}</Text>
      <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink, marginTop: 3 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    color: '#fff',
  },
  name: {
    fontSize: 14.5,
  },
  metricsRow: {
    flexDirection: 'row',
  },
  metricLabel: {
    fontSize: 8.5,
    letterSpacing: 0.5,
  },
  budgetBlock: {
    gap: 6,
  },
  budgetLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 4,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 11,
  },
  footerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});
