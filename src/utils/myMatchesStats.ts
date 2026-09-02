import type { FeedMatch, MyPostMatchSummary, SuggestedMatch } from '../api/myMatches';

/**
 * My Matches' hero-stat and search derivations, ported from
 * `webSrc/app/dashboard/my-matches/page.tsx:200-310` and its `HeroStat` block (`:379-405`).
 *
 * Every rule here is web's, reproduced deliberately so the hero numbers on mobile match the ones
 * the same account shows on web. The **raw item lists on screen do not use any of this** — they
 * stay unfiltered on purpose, which is exactly why the stats and the list counts can disagree.
 * That disagreement is information, not a bug: it is how much of the data web is hiding.
 */

/**
 * The only feed types web counts as real matches (`page.tsx:249`). `event`, `atc`, `poll` and
 * `find_a_connection` are excluded — note `fae` is in and `find_a_connection` is out, even though
 * both render as "Find My Match" in web's own label map. That asymmetry is web's, kept as-is.
 */
const VALID_MATCH_TYPES = new Set(['deal', 'search_capital', 'investor_corner', 'job', 'fae']);

/** Web's `MATCH_THRESHOLD` (`page.tsx:250`) — matches scoring below this are hidden entirely. */
export const MATCH_THRESHOLD = 30;

/**
 * Web's `dedupByFeed` (`page.tsx:233-247`): drop rows whose post no longer exists, sort by score
 * descending, then keep only the best-scoring row per `feed.id`.
 *
 * Note it reads `m.feed`, **not** `feed_full` — unlike the card renderer, which prefers
 * `feed_full` (`page.tsx:2518`). A row carrying only `feed_full` is therefore dropped from the
 * stats but still rendered by the grid. Reproduced rather than corrected: silently diverging
 * would make the mobile numbers disagree with web's for no stated reason.
 */
function dedupByFeed(matches: FeedMatch[]): FeedMatch[] {
  const seen = new Set<string>();
  return [...matches]
    .filter(m => Boolean(m.feed))
    .sort((a, b) => (b.match_percentage ?? 0) - (a.match_percentage ?? 0))
    .filter(m => {
      const feedId = String(m.feed?.id ?? '');
      if (!feedId || seen.has(feedId)) return false;
      seen.add(feedId);
      return true;
    });
}

/**
 * Web's `matchmaking51` (`page.tsx:251`) — the basis for every "Where I'm a Fit" stat and for the
 * "Mutual Interests" tile on "From My Posts". The name is web's and is misleading: the floor it
 * applies is `MATCH_THRESHOLD` (30), not 51. The separate 51% floor lives on a different list
 * (`page.tsx:221`) that no stat reads.
 */
export function qualifyingFeedMatches(matchmaking: FeedMatch[]): FeedMatch[] {
  return dedupByFeed(
    matchmaking.filter(
      m =>
        (m.match_percentage ?? 0) >= MATCH_THRESHOLD &&
        VALID_MATCH_TYPES.has(String(m.feed?.feed_type)),
    ),
  );
}

export type HeroStat = { value: number; label: string };

/** `page.tsx:397-403`. Computed over the raw suggested list — including its passed rows, which is
 * why "Passed" can be non-zero here without a second request. */
export function suggestedStats(suggested: SuggestedMatch[]): HeroStat[] {
  return [
    { value: suggested.length, label: 'Suggested' },
    { value: suggested.filter(m => m.profile_interest === null).length, label: 'New' },
    {
      value: suggested.filter(m => m.profile_interest === true && m.creator_interest === true)
        .length,
      label: 'Mutual',
    },
    { value: suggested.filter(m => m.profile_interest === true).length, label: 'Interested' },
    { value: suggested.filter(m => m.passed_at !== null).length, label: 'Passed' },
  ];
}

/**
 * `page.tsx:381-387`. Two of these five tiles are computed off the *match* list rather than the
 * post list — "Mutual Interests" from the qualifying set, "NDAs in Progress" from the **full**
 * unfiltered `matchmaking` array. Web mixes the two sources here; kept as-is.
 */
export function myPostsStats(
  userPosts: MyPostMatchSummary[],
  matchmaking: FeedMatch[],
): HeroStat[] {
  const qualifying = qualifyingFeedMatches(matchmaking);
  return [
    { value: userPosts.length, label: 'Total Posts' },
    {
      value: userPosts.reduce((sum, p) => sum + (p.match_count ?? 0), 0),
      label: 'Total Matches',
    },
    {
      value: userPosts.filter(p => (p.match_count ?? 0) > 0).length,
      label: 'Posts with Matches',
    },
    {
      value: qualifying.filter(m => m.profile_interest && m.creator_interest).length,
      label: 'Mutual Interests',
    },
    { value: matchmaking.filter(m => m.nda_sent === true).length, label: 'NDAs in Progress' },
  ];
}

/** `page.tsx:389-395`. All five off the qualifying set. */
export function imAFitStats(matchmaking: FeedMatch[]): HeroStat[] {
  const q = qualifyingFeedMatches(matchmaking);
  return [
    {
      value: q.filter(m => !m.profile_interest && !m.creator_interest).length,
      label: 'New Matches',
    },
    {
      value: q.filter(m => m.creator_interest === true && !m.profile_interest).length,
      label: 'Interested in You',
    },
    {
      value: q.filter(m => m.profile_interest && m.creator_interest).length,
      label: 'Mutual Matches',
    },
    { value: q.filter(m => m.nda_sent).length, label: 'NDA Requested' },
    { value: q.filter(m => m.profile_interest === false).length, label: 'Passed' },
  ];
}

/* ----------------------------------------------------------------- search */

/**
 * Search is a plain client-side substring match over already-fetched lists, exactly as web does
 * it — there is no search param on any My Matches endpoint. Undebounced for the same reason
 * `ChapterChatListScreen` is: nothing goes over the network, so a delay would only add lag.
 *
 * The fields searched per tab are web's, not a guess — each list matches on different keys.
 */

function contains(haystack: unknown, needle: string): boolean {
  return String(haystack ?? '')
    .toLowerCase()
    .includes(needle);
}

/** `page.tsx:679-684` — name, sub-category, and the AI summary. */
export function filterSuggested(items: SuggestedMatch[], search: string): SuggestedMatch[] {
  const q = search.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    m =>
      contains(m.target?.name, q) ||
      contains(m.target?.sub_category, q) ||
      contains(m.match_summary, q),
  );
}

/** `page.tsx:211-215` — post title, post author's name, and the AI summary. */
export function filterFeedMatches(items: FeedMatch[], search: string): FeedMatch[] {
  const q = search.trim().toLowerCase();
  if (!q) return items;
  return items.filter(m => {
    const feed = m.feed_full ?? m.feed ?? {};
    return (
      contains(feed.title, q) ||
      contains(feed.profile?.name, q) ||
      contains(m.match_summary, q)
    );
  });
}

/** `page.tsx:305` — one derived title string, falling back through three keys to the feed type. */
export function filterMyPosts(
  items: MyPostMatchSummary[],
  search: string,
): MyPostMatchSummary[] {
  const q = search.trim().toLowerCase();
  if (!q) return items;
  return items.filter(p => {
    const item = p.item ?? {};
    const title = item.post_title ?? item.business_name ?? item.title ?? p.feed_type;
    return contains(title, q);
  });
}
