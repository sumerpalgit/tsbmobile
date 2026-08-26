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
