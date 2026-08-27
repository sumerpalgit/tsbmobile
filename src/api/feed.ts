import { apiClient } from './client';
import { FEED_ENDPOINTS } from './endpoints';
import type { FeedItemData } from '../types/home';

/** Matches the live `GET /api/feed` response's `profile` object exactly — anonymous posts
 * return it with every field but `name`/`username` nulled out (`{name: "Anonymous", username:
 * "anonymous", profile_img: null, ...}`), so most fields are nullable rather than optional. */
export type FeedProfile = {
  name: string;
  username: string;
  profile_img: string | null;
  sub_category: string | null;
  role_type: string | null;
  city?: string | null;
  organization?: string | null;
};

/** The envelope every feed item shares, intersected with `FeedItemData` — the discriminated
 * union (`src/types/home.ts`) that narrows `item`'s shape by `feed_type`. Matches the live
 * response exactly: `{id, feed_type, item_id, created_at, is_anonymous, profile, item,
 * is_my_feed}`. */
export type FeedItem = {
  id: string;
  item_id: string;
  created_at: string;
  is_anonymous: boolean;
  is_my_feed: boolean;
  profile: FeedProfile;
} & FeedItemData;

/** Matches webSrc's `FEED_LIMIT` (`app/dashboard/page.tsx`). */
export const FEED_PAGE_LIMIT = 10;

export type FeedComment = {
  id: string;
  feed_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  is_ai: boolean;
  profile: FeedProfile;
};

/** One entry per feed item ID, keyed the same way in the live response. `PostCardStats`/
 * `PostCardActions` read straight off this — `count`/`liked`/`saved` render immediately, no
 * separate round-trip needed (matches webSrc's `Engagement` type, `FeedCard.tsx`). */
export type FeedEngagement = {
  comments: FeedComment[];
  likes: { count: number; liked: boolean };
  saved: boolean;
  isPlayed: boolean;
};

export type FeedPage = {
  items: FeedItem[];
  hasNextPage: boolean;
  engagements: Record<string, FeedEngagement>;
};

function parseFeedResponse(result: any, limit: number): FeedPage {
  const items = Array.isArray(result?.data) ? result.data : [];
  return {
    items,
    hasNextPage: result?.pagination?.hasNextPage ?? items.length === limit,
    engagements: result?.engagements ?? {},
  };
}

/** Matches webSrc's `fetchDashboardFeed` (`actions/home.ts`): `GET /api/feed?page=&limit=` →
 * `{ data: FeedItem[], pagination: { hasNextPage }, engagements? }`. Powers the Home feed's main
 * (unfiltered) list — `searchFeed` below is the filtered/searched counterpart. */
export async function fetchFeed(page: number, limit: number): Promise<FeedPage> {
  const result = await apiClient
    .get(FEED_ENDPOINTS.LIST, { params: { page, limit } })
    .then(res => res.data);

  return parseFeedResponse(result, limit);
}

/** Matches webSrc's `fetchUserFeed` (`actions/my-profile.ts`): `GET /api/feed/user/:username?
 * page=&limit=`, same envelope shape as `fetchFeed`. Powers View Profile's Posts tab (Phase 3) —
 * web's own "search posts" box on this tab filters client-side over the already-fetched page, not
 * a query param this endpoint accepts, so no search param is sent here either. */
export async function fetchUserFeed(username: string, page: number, limit: number): Promise<FeedPage> {
  const result = await apiClient
    .get(`${FEED_ENDPOINTS.USER}/${username}`, { params: { page, limit } })
    .then(res => res.data);

  return parseFeedResponse(result, limit);
}

/** `GET /feed/single/:feedId` → `{data: FeedData}` — matches web's `SingleFeedPage`'s own fetch
 * (`app/dashboard/feed/[feedId]/page.tsx`). Same item shape as a list entry (`FeedItem`), just
 * fetched individually; unlike `fetchFeed`/`searchFeed`, this endpoint doesn't bundle engagement
 * data, so callers pair it with `fetchEngagements` (`api/engagement.ts`) separately, matching
 * web's own two-call pattern. Powers the Feed Post Detail screen (Phase 3 of the Notifications
 * plan) via `useFeedItemDetail`. */
export async function fetchFeedItemById(feedId: string): Promise<FeedItem> {
  const result = await apiClient.get(`${FEED_ENDPOINTS.SINGLE}/${feedId}`).then(res => res.data);
  return result?.data;
}

/** Matches `webSrc/hooks/useFeedActions.ts`'s `deleteFeedItem` — `DELETE /feed/delete/:feedId`.
 * Powers the Posts tab's own-post 3-dot menu (View Profile only shows this for the signed-in
 * user's own posts, so no ownership check is needed client-side). */
export function deleteFeedItem(feedId: string) {
  return apiClient.delete(`${FEED_ENDPOINTS.DELETE}/${feedId}`).then(res => res.data);
}

/** Matches `MiniCardMenu.tsx`'s `submitReport` — `POST /feed/report/:feedId`, body `{ reason }`. */
export function reportFeedItem(feedId: string, reason: string) {
  return apiClient.post(`${FEED_ENDPOINTS.REPORT}/${feedId}`, { reason }).then(res => res.data);
}

/** Matches `MiniCardMenu.tsx`'s "Hide this post" — `POST /feed/hide/:feedId`, fire-and-forget. */
export function hideFeedItem(feedId: string) {
  return apiClient.post(`${FEED_ENDPOINTS.HIDE}/${feedId}`).then(res => res.data);
}

/** `FilterPanel`'s `postTypes` values (`ask`, `investor`, ...) → backend `feed_type` strings —
 * mirrors webSrc's own `FEED_TYPE_MAP` (`app/dashboard/page.tsx`), just named for our UI's value
 * set instead of web's label set. */
const POST_TYPE_TO_FEED_TYPE: Record<string, string> = {
  ask: 'atc',
  investor: 'investor_corner',
  capital: 'search_capital',
  deal: 'deal',
  match: 'find_a_connection',
  job: 'job',
  event: 'event',
  poll: 'poll',
};

export type FeedSearchParams = {
  query?: string;
  postTypes?: string[];
  postedBy?: string[];
  topics?: string[];
};

/** Matches webSrc's `searchFeed` (`app/dashboard/page.tsx`): `GET /api/feed/search?...`. Only
 * sends params the backend actually supports for search — `postedWithin`/`onlySaved`/
 * `hideAnonymous`/`activeOpportunitiesOnly` aren't sent because web's own version doesn't send
 * them either ("Filters applied client-side... are NOT sent to the backend because the search
 * endpoint doesn't support them", web's own comment) — `useHomeFeed` applies those client-side
 * instead, same as web's `filteredFeed` pass. */
export async function searchFeed(page: number, limit: number, params: FeedSearchParams): Promise<FeedPage> {
  const query: Record<string, string> = { page: String(page), limit: String(limit) };

  if (params.query?.trim()) {
    query.query = params.query.trim();
  }
  if (params.postTypes?.length) {
    const feedTypes = params.postTypes.map(t => POST_TYPE_TO_FEED_TYPE[t]).filter(Boolean);
    if (feedTypes.length) {
      query.feed_type = feedTypes.join(',');
    }
  }
  if (params.postedBy?.length) {
    query.posted_by = params.postedBy.join(',');
  }
  if (params.topics?.length) {
    query.middle = params.topics.join(',');
  }

  const result = await apiClient.get(FEED_ENDPOINTS.SEARCH, { params: query }).then(res => res.data);
  return parseFeedResponse(result, limit);
}
