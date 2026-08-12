import type { ThemeColors } from '../theme/colors';

/** The real, canonical status union (`types.ts`'s `AdStatus` on web) — used verbatim as the
 * `status` PUT param for `updateAdStatus`/`updateAd`. */
export type AdStatus = 'active' | 'review' | 'paused' | 'draft' | 'ended';

export type AdPlacement = 'home' | 'eta' | 'both' | 'none';

/** Flat — matches the real `GET /ads/:id` / `GET /ads/my-ads` record exactly (no nested
 * targeting/schedule/creative objects; confirmed by reading web's `manage/[adId]/page.tsx` and
 * `types.ts` in full). `status` is kept as the raw, possibly-absent value from the backend —
 * always resolve a display status via `deriveStatus()` below, never read this field directly,
 * since real web treats it as optional/unreliable pending a "Phase 3 migration". */
export type AdCampaign = {
  id: string;
  brandName: string;
  campaignName: string;
  advertiserType: string | null;
  primaryContactEmail: string | null;
  homePlacement: boolean;
  etaChapterIds: string[];
  adBannerUrl: string | null;
  clickDestinationType: string | null;
  clickDestinationUrl: string | null;
  adHeadline: string | null;
  adBodyText: string | null;
  adCtaText: string | null;
  targetAudience: string[];
  targetGeography: string[];
  campaignStartDate: string | null;
  campaignEndDate: string | null;
  campaignDurationWeeks: number | null;
  priceAmount: number | null;
  totalBudget: number | null;
  spendToDate: number | null;
  impressions: number | null;
  clicks: number | null;
  tier: 'standard' | 'premium' | null;
  status: string | null;
  paymentCompleted: boolean;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export const STATUS_LABELS: Record<AdStatus, string> = {
  active: 'Active',
  review: 'In Review',
  paused: 'Paused',
  draft: 'Draft',
  ended: 'Ended',
};

const VALID_STATUSES: AdStatus[] = ['active', 'review', 'paused', 'draft', 'ended'];

/** Derives the campaign's end date from `campaignEndDate` if present, else
 * `campaignStartDate + campaignDurationWeeks*7 days` — same fallback web's own `deriveStatus`
 * and detail-page "days remaining" math use, since `campaign_end_date` isn't always populated. */
export function getCampaignEndDate(ad: AdCampaign): Date | null {
  if (ad.campaignEndDate) return new Date(ad.campaignEndDate);
  if (!ad.campaignStartDate) return null;
  const start = new Date(ad.campaignStartDate);
  if (Number.isNaN(start.getTime())) return null;
  const weeks = ad.campaignDurationWeeks ?? 0;
  return new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
}

/** Matches web's `deriveStatus()` (`adHelpers.ts`) exactly: prefer an explicit, valid `status`
 * field; otherwise infer from the legacy boolean fields + schedule, in this exact order — a
 * backend `status` migration isn't guaranteed to have landed on every record. */
export function deriveStatus(ad: AdCampaign): AdStatus {
  if (ad.status && (VALID_STATUSES as string[]).includes(ad.status)) {
    return ad.status as AdStatus;
  }
  const now = new Date();
  const end = getCampaignEndDate(ad);
  if (end && end < now) return 'ended';
  if (!ad.isPublished) return 'draft';
  if (!ad.paymentCompleted) return 'review';
  if (ad.isActive) return 'active';
  const start = ad.campaignStartDate ? new Date(ad.campaignStartDate) : null;
  if (start && start > now) return 'review';
  return 'paused';
}

export function getStatusColors(status: AdStatus, colors: ThemeColors): { fg: string; bg: string } {
  switch (status) {
    case 'active':
      return { fg: colors.success, bg: colors.successSurface };
    case 'review':
      return { fg: colors.goldDark, bg: colors.chip };
    case 'paused':
      return { fg: colors.ink2, bg: colors.surfaceSunken };
    case 'draft':
      return { fg: colors.ink3, bg: colors.surfaceSunken };
    case 'ended':
      return { fg: colors.danger, bg: colors.dangerSurface };
  }
}

/** `home_placement` + `eta_chapter_ids.length` is the only real signal — matches web's own
 * derivation exactly, including the `'none'` case (`derivePlacement()`/`adHelpers.ts`): a
 * campaign with neither flag set genuinely has no placement configured and must not be
 * miscategorized as "Home Feed" — the earlier version's unconditional `return 'home'` fallback
 * was a real bug (it also wrongly matched the "Home Feed" filter chip). */
export function derivePlacement(ad: AdCampaign): AdPlacement {
  const hasEta = ad.etaChapterIds.length > 0;
  if (ad.homePlacement && hasEta) return 'both';
  if (hasEta) return 'eta';
  if (ad.homePlacement) return 'home';
  return 'none';
}

export const PLACEMENT_LABELS: Record<AdPlacement, string> = {
  home: 'Home Feed',
  eta: 'ETA Chapter',
  both: 'Home + ETA Chapter',
  none: 'Not set',
};

/** e.g. "2 chapters" / "" — matches the mockup's `placementSub` field. */
export function getPlacementSub(ad: AdCampaign): string {
  const n = ad.etaChapterIds.length;
  return n > 0 ? `${n} chapter${n === 1 ? '' : 's'}` : '';
}

export function money(amount: number | null | undefined): string {
  return `$${Math.round(amount ?? 0).toLocaleString('en-US')}`;
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Same as `formatShortDate` without the year — matches web's `fmtDateShort`, used for compact
 * list-card contexts (e.g. "Created Aug 10"). */
export function formatDateShort(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** e.g. "Sep 2 · 26 days left" / "Ended Jun 15" — matches web's `endDateSub(ad, status)`
 * (`adHelpers.ts`) exactly, including its status-aware branches: pure date arithmetic alone isn't
 * enough — a paused campaign whose end date hasn't passed yet should read "Resumable", not
 * "N days left" (which would misleadingly imply it's actively running down its schedule). */
export function getEndText(ad: AdCampaign, status: AdStatus): string {
  const end = getCampaignEndDate(ad);
  if (!end) return '—';
  const dateLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (status === 'ended') return `Ended ${dateLabel}`;
  if (status === 'paused') return `${dateLabel} · Resumable`;
  if (status === 'review') return `${dateLabel} · Scheduled`;
  if (status === 'draft') return `${dateLabel} · Not launched`;
  const daysLeft = Math.ceil((end.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return daysLeft > 0 ? `${dateLabel} · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : `Ended ${dateLabel}`;
}

/** Per-campaign CPM/CPC — same formulas as `aggregateKpis`'s account-level math, just scoped to
 * one campaign's own spend/impressions/clicks. `null` (rendered "—") when there's nothing to
 * divide by, matching `getCtr`'s same empty-state convention. */
export function getCpm(ad: AdCampaign): number | null {
  if (!ad.impressions) return null;
  return ((ad.spendToDate ?? 0) / ad.impressions) * 1000;
}

export function getCpc(ad: AdCampaign): number | null {
  if (!ad.clicks) return null;
  return (ad.spendToDate ?? 0) / ad.clicks;
}

export function getDaysElapsed(ad: AdCampaign): string {
  if (!ad.campaignStartDate) return '—';
  const start = new Date(ad.campaignStartDate);
  const end = getCampaignEndDate(ad);
  if (Number.isNaN(start.getTime()) || !end) return '—';
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  const elapsed = Math.max(0, Math.min(totalDays, Math.round((Date.now() - start.getTime()) / (24 * 60 * 60 * 1000))));
  return `${elapsed} of ${totalDays}`;
}

export function getDaysRemaining(ad: AdCampaign): string {
  const end = getCampaignEndDate(ad);
  if (!end) return '—';
  const days = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return `${days} day${days === 1 ? '' : 's'}`;
}

export const ADVERTISER_TIER_LABELS: Record<'standard' | 'premium', string> = {
  standard: 'Standard Advertiser',
  premium: 'Premium Advertiser',
};

/** Matches web's `tierLabel(ad)` (`adHelpers.ts`) exactly — used for the dashboard card's compact
 * meta line, which shows Tier rather than the detail screen's fuller "Standard/Premium Advertiser"
 * eyebrow. Falls back to the raw `advertiserType` value, then `'Standard'`, when `tier` itself is
 * unset — same fallback chain web uses, not a hardcoded literal. */
export function getTierLabel(ad: AdCampaign): string {
  if (ad.tier === 'premium') return 'Premium';
  if (ad.tier === 'standard') return 'Standard';
  return ad.advertiserType || 'Standard';
}

export type AdMetricKey = 'impressions' | 'clicks' | 'spend' | 'cpm';

export const METRIC_LABELS: Record<AdMetricKey, string> = {
  impressions: 'Impressions',
  clicks: 'Clicks',
  spend: 'Spend',
  cpm: 'Avg. CPM',
};

/** Unlike the mockup's own fixture (which hardcodes spend to `$0` and only ranks
 * impressions/clicks), real per-campaign spend/CPM are genuinely computable from the same fields
 * every other metric already uses — so all 4 metrics rank real data here, not just 2 (plan
 * decision #8: the mockup's `hasRanks` restriction was a fixture artifact, not real behavior to
 * preserve). */
export function getMetricValue(ad: AdCampaign, metric: AdMetricKey): number {
  switch (metric) {
    case 'impressions':
      return ad.impressions ?? 0;
    case 'clicks':
      return ad.clicks ?? 0;
    case 'spend':
      return ad.spendToDate ?? 0;
    case 'cpm':
      return getCpm(ad) ?? 0;
  }
}

export function formatMetricValue(value: number, metric: AdMetricKey): string {
  if (metric === 'spend') return money(value);
  if (metric === 'cpm') return `$${value.toFixed(2)}`;
  return Math.round(value).toLocaleString('en-US');
}

/** `null` (rendered as "—") when there are no impressions to divide by — matches web's own
 * empty-state convention for CTR rather than showing a misleading "0.00%". */
export function getCtr(ad: AdCampaign): number | null {
  if (!ad.impressions) return null;
  return ((ad.clicks ?? 0) / ad.impressions) * 100;
}

export function getBudgetAmount(ad: AdCampaign): number {
  return ad.totalBudget ?? ad.priceAmount ?? 0;
}

/** Matches web's `hasBudget` check — a campaign with neither `total_budget` nor `price_amount`
 * set genuinely has no budget configured, and should render as "—" rather than the misleading
 * "$0 / $0" a bare `getBudgetAmount()` reading of 0 would otherwise produce. */
export function hasBudgetSet(ad: AdCampaign): boolean {
  return (ad.totalBudget != null && ad.totalBudget > 0) || (ad.priceAmount != null && ad.priceAmount > 0);
}

export function getBudgetProgress(ad: AdCampaign): number {
  const budget = getBudgetAmount(ad);
  if (budget <= 0) return 0;
  return Math.min(1, (ad.spendToDate ?? 0) / budget);
}

export type AdKpis = {
  totalImpressions: number;
  totalClicks: number;
  ctr: number | null;
  totalSpend: number;
  totalBudget: number;
  cpm: number | null;
  /** Whether ANY campaign has real (non-null) impressions/clicks tracked yet — matches web's
   * `hasAnalytics` distinction (`adHelpers.ts`): impressions/clicks/CPM are delivery data that
   * genuinely doesn't exist pre-launch, unlike spend (ledger data, always meaningful as "$0"), so
   * those three should render "—" rather than a misleading "0" when this is false. */
  hasAnalytics: boolean;
};

/** Lifetime-cumulative aggregates over the whole account, computed client-side from the same
 * `GET /ads/my-ads` array real web fetches — matches web's own `aggregateKpis`/`getCtr`/
 * `getBudget` math (`adHelpers.ts`). No dedicated stats endpoint is ever called (see the plan's
 * decision #4 — `GET /ads/kpi-summary` is dead code real web itself never calls). */
export function aggregateKpis(ads: AdCampaign[]): AdKpis {
  const totalImpressions = ads.reduce((sum, ad) => sum + (ad.impressions ?? 0), 0);
  const totalClicks = ads.reduce((sum, ad) => sum + (ad.clicks ?? 0), 0);
  const totalSpend = ads.reduce((sum, ad) => sum + (ad.spendToDate ?? 0), 0);
  const totalBudget = ads.reduce((sum, ad) => sum + getBudgetAmount(ad), 0);
  return {
    totalImpressions,
    totalClicks,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null,
    totalSpend,
    totalBudget,
    cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : null,
    hasAnalytics: ads.some(ad => ad.impressions != null || ad.clicks != null),
  };
}

export type AdActivityColor = 'active' | 'ended' | 'review' | 'neutral';

export type AdActivityEntry = {
  text: string;
  time: string;
  color: AdActivityColor;
};

const STATUS_ACTIVITY_TEXT: Record<AdStatus, string> = {
  active: 'Campaign is live and running',
  paused: 'Campaign is paused',
  review: 'Campaign is pending review',
  draft: 'Saved as a draft',
  ended: 'Campaign has ended',
};

/** Matches web's own status→dot-color mapping (`adHelpers.ts`) — active is green, ended is red,
 * review/updated is gold, everything else (paused/draft) is a plain neutral dot. */
const STATUS_ACTIVITY_COLOR: Record<AdStatus, AdActivityColor> = {
  active: 'active',
  ended: 'ended',
  review: 'review',
  paused: 'neutral',
  draft: 'neutral',
};

/** No real activity-log endpoint exists (confirmed reading web's detail page in full) — web
 * synthesizes 2–3 entries client-side from `created_at`/`updated_at`/derived status
 * (`buildActivityLog()`), and this ports that exactly rather than inventing a richer log the
 * backend doesn't actually track. Matches web's exact presentation too: newest-first order (the
 * status line is always "now", so it's pinned first via a synthetic +1ms sort key) and
 * status-colored dots — the earlier version pushed entries oldest-first with every dot hardcoded
 * gold, both real regressions from web's behavior. */
export function buildActivityLog(ad: AdCampaign): AdActivityEntry[] {
  const entries: { text: string; time: string; color: AdActivityColor; sortKey: number }[] = [];
  if (ad.createdAt) {
    entries.push({ text: 'Campaign created', time: ad.createdAt, color: 'neutral', sortKey: new Date(ad.createdAt).getTime() });
  }
  if (ad.updatedAt && ad.updatedAt !== ad.createdAt) {
    entries.push({ text: 'Campaign details updated', time: ad.updatedAt, color: 'review', sortKey: new Date(ad.updatedAt).getTime() });
  }
  const status = deriveStatus(ad);
  const statusTime = ad.updatedAt ?? ad.createdAt ?? '';
  const statusSortKey = (statusTime ? new Date(statusTime).getTime() : 0) + 1;
  entries.push({ text: STATUS_ACTIVITY_TEXT[status], time: statusTime, color: STATUS_ACTIVITY_COLOR[status], sortKey: statusSortKey });

  return entries.sort((a, b) => b.sortKey - a.sortKey).map(({ text, time, color }) => ({ text, time, color }));
}

export type AdFilters = {
  query: string;
  statuses: AdStatus[];
  placements: AdPlacement[];
  minBudget: string;
  maxBudget: string;
  startAfter: string;
  endBefore: string;
};

export const EMPTY_AD_FILTERS: AdFilters = {
  query: '',
  statuses: [],
  placements: [],
  minBudget: '',
  maxBudget: '',
  startAfter: '',
  endBefore: '',
};

/** Matches web's `matchesFilters()` exactly — every filter dimension (status/search/placement/
 * budget/date-range) is applied client-side over the one unfiltered `GET /ads/my-ads` payload,
 * since no server-side filter params exist for this endpoint (confirmed reading
 * `actions/ad-management.ts` in full — `fetchMyAds()` takes zero params). */
export function matchesAdFilters(ad: AdCampaign, filters: AdFilters): boolean {
  const status = deriveStatus(ad);
  if (filters.statuses.length > 0 && !filters.statuses.includes(status)) return false;

  if (filters.placements.length > 0 && !filters.placements.includes(derivePlacement(ad))) return false;

  if (filters.query.trim()) {
    const q = filters.query.trim().toLowerCase();
    const haystack = `${ad.campaignName} ${ad.brandName}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  const budget = getBudgetAmount(ad);
  const min = Number(filters.minBudget);
  const max = Number(filters.maxBudget);
  if (filters.minBudget && !Number.isNaN(min) && budget < min) return false;
  if (filters.maxBudget && !Number.isNaN(max) && budget > max) return false;

  if (filters.startAfter && ad.campaignStartDate && ad.campaignStartDate < filters.startAfter) return false;
  if (filters.endBefore) {
    const end = getCampaignEndDate(ad);
    if (end && end.toISOString().slice(0, 10) > filters.endBefore) return false;
  }

  return true;
}

/** Matches web's `countActiveFilters()` exactly — counts active filter *categories* (status/
 * placement/budget-range/date-range), max 4, not individual selected values within a category.
 * Selecting 2 statuses is still 1 active filter, same as web; the earlier version counted every
 * individual status/placement/date as its own item, so the same selection could read "4 active"
 * on mobile vs web's "2". Shared by `useAdCampaigns` (dashboard badge) and `AdFiltersPanel` (its
 * own header badge) so the two can't drift out of sync again. */
export function countActiveFilterCategories(filters: AdFilters): number {
  return [
    filters.statuses.length > 0,
    filters.placements.length > 0,
    !!(filters.minBudget || filters.maxBudget),
    !!(filters.startAfter || filters.endBefore),
  ].filter(Boolean).length;
}
