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
