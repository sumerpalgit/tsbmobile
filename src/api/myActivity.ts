import { apiClient } from './client';
import { FEED_ENDPOINTS, MY_ACTIVITY_ENDPOINTS } from './endpoints';
import type { FeedItem } from './feed';

export type ActivityTab = 'liked-posts' | 'commented-posts' | 'my-posts' | 'interacted-posts';

/** One entry in a `my-posts` item's `recent_requesters` — the post owner's incoming NDA/PPM/CIM/
 * job-application/event-RSVP requests, embedded inline on the list item (no separate fetch — same
 * "list already contains detail" pattern `RequestsOverlay` uses on web). Field names are a loose
 * union of what `webSrc/app/dashboard/my-activities/page.tsx`'s own mapping reads off this object
 * (`r.request_id || r.id`, `r.profile_img`, `r.ticket_size ?? r.ticket`, `r.location ?? r.city`,
 * ...) — kept optional/loose rather than a strict type since only that mapping's read-side is
 * confirmed, not the full raw shape. Consumed by Phase 2's `ActivityRequestsScreen`. */
export type RecentRequester = {
  request_id?: string;
  id?: string;
  status?: 'requested' | 'nda_sent' | 'nda_signed' | 'cim_sent' | 'declined' | 'withdrawn' | string;
  name?: string;
  profile_img?: string | null;
  sub_category?: string | null;
  username?: string;
  location?: string | null;
  city?: string | null;
  ticket_size?: string | number;
  ticket?: string | number;
  requester_note?: string;
  created_at?: string;
  requested_at?: string;
  nda_sent_at?: string;
  signed_at?: string;
  declined_at?: string;
  withdrawn_at?: string;
  nda_url?: string;
  document_type?: 'nda' | 'cim' | 'pitch_deck' | 'ppm' | 'job_application' | 'event_rsvp' | string;
  resume_url?: string;
  screening_answers?: string[] | null;
};

/** A `my-posts` item's real, backend-computed request totals — web reads this (`post.request_breakdown`)
 * for both the card's request-count badge and its `RequestsStatusBar`, and only falls back to
 * counting `recent_requesters` when this is absent. `recent_requesters` itself is a preview list
 * (not guaranteed to hold every requester), so deriving counts by filtering it — as this app
 * previously did — silently undercounts once a post has more requesters than that preview holds.
 * `newRequestCount` on the status bar uses `pending` too (confirmed in `page.tsx`), not a separate
 * field. */
export type RequestBreakdown = {
  total?: number;
  pending?: number;
  nda_sent?: number;
  declined?: number;
};

/** An `interacted-posts` item's own request/application/RSVP detail — matches `SentRequestOverlay`/
 * `JobApplicationOverlay`/`EventRsvpOverlay`'s data source on web (`feedItem.interaction_details`),
 * consumed by Phase 3's screens. */
export type InteractionDetails = {
  requestId?: string;
  status?: string;
  document_type?: 'nda' | 'cim' | 'pitch_deck' | 'ppm' | string;
  requester_note?: string;
  nda_sent_at?: string;
  signed_at?: string;
  declined_at?: string;
  withdrawn_at?: string;
  nda_url?: string;
  ppm_url?: string;
  signed_nda_url?: string;
  cim_sent_at?: string;
  cim_url?: string;
  rsvp_response?: string;
};

/** Extends the plain feed-post envelope with My Activity's own per-item extras — matches
 * `webSrc/app/dashboard/my-activities/page.tsx`'s read-side exactly: `interaction_type`/
 * `interaction_details` (interacted-posts), `recent_requesters` (my-posts), `is_published`
 * (my-posts' live/draft status pill), `interaction_date` (liked-posts' "liked at" timestamp,
 * falls back to `created_at` if absent — same fallback web uses). */
export type MyActivityFeedItem = FeedItem & {
  interaction_type?: 'job_application' | 'event_rsvp' | 'nda_request' | 'ppm_request' | string;
  interaction_details?: InteractionDetails;
  recent_requesters?: RecentRequester[];
  request_breakdown?: RequestBreakdown;
  is_published?: boolean;
  interaction_date?: string;
};

export type MyActivityPage = {
  items: MyActivityFeedItem[];
  hasNextPage: boolean;
};

const TAB_ENDPOINTS: Record<ActivityTab, string> = {
  'liked-posts': MY_ACTIVITY_ENDPOINTS.LIKED_POSTS,
  'commented-posts': MY_ACTIVITY_ENDPOINTS.COMMENTED_POSTS,
  'my-posts': MY_ACTIVITY_ENDPOINTS.MY_POSTS,
  'interacted-posts': MY_ACTIVITY_ENDPOINTS.INTERACTED_POSTS,
};

/** `GET /my-activity/{tab}?page=&limit=` — matches `webSrc/actions/my-activity.ts`'s
 * `fetchMyActivityTabData`. Unlike `/feed`/`/feed/search`, this does NOT return `engagements`
 * inline — `src/api/engagement.ts`'s `fetchEngagements`/`fetchInteractionCounts` batch calls fill
 * that gap (see `useMyActivity.ts`). */
export async function fetchMyActivityTab(tab: ActivityTab, page: number, limit: number): Promise<MyActivityPage> {
  const result = await apiClient.get(TAB_ENDPOINTS[tab], { params: { page, limit } }).then(res => res.data);
  const items = Array.isArray(result?.data) ? result.data : [];
  return { items, hasNextPage: result?.pagination?.hasNextPage ?? items.length === limit };
}

export type MyActivityCounts = { liked: number; commented: number; received: number; sent: number };

/** `GET /my-activity/counts` — matches `fetchMyActivityCounts`. Feeds both the tab-row count
 * badges and `ActivityHeroStats`' non-`tabStats` fallback values. */
export async function fetchMyActivityCounts(): Promise<MyActivityCounts> {
  const result = await apiClient.get(MY_ACTIVITY_ENDPOINTS.COUNTS).then(res => res.data);
  return {
    liked: result?.liked ?? 0,
    commented: result?.commented ?? 0,
    received: result?.received ?? 0,
    sent: result?.sent ?? 0,
  };
}

/** Exact shape confirmed from `webSrc/app/dashboard/components/activity/ActivityHeroStats.tsx`'s
 * own `TabStats` type — reused verbatim so `getTiles()`'s port needs no field renaming. */
export type ActivityTabStats = {
  liked: { total: number; thisMonth: number };
  commented: { total: number; thisMonth: number };
  sent: { total: number; awaiting: number; ndaReceived: number; signed: number; declined: number; thisMonth: number };
  received: { total: number; pending: number; sent: number; signed: number; declined: number; applied?: number; thisMonth: number };
};

/** `GET /feed/my-activity/tab-stats` — matches `fetchActivityTabStats`. Powers
 * `ActivityHeroStats`' real (non-hardcoded-zero) tile values. */
export async function fetchActivityTabStats(): Promise<ActivityTabStats | null> {
  const result = await apiClient.get(FEED_ENDPOINTS.MY_ACTIVITY_TAB_STATS).then(res => res.data);
  return result ?? null;
}
