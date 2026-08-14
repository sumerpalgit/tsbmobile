import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Clock } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useAdCampaigns } from '../hooks/useAdCampaigns';
import { formatMetricValue, getMetricValue, METRIC_LABELS, money } from '../types/adManagement';
import type { AdMetricKey, AdStatus } from '../types/adManagement';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { AdRankingList } from '../components/adManagement/AdRankingList';
import { AdStatusDonut } from '../components/adManagement/AdStatusDonut';
import { AdBillingTable } from '../components/adManagement/AdBillingTable';
import { AdInsightsSkeleton } from '../components/adManagement/AdInsightsSkeleton';
import type { AppStackParamList } from '../navigation/types';

const METRICS: AdMetricKey[] = ['impressions', 'clicks', 'spend', 'cpm'];

/** Insights drill-down — matches `Profile.html`'s `adAtInsights` (~line 537). Real functionality:
 * no dedicated insights endpoint exists on web either — every number here (hero stat, mini-stats,
 * rankings, status donut, billing total) is computed client-side from the same `GET /ads/my-ads`
 * array `AdManagementScreen` fetches (see the plan). "Hourly performance" is a genuine dead-end on
 * real web too (no hourly tracking exists) — shipped as the same static placeholder. */
function AdInsightsScreen() {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'AdInsights'>>();

  const [metric, setMetric] = useState<AdMetricKey>(route.params.metric);
  const { ads, isLoading, statusCounts, kpis } = useAdCampaigns();

  // CPM is an account-level RATIO (total spend ÷ total impressions), not a sum of each
  // campaign's own CPM — `kpis.cpm` already computes this correctly (`aggregateKpis`); summing
  // per-campaign values here (the earlier version's approach, via `getMetricValue`) double-counts
  // and inflates the number whenever more than one campaign has impressions.
  const totalValue = metric === 'cpm' ? kpis.cpm ?? 0 : ads.reduce((sum, ad) => sum + getMetricValue(ad, metric), 0);
  const ctrDisplay = kpis.ctr != null ? `${kpis.ctr.toFixed(2)}%` : '—';

  // Spend is ledger data, always meaningful as "$0" — impressions/clicks/CPM are delivery data
  // that genuinely doesn't exist pre-launch, so those get web's honest "—" / no-data messaging
  // instead of a misleading "0" (matches web's `hasAnalytics` gating).
  const metricNeedsAnalytics = metric !== 'spend';
  const heroValueDisplay = metricNeedsAnalytics && !kpis.hasAnalytics ? '—' : formatMetricValue(totalValue, metric);
  const heroSubtext =
    metricNeedsAnalytics && !kpis.hasAnalytics
      ? `No delivery data yet — values populate once your ${ads.length} campaign${ads.length === 1 ? '' : 's'} start serving`
      : `Across ${ads.length} campaigns`;

  const miniStats = [
    { label: 'Impressions', value: kpis.hasAnalytics ? kpis.totalImpressions.toLocaleString('en-US') : '—' },
    { label: 'Clicks', value: kpis.hasAnalytics ? kpis.totalClicks.toLocaleString('en-US') : '—' },
    { label: 'CTR', value: ctrDisplay },
    { label: 'Spend', value: money(kpis.totalSpend) },
  ];

  const statusTotal = (Object.keys(statusCounts) as AdStatus[]).reduce((sum, s) => sum + statusCounts[s], 0);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Insights" onBack={() => navigation.goBack()} />

      {isLoading ? (
        <ScrollView>
          <AdInsightsSkeleton />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
            <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>{METRIC_LABELS[metric].toUpperCase()} · INSIGHTS</Text>
            <Text style={[fonts.display, styles.heroValue, { color: colors.ink }]}>{heroValueDisplay}</Text>
            <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]}>{heroSubtext}</Text>

            <View style={[styles.miniRow, { borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
              {miniStats.map(m => (
                <View key={m.label} style={{ flex: 1 }}>
                  <Text style={[fonts.bold, styles.miniLabel, { color: colors.ink3 }]}>{m.label.toUpperCase()}</Text>
                  <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink, marginTop: 4 }]}>{m.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.tabsRow}>
            {METRICS.map(m => {
              const active = metric === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMetric(m)}
                  style={[
                    styles.tab,
                    { borderRadius: radius.lg, backgroundColor: active ? colors.gold : colors.surface, borderColor: active ? colors.gold : colors.border, borderWidth: borderWidth.thin },
                  ]}
                >
                  <Text style={[fonts.semibold, { fontSize: fontSize.small, color: active ? '#fff' : colors.ink2 }]}>{METRIC_LABELS[m]}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
            <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Top campaigns by {METRIC_LABELS[metric].toLowerCase()}</Text>
            <AdRankingList ads={ads} metric={metric} />
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
            <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>By status</Text>
            <AdStatusDonut counts={statusCounts} total={statusTotal} />
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
            <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Billing &amp; invoices</Text>
            <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 3 }]}>Per campaign</Text>
            <AdBillingTable ads={ads} />
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
            <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Hourly performance</Text>
            <View style={[styles.placeholderBox, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surfaceSunken }]}>
              <Clock size={20} color={colors.ink3} strokeWidth={1.5} />
              <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink, marginTop: 8 }]}>Hourly tracking not enabled</Text>
              <Text style={[fonts.regular, styles.placeholderDesc, { fontSize: fontSize.caption, color: colors.ink3 }]}>
                Day × hour delivery breakdowns appear once impression-level tracking is live for your account.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 13,
  },
  card: {
    padding: 14,
  },
  eyebrow: {
    fontSize: 9.5,
    letterSpacing: 0.7,
  },
  heroValue: {
    fontSize: 34,
    marginTop: 6,
  },
  miniRow: {
    flexDirection: 'row',
    marginTop: 13,
    paddingTop: 13,
  },
  miniLabel: {
    fontSize: 8.5,
    letterSpacing: 0.4,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  tab: {
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  cardTitle: {
    fontSize: 16,
  },
  placeholderBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 28,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  placeholderDesc: {
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 4,
    maxWidth: 260,
  },
});

export default AdInsightsScreen;
