import React, { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Pause, Pencil, Play, TrendingUp, Trash2 } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useAdCampaign } from '../hooks/useAdCampaign';
import { deleteAd, updateAdStatus } from '../api/adManagement';
import {
  ADVERTISER_TIER_LABELS,
  buildActivityLog,
  deriveStatus,
  derivePlacement,
  formatShortDate,
  getBudgetAmount,
  getBudgetProgress,
  getCampaignEndDate,
  getCpc,
  getCpm,
  getCtr,
  getDaysElapsed,
  getDaysRemaining,
  getPlacementSub,
  hasBudgetSet,
  money,
  PLACEMENT_LABELS,
} from '../types/adManagement';
import type { AdActivityColor } from '../types/adManagement';
import { avatarColor, getInitials } from '../types/messages';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { AdStatusBadge } from '../components/adManagement/AdStatusBadge';
import { KeyValueRows } from '../components/adManagement/KeyValueRows';
import { ConfirmDialog } from '../components/events/ConfirmDialog';
import { AdCampaignDetailSkeleton } from '../components/adManagement/AdCampaignDetailSkeleton';
import type { AppStackParamList } from '../navigation/types';

/** Campaign detail — matches `Profile.html`'s `adAtDetail` (~line 423). Real functionality from
 * `webSrc/.../manage/[adId]/page.tsx`: "Performance over time" is a genuine dead-end on real web
 * too (disabled range toggle, no time-series endpoint exists anywhere) — shipped here as the same
 * static placeholder, not an invented chart (plan decision #6). Pause/Resume uses the narrower
 * `updateAdStatus` call; Delete goes through `ConfirmDialog`, matching web's own
 * `window.confirm(...)` (plan decisions #9/#10). */
function AdCampaignDetailScreen() {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'AdCampaignDetail'>>();
  const { adId } = route.params;

  const { ad, isLoading, error, refetch } = useAdCampaign(adId);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleTogglePause = async () => {
    if (!ad || pausing) return;
    const status = deriveStatus(ad);
    const nextStatus = status === 'active' ? 'paused' : 'active';
    setPausing(true);
    try {
      await updateAdStatus(ad.id, nextStatus);
      Toast.show({ type: 'success', text1: nextStatus === 'paused' ? 'Campaign paused' : 'Campaign resumed' });
      refetch();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not update campaign status' });
    } finally {
      setPausing(false);
    }
  };

  const handleDelete = async () => {
    if (!ad) return;
    setDeleting(true);
    try {
      await deleteAd(ad.id);
      setConfirmDeleteOpen(false);
      Toast.show({ type: 'success', text1: 'Campaign deleted' });
      navigation.goBack();
    } catch {
      setDeleting(false);
      Toast.show({ type: 'error', text1: 'Could not delete campaign' });
    }
  };

  if (isLoading || !ad) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <AdScreenHeader title="Campaign" onBack={() => navigation.goBack()} />
        {isLoading ? (
          <ScrollView>
            <AdCampaignDetailSkeleton />
          </ScrollView>
        ) : (
          // Matches web's explicit "Error: {message}" / "Campaign not found." states — the
          // earlier version silently rendered nothing here for both cases.
          <View style={styles.errorWrap}>
            <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2, textAlign: 'center' }]}>
              {error || 'Campaign not found.'}
            </Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const status = deriveStatus(ad);
  const placement = derivePlacement(ad);
  const ctr = getCtr(ad);
  const cpm = getCpm(ad);
  const cpc = getCpc(ad);
  const budget = getBudgetAmount(ad);
  const progress = getBudgetProgress(ad);

  const hasAnalytics = ad.impressions != null || ad.clicks != null;
  const hasBudget = hasBudgetSet(ad);
  const endDate = getCampaignEndDate(ad);
  const endDateLabel = endDate ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const remaining = hasBudget ? Math.max(0, budget - (ad.spendToDate ?? 0)) : null;

  const metrics = [
    { label: 'Impressions', value: hasAnalytics && ad.impressions != null ? ad.impressions.toLocaleString('en-US') : '—' },
    { label: 'Clicks', value: hasAnalytics && ad.clicks != null ? ad.clicks.toLocaleString('en-US') : '—' },
    { label: 'CTR', value: ctr != null ? `${ctr.toFixed(2)}%` : '—' },
    { label: 'Spend', value: money(ad.spendToDate) },
    { label: 'CPM', value: cpm != null ? `$${cpm.toFixed(2)}` : '—' },
    { label: 'CPC', value: cpc != null ? `$${cpc.toFixed(2)}` : '—' },
  ];

  const targetingRows = [
    { k: 'Placement', v: PLACEMENT_LABELS[placement] },
    { k: 'Chapters', v: getPlacementSub(ad) || 'None' },
    { k: 'Audience', v: ad.targetAudience.join(', ') || 'All audiences' },
    { k: 'Geography', v: ad.targetGeography.join(', ') || 'All regions' },
    { k: 'Tier', v: ad.tier ? ADVERTISER_TIER_LABELS[ad.tier] : '—' },
    {
      k: 'Destination',
      v: ad.clickDestinationUrl || '—',
      onPress: ad.clickDestinationUrl
        ? () => Linking.openURL(ad.clickDestinationUrl!).catch(() => Toast.show({ type: 'error', text1: 'Could not open link' }))
        : undefined,
    },
  ];

  const scheduleRows = [
    { k: 'Start date', v: formatShortDate(ad.campaignStartDate) },
    { k: 'End date', v: endDateLabel },
    { k: 'Days elapsed', v: getDaysElapsed(ad) },
    { k: 'Days remaining', v: getDaysRemaining(ad) },
    { k: 'Total budget', v: hasBudget ? money(budget) : '—' },
    { k: 'Remaining', v: remaining != null ? money(remaining) : '—' },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title={ad.campaignName || 'Campaign'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
          <View style={styles.headerRow}>
            <View style={[styles.avatarLg, { backgroundColor: avatarColor(ad.campaignName || ad.brandName), borderRadius: radius.lg }]}>
              <Text style={[fonts.bold, styles.avatarLgText]}>{getInitials(ad.campaignName || ad.brandName)}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[fonts.bold, styles.tierEyebrow, { color: colors.goldDark }]}>
                {(ad.tier ? ADVERTISER_TIER_LABELS[ad.tier] : 'Standard Advertiser').toUpperCase()}
              </Text>
              <Text style={[fonts.display, styles.campaignName, { color: colors.ink }]} numberOfLines={2}>
                {ad.campaignName || 'Untitled campaign'}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <AdStatusBadge status={status} />
            <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]}>
              {PLACEMENT_LABELS[placement]}
              {getPlacementSub(ad) ? ` · ${getPlacementSub(ad)}` : ''}
            </Text>
          </View>
          <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 7 }]}>
            {formatShortDate(ad.campaignStartDate)} → {endDateLabel}
          </Text>

          <View style={styles.actionsRow}>
            <ActionButton label="Edit" Icon={Pencil} onPress={() => navigation.navigate('AdCampaignEdit', { adId: ad.id })} />
            {/* Matches web's `canPause`/`canResume` gating exactly — Pause only exists for an
             * active campaign, Resume only for a paused one; draft/review/ended campaigns get
             * neither button, not a mis-wired "Resume" that calls an action web never allows in
             * that state (the earlier version always rendered one via a plain ternary). */}
            {(status === 'active' || status === 'paused') && (
              <ActionButton
                label={status === 'active' ? 'Pause' : 'Resume'}
                Icon={status === 'active' ? Pause : Play}
                onPress={handleTogglePause}
                loading={pausing}
              />
            )}
            <ActionButton label="Delete" Icon={Trash2} onPress={() => setConfirmDeleteOpen(true)} danger />
          </View>
        </View>

        <View style={[styles.metricsGrid, { borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
          {metrics.map((m, i) => (
            <View
              key={m.label}
              style={[
                styles.metricCell,
                { backgroundColor: colors.surface },
                i % 2 === 0 && { borderRightColor: colors.border, borderRightWidth: borderWidth.thin },
                i < metrics.length - 2 && { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin },
              ]}
            >
              <Text style={[fonts.bold, styles.metricLabel, { color: colors.ink3 }]}>{m.label.toUpperCase()}</Text>
              <Text style={[fonts.display, styles.metricValue, { color: colors.ink }]}>{m.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
          <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Performance over time</Text>
          <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 3 }]}>
            Impressions and clicks for the selected range
          </Text>
          <View style={styles.rangeRow}>
            {['7d', '30d', 'All'].map(r => (
              <View key={r} style={[styles.rangeChip, { backgroundColor: colors.surfaceSunken, borderRadius: radius.pill }]}>
                <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink3 }]}>{r}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.placeholderBox, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surfaceSunken }]}>
            <TrendingUp size={20} color={colors.ink3} strokeWidth={1.5} />
            <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink, marginTop: 8 }]}>
              {hasAnalytics ? 'Daily trends coming soon' : 'No performance data yet'}
            </Text>
            <Text style={[fonts.regular, styles.placeholderDesc, { fontSize: fontSize.caption, color: colors.ink3 }]}>
              {hasAnalytics
                ? 'Your campaign is collecting data — a day-by-day breakdown will appear here soon.'
                : 'Trend lines appear here once your campaign is live and collecting impressions.'}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
          <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Where it runs</Text>
          <View style={styles.whereRunsRow}>
            <View style={{ flex: 1 }}>
              <Text style={[fonts.bold, { fontSize: fontSize.caption, color: colors.ink }]}>Home Feed</Text>
              <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 3 }]}>
                {ad.homePlacement ? (hasAnalytics && ad.impressions != null ? `${ad.impressions.toLocaleString('en-US')} impressions` : 'Active — platform-wide') : 'Not enabled'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[fonts.bold, { fontSize: fontSize.caption, color: colors.ink }]}>ETA Chapter Pages</Text>
              <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 3 }]}>
                {ad.etaChapterIds.length > 0 ? getPlacementSub(ad) : 'Not enabled'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
          <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Creative</Text>
          <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 3 }]}>How it appears in feed</Text>
          <View style={[styles.creativeFrame, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surfaceSunken }]}>
            {ad.adBannerUrl ? (
              <Image source={{ uri: ad.adBannerUrl }} style={[styles.bannerImage, { borderRadius: radius.md }]} resizeMode="cover" />
            ) : (
              <View style={[styles.bannerImage, styles.bannerPlaceholder, { borderRadius: radius.md, backgroundColor: colors.surface }]}>
                <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]}>No banner uploaded</Text>
              </View>
            )}
            <View style={[styles.creativePreviewCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: borderWidth.thin }]}>
              <Text style={[fonts.bold, styles.sponsoredLabel, { color: colors.ink3 }]}>SPONSORED · {ad.brandName || 'Advertiser'}</Text>
              <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink, marginTop: 5 }]} numberOfLines={1}>
                {ad.adHeadline || 'No headline set'}
              </Text>
              {!!ad.adBodyText && (
                <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink2, marginTop: 4 }]} numberOfLines={3}>
                  {ad.adBodyText}
                </Text>
              )}
              <View style={[styles.ctaButton, { backgroundColor: colors.feedFill, borderRadius: radius.sm }]}>
                <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.feedOnFill }]}>{ad.adCtaText || 'Learn more'} →</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
          <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Targeting</Text>
          <KeyValueRows rows={targetingRows} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
          <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Schedule &amp; budget</Text>
          <KeyValueRows rows={scheduleRows} />
          <View style={styles.spentBlock}>
            <View style={styles.spentRow}>
              <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]}>Spent to date</Text>
              <Text style={[fonts.semibold, { fontSize: fontSize.caption, color: colors.ink2 }]}>{hasBudget ? money(ad.spendToDate) : '—'}</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSunken }]}>
              {hasBudget && <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.gold }]} />}
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
          <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Recent activity</Text>
          <View style={styles.activityList}>
            {buildActivityLog(ad).map((entry, i) => (
              <View key={i} style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: activityDotColor(entry.color, colors) }]} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[fonts.regular, { fontSize: fontSize.body, color: colors.ink }]}>{entry.text}</Text>
                  <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 2 }]}>{formatShortDate(entry.time)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDeleteOpen}
        title="Delete this campaign?"
        message="This cannot be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </SafeAreaView>
  );
}

/** Matches web's status→dot-color mapping (`buildActivityLog`'s `color` field, computed in
 * `types/adManagement.ts`) — the earlier version hardcoded every dot gold regardless of event. */
function activityDotColor(color: AdActivityColor, colors: ReturnType<typeof useTheme>['colors']): string {
  switch (color) {
    case 'active':
      return colors.success;
    case 'ended':
      return colors.danger;
    case 'review':
      return colors.gold;
    default:
      return colors.ink3;
  }
}

function ActionButton({
  label,
  Icon,
  onPress,
  danger,
  loading,
}: {
  label: string;
  Icon: typeof Pencil;
  onPress: () => void;
  danger?: boolean;
  loading?: boolean;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.actionButton,
        {
          borderRadius: radius.lg,
          borderWidth: borderWidth.thin,
          borderColor: colors.border,
          backgroundColor: danger ? colors.dangerSurface : colors.surfaceSunken,
          opacity: loading ? 0.6 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={danger ? colors.danger : colors.ink2} />
      ) : (
        <>
          <Icon size={13} color={danger ? colors.danger : colors.ink2} strokeWidth={1.7} />
          <Text style={[fonts.bold, { fontSize: fontSize.small, color: danger ? colors.danger : colors.ink2 }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  scroll: {
    padding: 16,
    gap: 13,
  },
  card: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarLg: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLgText: {
    fontSize: 17,
    color: '#fff',
  },
  tierEyebrow: {
    fontSize: 9,
    letterSpacing: 0.6,
  },
  campaignName: {
    fontSize: 20,
    marginTop: 3,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 13,
  },
  actionButton: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  metricCell: {
    width: '50%',
    padding: 13,
  },
  metricLabel: {
    fontSize: 8.5,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 20,
    marginTop: 5,
  },
  cardTitle: {
    fontSize: 16,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  rangeChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  whereRunsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
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
    maxWidth: 230,
  },
  creativeFrame: {
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 10,
    marginTop: 12,
  },
  bannerImage: {
    width: '100%',
    height: 120,
  },
  bannerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  creativePreviewCard: {
    padding: 11,
    marginTop: 10,
  },
  sponsoredLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    height: 32,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
  },
  spentBlock: {
    gap: 6,
    marginTop: 12,
  },
  spentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  activityList: {
    gap: 13,
    marginTop: 13,
  },
  activityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  activityDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 5,
  },
});

export default AdCampaignDetailScreen;
