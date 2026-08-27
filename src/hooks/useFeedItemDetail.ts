import { useQuery } from '@tanstack/react-query';
import { fetchFeed, fetchFeedItemById } from '../api/feed';
import { fetchEngagements } from '../api/engagement';
import { FEED_ITEM_DETAIL_QUERY_KEY } from '../api/queryKeys';
import type { FeedEngagement, FeedItem } from '../api/feed';

/** Matches web's `fetchFeedList`'s own `limit=20` (`app/dashboard/feed/[feedId]/page.tsx`). */
const RELATED_PAGE_LIMIT = 20;

/**
 * Powers the Feed Post Detail screen — matches web's `SingleFeedPage` exactly: fetch the tapped
 * item plus its engagement (a separate call — `fetchFeedItemById`'s endpoint doesn't bundle it the
 * way the list endpoints do), then a page of the general feed filtered client-side down to the
 * same `feed_type` for the "more like this" section (web's own `loadRelatedFeeds` — there's no
 * dedicated "related posts" endpoint on either side). The related query only runs once the main
 * item has loaded, since it needs to know that item's `feed_type` to filter by.
 */
export function useFeedItemDetail(feedId: string) {
  const detail = useQuery({
    queryKey: [...FEED_ITEM_DETAIL_QUERY_KEY, feedId],
    queryFn: async () => {
      const item = await fetchFeedItemById(feedId);
      const engagements = await fetchEngagements([item.id]);
      return { item, engagement: engagements[item.id] as FeedEngagement | undefined };
    },
    enabled: !!feedId,
  });

  const related = useQuery({
    queryKey: [...FEED_ITEM_DETAIL_QUERY_KEY, feedId, 'related'],
    queryFn: async () => {
      const feedType = detail.data!.item.feed_type;
      const page = await fetchFeed(1, RELATED_PAGE_LIMIT);
      const items = page.items.filter((entry: FeedItem) => entry.feed_type === feedType && entry.id !== feedId);
      return { items, engagements: page.engagements };
    },
    enabled: !!detail.data,
  });

  return {
    item: detail.data?.item,
    engagement: detail.data?.engagement,
    isLoading: detail.isLoading,
    isError: detail.isError,
    relatedItems: related.data?.items ?? [],
    relatedEngagements: related.data?.engagements ?? {},
  };
}
