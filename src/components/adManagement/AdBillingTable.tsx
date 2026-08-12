import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { derivePlacement, getBudgetAmount, money, PLACEMENT_LABELS } from '../../types/adManagement';
import type { AdCampaign } from '../../types/adManagement';

/** Matches `Profile.html`'s `ins.billing` table — real per-campaign amount + Paid/Pending from
 * `payment_completed`, and a real summed total (the mockup's own "$1,940" footer was a static
 * literal that only happened to match its fixture; this actually sums, see plan decision #8).
 * The footer also breaks out the paid subset (`paidTotal`), matching web's own "Total billed ·
 * {paidTotal} paid" line — the earlier version only showed the grand total. */
export function AdBillingTable({ ads }: { ads: AdCampaign[] }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  const total = ads.reduce((sum, ad) => sum + getBudgetAmount(ad), 0);
  const paidTotal = ads.filter(ad => ad.paymentCompleted).reduce((sum, ad) => sum + getBudgetAmount(ad), 0);

  if (ads.length === 0) {
    return (
      <Text style={[fonts.regular, styles.empty, { color: colors.ink3 }]}>No campaigns yet.</Text>
    );
  }

  return (
    <View>
      <View style={{ gap: 11, marginTop: 12 }}>
        {ads.map(ad => (
          <View key={ad.id} style={styles.row}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink }]} numberOfLines={1}>
                {ad.campaignName || 'Untitled campaign'}
              </Text>
              <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 2 }]}>
                {PLACEMENT_LABELS[derivePlacement(ad)]}
              </Text>
            </View>
            <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink }]}>{money(getBudgetAmount(ad))}</Text>
            <View
              style={[
                styles.badge,
                { borderRadius: radius.sm, backgroundColor: ad.paymentCompleted ? colors.successSurface : colors.surfaceSunken },
              ]}
            >
              <Text style={[fonts.bold, styles.badgeText, { color: ad.paymentCompleted ? colors.success : colors.ink3 }]}>
                {ad.paymentCompleted ? 'Paid' : 'Pending'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.totalRow, { borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
        <View>
          <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink }]}>Total billed</Text>
          <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 2 }]}>{money(paidTotal)} paid</Text>
        </View>
        <Text style={[fonts.display, { fontSize: fontSize.h3, color: colors.ink }]}>{money(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 9.5,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 13,
    marginTop: 13,
  },
});
