/**
 * My Events — flat event shape returned by `GET /api/event/filter-list` and
 * `GET /api/my-activity/saved-posts` (mapped), matching webSrc's own `EventItem` interface
 * (`webSrc/src/app/dashboard/my-events/page.tsx`) exactly. Deliberately separate from
 * `src/types/home.ts`'s `EventItem`, which is the Home feed's nested-inside-`FeedItem` shape —
 * the two endpoints return genuinely different envelopes, don't conflate them.
 */
export type MyEventItem = {
  id: string;
  title: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  visibility: string | null;
  format: string | null;
  location: string | null;
  event_link: string | null;
  event_description: string | null;
  cover_image: string | null;
  event_type: string | null;
  timezone: string | null;
  rsvp_required: string | null;
  hosted_by: string | null;
  matchmaking_enabled?: boolean;
  audience_roles?: string[];
  feed_id: string | null;
  feed_owner: string | null;
  feed_created_at: string | null;
};

export type MyEventsFilterListResponse = {
  allEvents: MyEventItem[];
  userRsvpEvents: MyEventItem[];
  userCreatedEvents: MyEventItem[];
};

/** `createEvent`/`updateEvent` payload — matches web's `handleAddEvent` body exactly.
 *
 * Does NOT include `event_audience_roles` — an earlier pass added it on the theory that it's a
 * "real field, just not submitted by this particular page" (`EventForm.tsx`'s component does
 * track it in local state), but that was wrong: the live backend's `event` table has no such
 * column at all (`POST /api/feed/event` 500s with "Could not find the 'event_audience_roles'
 * column of 'event' in the schema cache" the instant it's included), and web's real
 * `handleAddEvent` body never sends it either. The wizard's Audience step (role chips) still
 * matches the mockup's UI, but is UI-only for now — selecting roles doesn't do anything
 * server-side until/unless a real API contract for it exists. */
export type EventFormPayload = {
  title: string;
  event_description: string;
  event_type: string;
  format: string;
  visibility: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  event_link: string;
  location: string;
  rsvp_required: string;
  hosted_by: string;
  cover_image: string;
};
