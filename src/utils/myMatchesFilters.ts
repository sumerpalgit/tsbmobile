import type { FeedMatch, MyPostMatchSummary } from '../api/myMatches';

/**
 * My Matches' filter model, ported from `webSrc/app/dashboard/my-matches/page.tsx`.
 *
 * Web's filter state (`page.tsx:116`) is four single-select strings, all client-side — no My
 * Matches endpoint accepts a filter param. They apply to the **From My Posts** and **Where I'm a
 * Fit** tabs only; web hides the Filters button entirely on Suggested (`page.tsx:429`).
 *
 * Filters reset whenever the tab changes (`page.tsx:160`), because two of the four groups have
 * different options per tab and a third only exists on one of them.
 */

export type MyMatchesFilters = {
  postType: string;
  matchStatus: string;
  fitScore: string;
  dateRange: string;
};

/** Web's initial state (`page.tsx:116`) — note two groups reset to `'all'` and two to `'any'`. */
export const EMPTY_MY_MATCHES_FILTERS: MyMatchesFilters = {
  postType: 'all',
  matchStatus: 'all',
  fitScore: 'any',
  dateRange: 'any',
};

export type FilterOption = { value: string; label: string };

/** `page.tsx:533-539`. Labels are the product's names for each post type, not the raw keys. */
export const POST_TYPE_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'deal', label: 'Share a Deal' },
  { value: 'search_capital', label: 'Back a Searcher' },
  { value: 'investor_corner', label: 'Invest in a Deal' },
  { value: 'job', label: 'Post a Job' },
  { value: 'find_a_connection', label: 'Find My Match' },
];

/** `page.tsx:560-566`. Values are `getFitStage` outputs. */
export const FIT_STATUS_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'creator_interested', label: 'Interested in You' },
  { value: 'expressed', label: 'Interest Expressed' },
  { value: 'mutual', label: 'Mutual Match' },
  { value: 'nda', label: 'NDA Requested' },
];

/** `page.tsx:568-572`. */
export const POSTS_STATUS_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'has_new', label: 'Has Matches' },
  { value: 'no_matches', label: 'No Matches' },
];

/** `page.tsx:593-599`. "Where I'm a Fit" only — posts carry no score of their own. */
export const FIT_SCORE_OPTIONS: FilterOption[] = [
  { value: 'any', label: 'Any score' },
  { value: '90+', label: '90%+ — Strong' },
  { value: '75-89', label: '75–89% — Good' },
  { value: '60-74', label: '60–74% — Moderate' },
  { value: 'below60', label: 'Below 60%' },
];

/** `page.tsx:619-624`. The group's *heading* differs per tab ("Date Posted" / "Surfaced") even
 * though the options are identical, because the date being filtered is different: a post's own
 * creation date on one tab, the moment the match surfaced on the other. */
export const DATE_RANGE_OPTIONS: FilterOption[] = [
  { value: 'any', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: '3months', label: 'Last 3 months' },
];

/**
 * The pipeline stage a match is at, derived from its interest flags and NDA status —
 * `page.tsx:2375-2384`.
 *
 * Order matters: NDA state outranks mutual interest, which outranks one-sided interest. Note
 * `nda_signed` is a stage a row can be in but **not** one the Match Status filter offers, so those
 * rows are only ever reachable through "All". That gap is web's, kept as-is.
 */
export type FitStage =
  | 'new'
  | 'creator_interested'
  | 'expressed'
  | 'mutual'
  | 'nda'
  | 'nda_signed';

export function getFitStage(item: FeedMatch): FitStage {
  const ndaStatus = item.nda_request?.status;
  if (ndaStatus === 'nda_signed' || ndaStatus === 'ppm_and_nda_sent') return 'nda_signed';
  if (ndaStatus === 'nda_sent' || ndaStatus === 'requested' || item.nda_sent === true) return 'nda';
  if (item.profile_interest === true && item.creator_interest === true) return 'mutual';
  if (item.profile_interest === true) return 'expressed';
  if (item.creator_interest === true) return 'creator_interested';
  return 'new';
}

/** `page.tsx:263-271`. */
function withinDateRange(dateStr: string | undefined, range: string): boolean {
  if (range === 'any') return true;
  const parsed = new Date(dateStr ?? '').getTime();
  if (Number.isNaN(parsed)) return false;
  const diff = Date.now() - parsed;
  if (range === 'today') return diff < 86_400_000;
  if (range === 'week') return diff < 7 * 86_400_000;
  if (range === 'month') return diff < 30 * 86_400_000;
  if (range === '3months') return diff < 90 * 86_400_000;
  return true;
}

/**
 * `page.tsx:317-319`. Counts *categories* that are set, not selected values — max 4. Note it walks
 * all four keys regardless of which tab is showing, which is only safe because switching tabs
 * resets every one of them.
 */
export function countActiveMyMatchesFilters(filters: MyMatchesFilters): number {
  return [
    filters.postType !== 'all',
    filters.matchStatus !== 'all',
    filters.fitScore !== 'any',
    filters.dateRange !== 'any',
  ].filter(Boolean).length;
}

export type FilterChip = { key: keyof MyMatchesFilters; label: string };

/** `page.tsx:322-326` — the removable chips shown under the search bar. */
export function activeFilterChips(
  filters: MyMatchesFilters,
  isFitTab: boolean,
): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.postType !== 'all') {
    chips.push({
      key: 'postType',
      label: POST_TYPE_OPTIONS.find(o => o.value === filters.postType)?.label ?? filters.postType,
    });
  }
  if (filters.matchStatus !== 'all') {
    const options = isFitTab ? FIT_STATUS_OPTIONS : POSTS_STATUS_OPTIONS;
    chips.push({
      key: 'matchStatus',
      label: options.find(o => o.value === filters.matchStatus)?.label ?? filters.matchStatus,
    });
  }
  if (filters.fitScore !== 'any') {
    const label = FIT_SCORE_OPTIONS.find(o => o.value === filters.fitScore)?.label;
    chips.push({ key: 'fitScore', label: `Score: ${label ?? filters.fitScore}` });
  }
  if (filters.dateRange !== 'any') {
    chips.push({
      key: 'dateRange',
      label: DATE_RANGE_OPTIONS.find(o => o.value === filters.dateRange)?.label ?? filters.dateRange,
    });
  }
  return chips;
}

/** Resetting one chip has to know which sentinel that group uses — two use `all`, two use `any`. */
export function resetValueFor(key: keyof MyMatchesFilters): string {
  return key === 'fitScore' || key === 'dateRange' ? 'any' : 'all';
}

/**
 * "Where I'm a Fit" — `page.tsx:283-291`.
 *
 * Only the four user-chosen filters are applied. Web additionally imposes a 30% score floor, a
 * feed-type allowlist and a per-post dedup *before* these run; this screen deliberately leaves the
 * list raw, so those three are not applied here.
 *
 * One consequence worth knowing: on web, picking "Find My Match" returns nothing at all, because
 * `find_a_connection` is offered in this filter but excluded by web's own allowlist. Here it can
 * genuinely match, since there is no allowlist to contradict it.
 */
export function applyFeedMatchFilters(
  items: FeedMatch[],
  filters: MyMatchesFilters,
): FeedMatch[] {
  return items.filter(m => {
    const feed = m.feed_full ?? m.feed ?? {};
    if (filters.postType !== 'all' && feed.feed_type !== filters.postType) return false;
    if (filters.matchStatus !== 'all' && getFitStage(m) !== filters.matchStatus) return false;

    if (filters.fitScore !== 'any') {
      const pct = m.match_percentage ?? 0;
      if (filters.fitScore === '90+' && pct < 90) return false;
      if (filters.fitScore === '75-89' && (pct < 75 || pct >= 90)) return false;
      if (filters.fitScore === '60-74' && (pct < 60 || pct >= 75)) return false;
      if (filters.fitScore === 'below60' && pct >= 60) return false;
    }

    return withinDateRange(m.created_at, filters.dateRange);
  });
}

/** "From My Posts" — `page.tsx:303-314`. Fit Score never applies here; posts have no score. */
export function applyMyPostFilters(
  items: MyPostMatchSummary[],
  filters: MyMatchesFilters,
): MyPostMatchSummary[] {
  return items.filter(p => {
    if (filters.postType !== 'all' && p.feed_type !== filters.postType) return false;

    if (filters.matchStatus !== 'all') {
      const count = p.match_count ?? 0;
      if (filters.matchStatus === 'has_new' && count === 0) return false;
      if (filters.matchStatus === 'no_matches' && count > 0) return false;
    }

    return withinDateRange(p.created_at, filters.dateRange);
  });
}
