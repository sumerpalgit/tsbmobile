/** Matches webSrc's `Group` (`my-eta-chapters/page.tsx`) — the dashboard's chapter shape,
 * distinct from `api/eta.ts`'s onboarding-only `EtaChapter` (different endpoints, different
 * field names: `groupImageUrl` there is camelCase-normalized, this one stays close to the raw
 * `GET /eta/my-eta-chapters` response so card components can read `city`/`countryCode` the same
 * way web's `MyChapterCard`/`AllChapterCard` do). */
export type EtaGroup = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  groupImageUrl: string | null;
  isMember?: boolean;
  memberCount?: number;
  eventCount?: number;
  countryCode?: string | null;
  city?: string | null;
};

export type ChapterPagination = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasMore: boolean;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type MyEtaChaptersPage = {
  myChapters?: EtaGroup[];
  chapters: EtaGroup[];
  pagination: ChapterPagination | null;
  joinedCountryCodes?: string[];
};

/** `POST /eta/groups/:id/join`'s alternate response when the 30-day rejoin cooldown (after a
 * prior leave) is still active — the join doesn't take effect immediately. */
export type JoinGroupResponse = {
  status?: 'pending_rejoin';
  accepted_at?: string | null;
  message?: string;
};

/** Matches the raw `GET /eta/chapter-events` response shape web reads directly
 * (`{id, title, event_description, location, cover_image, start_date, eta_chapter_id}`) — an
 * unprocessed list endpoint, so `startDate` is a real ISO timestamp (unlike My Events'
 * `EventItem.date`, which web pre-formats client-side into "dd MMM yyyy" text before it's ever
 * stored in that type). */
export type ChapterEvent = {
  id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  coverImage: string | null;
  startDate: string | null;
  etaChapterId: string | null;
};

/** Matches webSrc's `ChapterNotifPrefs` (`actions/my-eta-chapter.ts`) verbatim. */
export type ChapterNotifPrefs = {
  pinned: boolean;
  mute_all: boolean;
  notify_messages: boolean;
  notify_mentions: boolean;
  notify_events: boolean;
  notify_new_members: boolean;
  email_digest: boolean;
};

/** Matches the `Ad` fields `ETABanner.tsx` actually reads (headline/body/cta exist on web's
 * fuller ad-management type but are unused by the member-facing banner itself — not ported). */
export type ChapterAd = {
  id: string;
  brandName: string;
  campaignName?: string | null;
  bannerUrl: string;
  clickDestinationType: string;
  clickDestinationUrl: string;
};
