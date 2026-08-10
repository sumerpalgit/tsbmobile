import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../theme';
import { actualDays, computeCampaignCost } from './types';
import type { CampaignDraft } from './types';

export function StepReview({ draft }: { draft: CampaignDraft }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const days = actualDays(draft);
  const cost = computeCampaignCost(draft.placement, draft.bannerTier, draft.chapterIds.length, days);

  const rows: { k: string; v: string }[] = [
    { k: 'Brand', v: draft.brandName || '—' },
    { k: 'Campaign', v: draft.campaignName || '—' },
    { k: 'Contact email', v: draft.contactEmail || '—' },
    { k: 'Placement', v: draft.placement === 'home' ? 'Home Feed' : draft.placement === 'eta' ? 'ETA Chapter' : 'Home + ETA Chapter' },
    ...(draft.placement !== 'home' ? [{ k: 'Chapters', v: String(draft.chapterIds.length) }] : []),
    { k: 'Banner tier', v: draft.bannerTier === 'premium' ? 'Premium' : 'Standard' },
    { k: 'Headline', v: draft.headline || '—' },
    { k: 'Audience', v: draft.audience.length ? draft.audience.join(', ') : 'All members' },
    { k: 'Geography', v: draft.geography.length ? draft.geography.join(', ') : 'All locations' },
    { k: 'Start date', v: draft.startDate || '—' },
    { k: 'Duration', v: `${days} days` },
  ];

  return (
    <View style={styles.gap}>
      <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>REVIEW & SUBMIT</Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
        {rows.map((r, i) => (
          <View key={r.k} style={[styles.row, i < rows.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
            <Text style={[fonts.regular, { fontSize: fontSize.small, color: colors.ink3 }]}>{r.k}</Text>
            <Text numberOfLines={1} style={[fonts.bold, styles.rowValue, { fontSize: fontSize.small, color: colors.ink }]}>
              {r.v}
            </Text>
          </View>
        ))}
      </View>

      <LinearGradient colors={[colors.hero1, colors.hero2]} style={[styles.chargeCard, { borderRadius: radius.xl }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={[fonts.bold, styles.chargeLabel, { color: colors.goldLight }]}>CHARGE ON LAUNCH</Text>
        <Text style={[fonts.display, styles.chargeValue, { color: '#fff' }]}>${cost}</Text>
      </LinearGradient>

      <View style={[styles.notice, { backgroundColor: colors.chip, borderLeftColor: colors.gold, borderRadius: radius.lg }]}>
        <Text style={[fonts.regular, styles.noticeText, { color: colors.goldDark }]}>
          Your ad enters review within 4 business hours. You'll receive an email when it goes live, and can pause or
          edit anytime from the Advertiser dashboard.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: {
    gap: 13,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 0.6,
  },
  card: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowValue: {
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
  },
  chargeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  chargeLabel: {
    fontSize: 10,
    letterSpacing: 0.7,
  },
  chargeValue: {
    fontSize: 24,
  },
  notice: {
    padding: 11,
    borderLeftWidth: 3,
  },
  noticeText: {
    fontSize: 11.5,
    lineHeight: 17,
  },
});
