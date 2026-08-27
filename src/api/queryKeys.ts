export const ME_QUERY_KEY = ['me'] as const;
export const PROFILE_COMPLETION_QUERY_KEY = ['profileCompletion'] as const;
export const HOME_FEED_QUERY_KEY = ['homeFeed'] as const;
/** Keyed by username since View Profile's Posts tab (and any future "view someone's posts" use)
 * needs a distinct cache entry per profile, unlike `HOME_FEED_QUERY_KEY`'s single global feed. */
export const USER_FEED_QUERY_KEY = ['userFeed'] as const;
export const MY_EVENTS_QUERY_KEY = ['myEvents'] as const;
export const SAVED_EVENTS_QUERY_KEY = ['savedEvents'] as const;
export const AI_CONVERSATIONS_QUERY_KEY = ['aiConversations'] as const;
export const CONVERSATIONS_QUERY_KEY = ['conversations'] as const;
/** Keyed further by tab at the call site (`[...MY_ACTIVITY_QUERY_KEY, activeTab]`), same pattern
 * as `USER_FEED_QUERY_KEY`'s per-username keying — each of My Activity's 4 tabs paginates
 * independently. */
export const MY_ACTIVITY_QUERY_KEY = ['myActivity'] as const;
/** Counts + hero stats — fetched once per screen mount, not per tab (matches web: these don't
 * refetch on tab switch, see `useMyActivity.ts`'s doc comment). */
export const MY_ACTIVITY_STATS_QUERY_KEY = ['myActivityStats'] as const;
/** Keyed further by search term at the call site (`[...NOTIFICATIONS_QUERY_KEY, search]`), same
 * per-parameter keying convention as `USER_FEED_QUERY_KEY`/`MY_ACTIVITY_QUERY_KEY` above — a new
 * search term is a genuinely different paginated list, not a client-side filter over one cache. */
export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;
/** Polled every 60s (matches web's `DashboardNavbar`) — shared by the Notifications screen itself
 * and every `TopBar` bell badge, so they all read the one cached value instead of each polling
 * independently. */
export const NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY = ['notificationsUnreadCount'] as const;
export const NOTIFICATIONS_MATCH_COUNTS_QUERY_KEY = ['notificationsMatchCounts'] as const;
/** Keyed further by feed id at the call site (`[...FEED_ITEM_DETAIL_QUERY_KEY, feedId]`, and again
 * with a trailing `'related'` for the same-type related-posts query) — Feed Post Detail's own
 * cache entry, separate from `HOME_FEED_QUERY_KEY`'s list pages since a single-item fetch isn't a
 * page of that list. `useFeedActions.ts`'s `invalidateFeed()` invalidates this broad prefix too,
 * so a like/comment/etc. made from this screen refreshes it the same way Home/My Activity do. */
export const FEED_ITEM_DETAIL_QUERY_KEY = ['feedItemDetail'] as const;
