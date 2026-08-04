import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { FEED_PAGE_LIMIT, FeedEngagement, FeedItem, fetchFeed, searchFeed } from '../api/feed';
import { HOME_FEED_QUERY_KEY } from '../api/queryKeys';
import { useAuth } from '../store/AuthContext';
import { countActiveFilters, FilterState } from '../components/home/FilterPanel';

/** Matches webSrc's search-query debounce (`app/dashboard/page.tsx`) exactly. */
const SEARCH_DEBOUNCE_MS = 500;

/** Home feed — `GET /api/feed` when there's no active search/filter, `GET /api/feed/search`
 * once there is (query text or any `FilterPanel` selection), mirroring webSrc's own
 * `if (debouncedSearchQuery.trim() || selectedPostTypes.length > 0 || hasActiveFilters)
 * searchFeed(...) else fetchFeed(...)` branch. `searchQuery`/`filters` both flow into the
 * `useInfiniteQuery` key, so changing either resets pagination and refetches automatically —
 * no manual "reset to page 1" needed.
 *
 * Refetches on every Home-tab focus, not just first mount — bottom-tab screens stay mounted
 * when you switch tabs, so react-query's own "fetch on mount" only fires once for the screen's
 * whole lifetime otherwise. The ref skips the very first focus so it doesn't double up with the
 * initial `enabled`-triggered fetch. */
export function useHomeFeed(searchQuery: string, filters: FilterState) {
  const { isAuthenticated } = useAuth();
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSearching = debouncedQuery.trim().length > 0 || countActiveFilters(filters) > 0;

  const query = useInfiniteQuery({
    queryKey: [...HOME_FEED_QUERY_KEY, debouncedQuery, filters],
    queryFn: ({ pageParam }) =>
      isSearching
        ? searchFeed(pageParam, FEED_PAGE_LIMIT, {
            query: debouncedQuery,
            postTypes: filters.postTypes,
            postedBy: filters.postedBy,
            topics: filters.topics,
          })
        : fetchFeed(pageParam, FEED_PAGE_LIMIT),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) => (lastPage.hasNextPage ? lastPageParam + 1 : undefined),
    enabled: isAuthenticated,
  });

  const { refetch } = query;
  const hasFocusedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnce.current) {
        refetch();
      }
      hasFocusedOnce.current = true;
    }, [refetch]),
  );

  const engagements: Record<string, FeedEngagement> = {};
  query.data?.pages.forEach(page => Object.assign(engagements, page.engagements));

  const items = (query.data?.pages.flatMap(page => page.items) ?? []).filter(item =>
    passesClientSideFilters(item, filters, engagements),
  );

  return { ...query, items, engagements };
}

/** Filters the search endpoint doesn't support, applied client-side instead — same fields, same
 * logic as web's `filteredFeed` pass (`app/dashboard/page.tsx`). `onlyChapters`/`hideRsvpEvents`
 * have no equivalent on web either (per `FilterPanel`'s own doc comment) — left as UI-only
 * toggles, not applied here, until a real backend contract for them exists. */
function passesClientSideFilters(
  item: FeedItem,
  filters: FilterState,
  engagements: Record<string, FeedEngagement>,
): boolean {
  if (filters.hideAnonymous && item.is_anonymous) {
    return false;
  }

  if (filters.onlySaved && !engagements[item.id]?.saved) {
    return false;
  }

  if (filters.postedWithin !== 'all') {
    const cutoff = Date.now() - Number(filters.postedWithin) * 60 * 60 * 1000;
    if (new Date(item.created_at).getTime() < cutoff) {
      return false;
    }
  }

  if (filters.activeOpportunitiesOnly && item.feed_type === 'event') {
    const eventDate = item.item.end_date || item.item.start_date;
    if (eventDate && new Date(eventDate).getTime() < Date.now()) {
      return false;
    }
  }

  return true;
}
