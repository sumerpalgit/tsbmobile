import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  ActivityTab,
  fetchActivityTabStats,
  fetchMyActivityCounts,
  fetchMyActivityTab,
} from '../api/myActivity';
import { fetchEngagements, fetchInteractionCounts } from '../api/engagement';
import { MY_ACTIVITY_QUERY_KEY, MY_ACTIVITY_STATS_QUERY_KEY } from '../api/queryKeys';
import type { FeedEngagement } from '../api/feed';

/** Matches web's `PAGE_SIZE = 10` (`my-activities/page.tsx`). */
const PAGE_SIZE = 10;

/** One tab's paginated list, same `useInfiniteQuery` shape as `useHomeFeed.ts`, plus the batch
 * engagement/interaction-count fetch My Activity's list endpoints need (they don't inline
 * `engagements` the way `/feed` does — see `fetchEngagements`/`fetchInteractionCounts`'s own doc
 * comments).
 *
 * Re-fetches the batch for every currently-loaded item whenever the underlying query completes a
 * fetch (`query.dataUpdatedAt` changes) — not just for ids never seen before. An earlier version
 * only fetched brand-new ids, which meant a like/comment/vote made from this screen would
 * invalidate-and-refetch the item list correctly but the engagement data backing "You liked this"/
 * the comment-edit bar/etc. stayed stale forever once an id had been fetched once (confirmed
 * on-device: editing a comment showed the old text after the sheet closed). Re-fetching per
 * completed query update is the correct trigger — cheap given typical page sizes, and it's the
 * only reliable signal for "the list (and therefore possibly its engagement data) changed",
 * covering pagination, tab-switch-back, and mutation-driven invalidation alike. */
export function useMyActivityTab(tab: ActivityTab) {
  const query = useInfiniteQuery({
    queryKey: [...MY_ACTIVITY_QUERY_KEY, tab],
    queryFn: ({ pageParam }) => fetchMyActivityTab(tab, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) => (lastPage.hasNextPage ? lastPageParam + 1 : undefined),
  });

  // De-duped by id — matches web's own `seenIds` Set pass in `renderPosts`/`renderFeedItems`
  // (`my-activities/page.tsx`). Without it, an item straddling a page boundary during infinite
  // scroll (or a page re-fetched after invalidation while a later page is still cached) can appear
  // twice, which crashed React Native's list with a duplicate-key error on-device.
  const items = useMemo(() => {
    const all = query.data?.pages.flatMap(page => page.items) ?? [];
    const seen = new Set<string>();
    return all.filter(item => (seen.has(item.id) ? false : (seen.add(item.id), true)));
  }, [query.data]);

  const [engagements, setEngagements] = useState<Record<string, FeedEngagement>>({});
  const [interactionCounts, setInteractionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const ids = items.map(item => item.id);
    if (ids.length === 0) return;

    fetchEngagements(ids).then(result => setEngagements(prev => ({ ...prev, ...result })));
    fetchInteractionCounts(ids).then(result => setInteractionCounts(prev => ({ ...prev, ...result })));
  }, [items, query.dataUpdatedAt]);

  return { ...query, items, engagements, interactionCounts };
}

/** Tab counts + hero stats — fetched once per screen mount (react-query's default caching means
 * switching tabs, which doesn't touch this query key, never refetches it), matching web exactly:
 * `tabCounts`/`tabStats` are both mount-only `useEffect([])` fetches on web too, not refetched on
 * tab switch or after a mutation (a real, if imperfect, piece of web's own behavior — see the
 * plan's Phase 1 note — not something to silently "fix" here). */
export function useMyActivityStats() {
  return useQuery({
    queryKey: MY_ACTIVITY_STATS_QUERY_KEY,
    queryFn: async () => {
      const [counts, stats] = await Promise.all([fetchMyActivityCounts(), fetchActivityTabStats()]);
      return { counts, stats };
    },
  });
}
