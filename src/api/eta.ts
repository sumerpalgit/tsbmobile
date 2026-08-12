import { apiClient } from './client';
import { ADS_ENDPOINTS, ETA_ENDPOINTS, PROFILE_ENDPOINTS } from './endpoints';
import type {
  ChapterAd,
  ChapterEvent,
  ChapterNotifPrefs,
  ChapterPagination,
  EtaGroup,
  JoinGroupResponse,
  MyEtaChaptersPage,
} from '../types/etaChapters';
import type { Message, PaginationInfo } from '../types/messages';

export type EtaChapter = {
  id: string;
  name: string;
  description: string;
  groupImageUrl: string;
  location: string | null;
  memberCount: number;
};

function normalizeChapter(item: unknown): EtaChapter {
  const record = item as Record<string, unknown>;
  return {
    id: String(record?.id ?? ''),
    name: String(record?.name ?? ''),
    description: String(record?.description ?? ''),
    groupImageUrl: String(record?.group_image_url ?? record?.groupImageUrl ?? ''),
    location: (record?.location as string | null) ?? null,
    memberCount: Number(record?.memberCount ?? record?.member_count ?? 0),
  };
}

export type EtaChapterSuggestions = {
  suggested: EtaChapter[];
  others: EtaChapter[];
};

/** Matches webSrc's `join-eta-chapter` fetch flow: try the location/profile-scoped suggestions
 * endpoint first (requires auth + coordinates in profile), fall back to the flat all-chapters
 * list — sliced 8/rest, same as web — if that fails. */
export async function getSuggestedEtaChapters(): Promise<EtaChapterSuggestions> {
  try {
    const data = await apiClient.get(ETA_ENDPOINTS.SUGGESTIONS).then(res => res.data);
    return {
      suggested: (data?.suggested ?? []).map(normalizeChapter),
      others: (data?.others ?? []).map(normalizeChapter),
    };
  } catch {
    const all: EtaChapter[] = await apiClient
      .get(ETA_ENDPOINTS.ALL)
      .then(res => (res.data ?? []).map(normalizeChapter));
    return { suggested: all.slice(0, 8), others: all.slice(8) };
  }
}

export async function searchEtaChapters(query: string): Promise<EtaChapter[]> {
  const data = await apiClient
    .get(ETA_ENDPOINTS.SEARCH, { params: { query } })
    .then(res => res.data);
  return Array.isArray(data) ? data.map(normalizeChapter) : [];
}

/** `GET /eta/chapters?q=` (real web: `GET /api/eta/chapters?q=`) — matches web's real
 * `fetchEtaChaptersForAds()` exactly, a distinct
 * endpoint from `searchEtaChapters` above (used by the ad-campaign chapter picker specifically,
 * not the onboarding chapter-suggestions search). `q` is only sent when non-empty, matching web's
 * own conditional param. Reuses `normalizeChapter` — the response is a subset of the same shape
 * (`{id, name, group_image_url?}`), so the extra fields just come back empty/zero. */
export async function fetchEtaChaptersForAds(query: string): Promise<EtaChapter[]> {
  const q = query.trim();
  const data = await apiClient
    .get(ETA_ENDPOINTS.FOR_ADS, { params: q ? { q } : {} })
    .then(res => res.data);
  const rows = Array.isArray(data) ? data : (data?.chapters ?? []);
  return rows.map(normalizeChapter);
}

export type BatchJoinResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  joinedChapters?: string[];
  pendingChapters?: { chapterId: string; accepted_at: string | null }[];
  failedChapters?: { chapterId: string; error: string }[];
};

/** Matches webSrc's `POST /api/eta/groups/batch-join` — the actual "join" action, called once
 * on Step 2's Continue (max 3 chapter IDs, enforced by `MAX_ETA_CHAPTERS`). */
export function batchJoinEtaChapters(chapterIds: string[]) {
  return apiClient
    .post<BatchJoinResponse>(ETA_ENDPOINTS.BATCH_JOIN, { chapterIds })
    .then(res => res.data);
}

// ─── My ETA Chapters dashboard ──────────────────────────────────────────────
// Distinct endpoint set from the onboarding functions above — same file per the ETA Chapters
// build plan (one cohesive `eta` domain instead of fragmenting across `api/eta.ts` +
// `api/etaChapters.ts`).

function normalizeGroup(item: unknown): EtaGroup {
  const record = item as Record<string, unknown>;
  return {
    id: String(record?.id ?? ''),
    name: String(record?.name ?? ''),
    description: String(record?.description ?? ''),
    createdAt: String(record?.created_at ?? ''),
    groupImageUrl: (record?.group_image_url as string | null) ?? null,
    isMember: record?.isMember as boolean | undefined,
    memberCount: Number(record?.memberCount ?? 0),
    eventCount: Number(record?.eventCount ?? 0),
    countryCode: (record?.country_code as string | null) ?? null,
    city: (record?.city as string | null) ?? null,
  };
}

function normalizePagination(raw: unknown): ChapterPagination | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  return {
    currentPage: Number(record.currentPage ?? 1),
    totalPages: Number(record.totalPages ?? 1),
    totalCount: Number(record.totalCount ?? 0),
    limit: Number(record.limit ?? 0),
    hasMore: Boolean(record.hasMore),
    hasNextPage: Boolean(record.hasNextPage),
    hasPrevPage: Boolean(record.hasPrevPage),
  };
}

/** Matches webSrc's `fetchChapters`/`fetchMyEtaChapters` (`my-eta-chapters/page.tsx:495-524`):
 * `GET /eta/my-eta-chapters` with `page/limit/tab` plus the caching optimization — once the
 * caller already has `joinedCountryCodes`/`myGroups` cached (i.e. every fetch after the very
 * first per tab), pass `countries`/`memberIds` + `skipMyChapters:true` so the backend skips
 * re-querying membership. `limit` defaults to 12, matching web's grid page size. */
export async function fetchMyEtaChapters(params: {
  page: number;
  limit?: number;
  tab: 'local' | 'international';
  countries?: string;
  memberIds?: string;
  skipMyChapters?: boolean;
}): Promise<MyEtaChaptersPage> {
  const query: Record<string, string> = {
    page: String(params.page),
    limit: String(params.limit ?? 12),
    tab: params.tab,
  };
  if (params.countries) query.countries = params.countries;
  if (params.memberIds) query.memberIds = params.memberIds;
  if (params.skipMyChapters) query.skipMyChapters = 'true';

  const data = await apiClient
    .get(ETA_ENDPOINTS.MY_CHAPTERS, { params: query })
    .then(res => res.data);

  return {
    myChapters: Array.isArray(data?.myChapters) ? data.myChapters.map(normalizeGroup) : undefined,
    chapters: Array.isArray(data?.chapters) ? data.chapters.map(normalizeGroup) : [],
    pagination: normalizePagination(data?.pagination),
    joinedCountryCodes: Array.isArray(data?.joinedCountryCodes) ? data.joinedCountryCodes : undefined,
  };
}

/** `POST /eta/groups/:id/join` — normal success, or `{status:"pending_rejoin", accepted_at}`
 * when the caller is inside the 30-day rejoin cooldown from a prior leave (matches web's
 * `confirmJoinGroup`). */
export function joinEtaGroup(groupId: string): Promise<JoinGroupResponse> {
  return apiClient.post(`${ETA_ENDPOINTS.GROUPS}/${groupId}/join`).then(res => res.data ?? {});
}

/** `DELETE /eta/groups/:id/leave` — matches web's `handleLeaveGroup`. Starts a 30-day rejoin
 * cooldown on the backend for this specific chapter. */
export function leaveEtaGroup(groupId: string) {
  return apiClient.delete(`${ETA_ENDPOINTS.GROUPS}/${groupId}/leave`).then(res => res.data);
}

/** `GET /eta/chapter-events?chapterIds=...` — matches web's `fetchChapterEvents`, used to
 * populate the "Next meetup" card per chapter and the events panel. */
export async function fetchChapterEvents(chapterIds?: string[]): Promise<ChapterEvent[]> {
  const params = chapterIds?.length ? { chapterIds: chapterIds.join(',') } : undefined;
  const data = await apiClient.get(ETA_ENDPOINTS.CHAPTER_EVENTS, { params }).then(res => res.data);
  const rows = Array.isArray(data) ? data : [];
  return rows.map((e: any) => ({
    id: String(e?.id ?? ''),
    title: e?.title ?? null,
    description: e?.event_description ?? null,
    location: e?.location ?? null,
    coverImage: e?.cover_image ?? null,
    startDate: e?.start_date ?? null,
    etaChapterId: e?.eta_chapter_id ?? null,
  }));
}

/** `POST /eta/request-city` — the "Create a new ETA chapter" / "Suggest a chapter" flow.
 * Matches web's `requestEtaCity`. Response is just an ack (`{message?, error?}`) — the mobile
 * "REF #" shown after submitting is client-generated, same as web's, not returned by this call. */
export function requestEtaCity(
  city: string,
  country: string,
  chapterName: string,
  reason: string,
  connection: string,
): Promise<{ message?: string; error?: string }> {
  return apiClient
    .post(ETA_ENDPOINTS.REQUEST_CITY, { city, country, chapterName, reason, connection })
    .then(res => res.data ?? {});
}

// ─── Chapter chat ────────────────────────────────────────────────────────────
// Reuses `Message`/`PaginationInfo` from `types/messages.ts` verbatim — group-chat messages are
// plain text only (no `MessageContent` image/file/shared_feed union, no `reply_to` sent by
// `sendEtaGroupMessage`), so the DM `Message` shape already fits exactly, same field names web
// itself uses for both (`{id, message, created_at, isSenderMe, sender:{name,username?,profile_img?}}`).

export type ChapterMessagesPage = {
  messages: Message[];
  pagination: PaginationInfo | null;
};

/** Matches web's `fetchMessages` (chapter chat): `GET /eta/groups/:id/messages?page=&limit=` —
 * server returns newest-first, reversed here into chronological order, same as DM chat. */
export async function fetchEtaGroupMessages(groupId: string, page = 1, limit = 50): Promise<ChapterMessagesPage> {
  const data = await apiClient
    .get(`${ETA_ENDPOINTS.GROUPS}/${groupId}/messages`, { params: { page, limit } })
    .then(res => res.data);
  const rows = Array.isArray(data) ? data : data?.messages || [];
  const messages: Message[] = rows
    .map((m: any) => ({
      id: m.id,
      message: m.message,
      created_at: m.created_at,
      isSenderMe: m.isSenderMe,
      sender: { name: m.sender?.name || 'Unknown', username: m.sender?.username, profile_img: m.sender?.profile_img },
    }))
    .reverse();
  return { messages, pagination: data?.pagination ?? null };
}

/** `POST /eta/groups/:id/messages` body `{message}` — matches web's `sendEtaGroupMessage`
 * exactly (text-only, no file/image variant exists for chapter chat). */
export function sendEtaGroupMessage(groupId: string, message: string): Promise<{ id: string; created_at: string }> {
  return apiClient.post(`${ETA_ENDPOINTS.GROUPS}/${groupId}/messages`, { message }).then(res => res.data);
}

/** `GET /eta/groups/:id/messages/search?q=` — matches web's `searchGroupMessages`. */
export async function searchGroupMessages(groupId: string, query: string): Promise<Message[]> {
  const data = await apiClient
    .get(`${ETA_ENDPOINTS.GROUPS}/${groupId}/messages/search`, { params: { q: query } })
    .then(res => res.data);
  const rows = Array.isArray(data?.messages) ? data.messages : [];
  return rows.map((m: any) => ({
    id: m.id,
    message: m.message,
    created_at: m.created_at,
    isSenderMe: m.isSenderMe,
    sender: { name: m.sender?.name || 'Unknown', username: m.sender?.username, profile_img: m.sender?.profile_img },
  }));
}

/** `GET /eta/groups/:id/members/count` — matches web's `fetchEtaGroupMemberCount`, used for the
 * chat header's live member count (can be more current than the cached `EtaGroup.memberCount`). */
export async function fetchEtaGroupMemberCount(groupId: string): Promise<number> {
  const data = await apiClient.get(`${ETA_ENDPOINTS.GROUPS}/${groupId}/members/count`).then(res => res.data);
  return Number(data?.count ?? 0);
}


// ─── Per-chapter notification preferences ───────────────────────────────────

export async function fetchChapterPrefs(groupId: string): Promise<ChapterNotifPrefs> {
  const data = await apiClient.get(`${ETA_ENDPOINTS.GROUPS}/${groupId}/prefs`).then(res => res.data);
  return data?.prefs;
}

export async function updateChapterPrefs(groupId: string, prefs: Partial<ChapterNotifPrefs>): Promise<ChapterNotifPrefs> {
  const data = await apiClient.patch(`${ETA_ENDPOINTS.GROUPS}/${groupId}/prefs`, prefs).then(res => res.data);
  return data?.prefs;
}

/** `GET /eta/groups/prefs/bulk` — seeds the pinned-state used to sort "My chapters" in the chat
 * list, pinned-first, matching web. */
export async function fetchBulkChapterPrefs(): Promise<{ groupId: string; pinned: boolean; muteAll: boolean }[]> {
  const data = await apiClient.get(ETA_ENDPOINTS.GROUP_PREFS_BULK).then(res => res.data);
  const rows = Array.isArray(data?.prefs) ? data.prefs : [];
  return rows.map((p: any) => ({ groupId: String(p?.group_id ?? ''), pinned: Boolean(p?.pinned), muteAll: Boolean(p?.mute_all) }));
}

// ─── Invites ─────────────────────────────────────────────────────────────────

export function inviteByEmail(emails: string[], role: string, message: string, chapterId: string) {
  return apiClient
    .post<{ sent?: number; message?: string }>(ETA_ENDPOINTS.INVITE_BY_EMAIL, { emails, role, message, chapterId })
    .then(res => res.data);
}

export function inviteEtaChapterUser(username: string, chapterId: string) {
  return apiClient.post(ETA_ENDPOINTS.INVITE_USER, { username, chapterId }).then(res => res.data);
}

export type InviteCandidate = {
  id?: string;
  username: string;
  name: string;
  profileImg?: string | null;
  roleType?: string | null;
  subCategory?: string | null;
};

/** `GET /profile/search` — matches web's `searchEtaInviteCandidates`, a generic (not
 * chapter-scoped) profile search; the caller filters out existing members client-side, same as web. */
export async function searchEtaInviteCandidates(query: string, page = 1, limit = 20): Promise<InviteCandidate[]> {
  const data = await apiClient
    .get(PROFILE_ENDPOINTS.SEARCH, { params: { query, page, limit } })
    .then(res => res.data);
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map((u: any) => ({
    id: u?.id,
    username: String(u?.username ?? ''),
    name: String(u?.name ?? ''),
    profileImg: u?.profile_img ?? null,
    roleType: u?.role_type ?? null,
    subCategory: u?.sub_category ?? null,
  }));
}

// ─── Ads (chapter chat's sponsored banner + campaign creation) ──────────────

/** `GET /ads/eta/:chapterId` — matches `ETABanner.tsx`'s real ad fetch. Filters to ads with a
 * `brand_name` (web's own validity check) — only the fields the member-facing banner actually
 * renders are kept (see `ChapterAd`'s doc comment). */
export async function fetchAdsForChapter(chapterId: string): Promise<ChapterAd[]> {
  const data = await apiClient.get(`${ADS_ENDPOINTS.ETA}/${chapterId}`).then(res => res.data);
  const rows = Array.isArray(data?.ads) ? data.ads : [];
  return rows
    .filter((a: any) => !!a?.brand_name)
    .map((a: any) => ({
      id: String(a.id),
      brandName: String(a.brand_name),
      campaignName: a.campaign_name ?? null,
      bannerUrl: String(a.ad_banner_url ?? ''),
      clickDestinationType: String(a.click_destination_type ?? 'url'),
      clickDestinationUrl: String(a.click_destination_url ?? ''),
    }));
}

export type CreateAdCampaignPayload = {
  brand_name: string;
  advertiser_type: string;
  primary_contact_email: string;
  campaign_name: string;
  home_placement: boolean;
  ad_banner_url: string;
  click_destination_type: 'url' | 'calendar' | 'mailto' | 'custom';
  click_destination_url: string;
  campaign_start_date: string;
  campaign_duration_weeks: number;
  payment_completed: true;
  eta_chapter_ids: string[];
  tier: 'standard' | 'premium';
  ad_headline: string;
  ad_body_text: string;
  ad_cta_text: string;
  target_audience: string[];
  target_geography: string[];
};

/** `POST /ads/create-ad` — matches web's `handleSubmit` payload exactly, including the lossy
 * `campaign_duration_weeks = Math.max(1, Math.round(actualDays/7))` conversion (computed by the
 * caller before this is invoked) and the hardcoded `payment_completed: true` (no real payment
 * collection anywhere in this flow — confirmed by a full read of web's `ad-management.ts`, see
 * the ETA Chapters plan's ad-campaign research). */
export function createAdCampaign(payload: CreateAdCampaignPayload): Promise<{ message?: string }> {
  console.log('[createAdCampaign] POST', `${apiClient.defaults.baseURL}${ADS_ENDPOINTS.CREATE}`, JSON.stringify(payload, null, 2));
  return apiClient.post(ADS_ENDPOINTS.CREATE, payload).then(res => res.data ?? {});
}
