import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { FEED_PAGE_LIMIT, FeedEngagement, fetchUserFeed } from '../api/feed';
import { USER_FEED_QUERY_KEY } from '../api/queryKeys';

/** One user's own feed posts — View Profile's Posts tab. Mirrors `useHomeFeed`'s infinite-query
 * shape, minus the search/filter machinery: web's own search box on this tab filters client-side
 * over already-fetched pages rather than sending a query param, so this hook stays a plain
 * paginated fetch and the screen does its own local filtering over `items`. */
export function useUserFeed(username: string) {
  const queryClient = useQueryClient();
  const queryKey = [...USER_FEED_QUERY_KEY, username];
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchUserFeed(username, pageParam, FEED_PAGE_LIMIT),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) => (lastPage.hasNextPage ? lastPageParam + 1 : undefined),
    enabled: !!username,
  });

  const engagements: Record<string, FeedEngagement> = {};
  query.data?.pages.forEach(page => Object.assign(engagements, page.engagements));

  const items = query.data?.pages.flatMap(page => page.items) ?? [];

  /** For pull-to-refresh specifically — plain `refetch()` on an infinite query re-fetches EVERY
   * currently-loaded page (preserving however deep the user has scrolled), which isn't what a
   * pull-to-refresh gesture means ("give me the latest, starting over"). `resetQueries` clears
   * the cached pages first, so the query goes back to fetching just `initialPageParam` (page 1)
   * — real pagination reset, not a same-depth re-fetch. */
  const resetAndRefetch = () => queryClient.resetQueries({ queryKey });

  return { ...query, items, engagements, resetAndRefetch };
}
