import { apiClient } from './client';
import { AI_ENDPOINTS, MATCHMAKING_ENDPOINTS, MATCH_SETTINGS_ENDPOINTS } from './endpoints';

/**
 * My Matches — mirrors `webSrc/actions/my-matches.ts` (232 LOC, 19 wrappers).
 *
 * Three things about this feature that shape everything below:
 *
 * 1. **No pagination exists anywhere in it.** Not a single `page`/`limit`/`offset`/`cursor` param
 *    in web's actions or either of its two pages — every list endpoint returns the full
 *    collection. So these are plain fetchers and the hooks are plain `useQuery`, unlike
 *    `myActivity.ts`/`notifications.ts` which are genuinely paginated.
 *
 * 2. **All filtering, sorting and thresholding is client-side on web** — a hard 30% match floor
 *    (`page.tsx:250,276`), a second 51% floor on one list (`page.tsx:221`), fixed
 *    `match_percentage` DESC sort, and dedup by `feed.id`. None of that is applied here: this
 *    module returns what the backend returns, and any future UI decides what to hide.
 *
 * 3. **Web types every list item as `any[]`.** The types below were derived by reading every
 *    property access across web's 4,521 LOC of page code, so they describe what web *consumes*,
 *    not a contract the backend has published. Fields are optional where web guards them.
 *
 * Five endpoints web calls as part of this feature already live elsewhere in this app and are
 * deliberately NOT duplicated here:
 *   - `POST /chat/conversations` → `startConversation()` in `api/messages.ts`
 *   - `POST /chat/conversations/:id/messages` → `sendMessage()` in `api/messages.ts`
 *     (note: web's own call here sends **no** `Authorization` header and never checks the
 *     response — `page.tsx:1562`. Mobile's goes through `apiClient`. Don't copy web.)
 *   - `PUT /feed/nda/sign` → `submitSignedNda()` in `api/requests.ts`
 *   - `PUT /feed/cim/send` → `submitSendCim()` in `api/requests.ts`
 *   - `GET /notifications/match-counts` → `fetchMatchNotificationCounts()` in `api/notifications.ts`
 */

/* ------------------------------------------------------------------ types */

/** The NDA/CIM request attached to a match row, when one has been raised. */
export type MatchNdaRequest = {
  id: string;
  status: 'requested' | 'nda_sent' | 'nda_signed' | 'ppm_and_nda_sent' | 'cim_sent' | string;
};

/** The post author on a match's embedded feed object, and the counterparty on a suggested match. */
export type MatchProfile = {
  id?: string;
  name?: string;
  username?: string;
  role_type?: string | null;
  sub_category?: string | null;
  city?: string | null;
  profile_img?: string | null;
  is_verified?: boolean;
  email?: string | null;
};

/**
 * The post a match points at.
 *
 * `item` is left as a loose record on purpose. It is the polymorphic post payload — web reads
 * ~110 distinct keys off it across 9 `feed_type`s (`page.tsx:2443-2500` and `:957-1050`), with no
 * type of its own on either side, and which of them matter depends entirely on a UI that hasn't
 * been designed yet. A speculative union here would be guesswork that the redesign would discard.
 */
export type MatchFeed = {
  id?: string;
  feed_type?:
    | 'deal'
    | 'search_capital'
    | 'investor_corner'
    | 'job'
    | 'fae'
    | 'find_a_connection'
    | 'event'
    | 'atc'
    | 'poll'
    | string;
  title?: string | null;
  profile_id?: string;
  user_id?: string;
  profile?: MatchProfile;
  item?: Record<string, unknown>;
};

/**
 * A "Where I'm a Fit" row — a post someone else created that the engine matched you to.
 *
 * `profile_interest` is **your** interest, `creator_interest` is the post owner's; `null` on
 * either means "not yet decided", which is what web renders as the "New" state (`page.tsx:399`) —
 * so these are genuinely tri-state and must not be narrowed to `boolean`.
 *
 * Both `feed` and `feed_full` appear; web prefers the latter (`item.feed_full ?? item.feed ?? {}`,
 * `page.tsx:2518`), so `resolveMatchFeed()` below does the same.
 */
export type FeedMatch = {
  id: string;
  feed_id?: string;
  match_percentage?: number;
  match_summary?: string | null;
  match_risks?: string | null;
  profile_interest?: boolean | null;
  creator_interest?: boolean | null;
  nda_sent?: boolean;
  nda_request?: MatchNdaRequest | null;
  passed_at?: string | null;
  created_at?: string;
  feed?: MatchFeed;
  feed_full?: MatchFeed;
};

/**
 * A "Suggested" row — a person-to-person suggestion, not tied to a post.
 *
 * Note there is **no `match_percentage`** on these; web's suggested card is explicitly score-less
 * (`page.tsx:2104`). The counterparty is `target`, not `feed.profile`.
 */
export type SuggestedMatch = {
  id: string;
  created_at?: string;
  match_summary?: string | null;
  match_risks?: string | null;
  profile_interest?: boolean | null;
  creator_interest?: boolean | null;
  passed_at?: string | null;
  target?: MatchProfile;
};

/** A "From My Posts" row — one of your own posts, with how many matches it has drawn. */
export type MyPostMatchSummary = {
  id: string;
  feed_type?: string;
  created_at?: string;
  match_count?: number;
  has_new_matches?: boolean;
  likes_count?: number;
  comments_count?: number;
  reactions_count?: number;
  profile?: MatchProfile;
  item?: Record<string, unknown>;
};

/**
 * A row from `GET /matchmaking/feed/:feedId` — the creator-side view of who matched one of your
 * posts. Distinct shape from `FeedMatch`: the counterparty is `profile` (not `feed.profile`), and
 * the match-criteria fields sit at the **top level** of the row rather than inside a feed object
 * (`[feedId]/page.tsx:137-177`), which is why they're spread here rather than nested.
 */
export type CreatorSideMatch = {
  id: string;
  created_at?: string;
  match_percentage?: number;
  match_summary?: string | null;
  match_risks?: string | null;
  profile_interest?: boolean | null;
  creator_interest?: boolean | null;
  nda_sent?: boolean;
  nda_request?: MatchNdaRequest | null;
  profile?: MatchProfile;
  [criteriaField: string]: unknown;
};

/** `GET`/`PUT /match-settings` — the one fully-typed shape in web's whole actions module. */
export type MatchSettings = {
  sectors: string[];
  geographies: string[];
  role_types: string[];
  deal_size_min: number | null;
  deal_size_max: number | null;
  active: boolean;
};

export type AiMessageCredits = { used: number; max: number };

export type MatchMessageDraft = { draft: string; used: number; max: number };

/** `GET /matchmaking/my-combined` — one response, two tabs. */
export type CombinedMatches = {
  matchmaking: FeedMatch[];
  userPosts: MyPostMatchSummary[];
};

/** `GET /matchmaking/feed/:feedId`. Web's declared type omits `feed`, but its caller reads it
 * (`[feedId]/page.tsx:992`), so it's typed properly here. */
export type FeedMatchPipeline = {
  count: number;
  data: CreatorSideMatch[];
  feed: MatchFeed | null;
};

/** Mirrors web's `item.feed_full ?? item.feed ?? {}` (`page.tsx:2518`). */
export function resolveMatchFeed(match: FeedMatch): MatchFeed {
  return match.feed_full ?? match.feed ?? {};
}

/* ------------------------------------------------------------------ reads */

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * `GET /matchmaking/my-combined` — matches `fetchMyCombinedMatches`.
 *
 * Fetched **once** for both the "Where I'm a Fit" and "From My Posts" tabs, exactly as web does
 * (`page.tsx:121`), since a single response carries both arrays.
 */
export async function fetchCombinedMatches(includePassed = false): Promise<CombinedMatches> {
  const result = await apiClient
    .get(MATCHMAKING_ENDPOINTS.MY_COMBINED, {
      params: includePassed ? { include_passed: true } : undefined,
    })
    .then(res => res.data);
  return {
    matchmaking: asArray<FeedMatch>(result?.matchmaking),
    userPosts: asArray<MyPostMatchSummary>(result?.user_posts),
  };
}

/** `GET /matchmaking/suggested` — matches `fetchSuggestedMatches`. */
export async function fetchSuggestedMatches(): Promise<SuggestedMatch[]> {
  const result = await apiClient.get(MATCHMAKING_ENDPOINTS.SUGGESTED).then(res => res.data);
  return asArray<SuggestedMatch>(result?.data);
}

/** `GET /matchmaking/suggested/passed` — matches `fetchPassedSuggestedMatches`. */
export async function fetchPassedSuggestedMatches(): Promise<SuggestedMatch[]> {
  const result = await apiClient.get(MATCHMAKING_ENDPOINTS.SUGGESTED_PASSED).then(res => res.data);
  return asArray<SuggestedMatch>(result?.data);
}

/**
 * `GET /matchmaking/my-combined?include_passed=true`, kept to the passed rows — matches
 * `fetchPassedFeedMatches` plus web's own client-side filter (`page.tsx:1785`). There is no
 * passed-only endpoint on the feed side; the flag widens the same list and the caller narrows it.
 */
export async function fetchPassedFeedMatches(): Promise<FeedMatch[]> {
  const { matchmaking } = await fetchCombinedMatches(true);
  return matchmaking.filter(match => Boolean(match.passed_at));
}

/** `GET /matchmaking/feed/:feedId` — matches `fetchMatchesByFeed`. */
export async function fetchMatchesByFeed(feedId: string): Promise<FeedMatchPipeline> {
  const result = await apiClient
    .get(`${MATCHMAKING_ENDPOINTS.FEED}/${feedId}`)
    .then(res => res.data);
  const data = asArray<CreatorSideMatch>(result?.data);
  return { count: result?.count ?? data.length, data, feed: result?.feed ?? null };
}

/** `GET /match-settings` — matches `fetchMatchSettings`. */
export async function fetchMatchSettings(): Promise<MatchSettings> {
  const result = await apiClient.get(MATCH_SETTINGS_ENDPOINTS.BASE).then(res => res.data);
  const data = result?.data ?? {};
  return {
    sectors: asArray<string>(data.sectors),
    geographies: asArray<string>(data.geographies),
    role_types: asArray<string>(data.role_types),
    deal_size_min: data.deal_size_min ?? null,
    deal_size_max: data.deal_size_max ?? null,
    active: data.active ?? false,
  };
}

/** `GET /ai/message-draft-credits` — matches `fetchAiMessageCredits`. */
export async function fetchAiMessageCredits(): Promise<AiMessageCredits> {
  const result = await apiClient.get(AI_ENDPOINTS.MESSAGE_DRAFT_CREDITS).then(res => res.data);
  return { used: result?.used ?? 0, max: result?.max ?? 0 };
}

/* ---------------------------------------------------------------- actions */

/**
 * Everything below mutates real match rows. They are written so the module is complete and the
 * eventual UI has nothing left to wire, but nothing in the current raw-data screens calls them —
 * `pass` and `nda-sent` in particular have no undo path from a read-only screen.
 *
 * All of them take an **empty body**; the payload is entirely in the path. That is web's shape
 * (`actions/my-matches.ts:108-197`), not a simplification.
 */

type InterestField = 'profile_interest' | 'creator_interest';

/**
 * Sets an interest flag true or false. There is no toggle route — true and false are different
 * paths (`change-status` vs `change-status-false`), which is why this takes the value rather than
 * flipping whatever is there.
 *
 * `profile_interest` is the matched user expressing interest in a post; `creator_interest` is the
 * post owner approving a match. Web splits these into four separate exported wrappers; one
 * function with two parameters is the same four calls.
 */
export function setMatchInterest(matchmakingId: string, field: InterestField, interested: boolean) {
  const base = interested
    ? MATCHMAKING_ENDPOINTS.CHANGE_STATUS
    : MATCHMAKING_ENDPOINTS.CHANGE_STATUS_FALSE;
  return apiClient.put(`${base}/${matchmakingId}/${field}`).then(res => res.data);
}

/** `PUT /matchmaking/pass/:id` — matches `passProfileMatch`. Hides the match into the passed bin. */
export function passMatch(matchmakingId: string) {
  return apiClient.put(`${MATCHMAKING_ENDPOINTS.PASS}/${matchmakingId}`).then(res => res.data);
}

/** `PUT /matchmaking/undo-pass/:id` — matches `undoPassMatch`. Restores from the passed bin. */
export function undoPassMatch(matchmakingId: string) {
  return apiClient.put(`${MATCHMAKING_ENDPOINTS.UNDO_PASS}/${matchmakingId}`).then(res => res.data);
}

/** `PUT /matchmaking/nda-sent/:id` — matches `markNdaSent`. Marks the NDA as issued for a match. */
export function markNdaSent(matchmakingId: string) {
  return apiClient.put(`${MATCHMAKING_ENDPOINTS.NDA_SENT}/${matchmakingId}`).then(res => res.data);
}

/**
 * `PUT /matchmaking/delete/:id` — matches `deleteProfileMatch`.
 *
 * Web imports this (`page.tsx:6`) but **never invokes it**, so its real behaviour is unverified
 * on either platform. Included for completeness; treat as unproven until something calls it.
 */
export function deleteProfileMatch(matchmakingId: string) {
  return apiClient.put(`${MATCHMAKING_ENDPOINTS.DELETE}/${matchmakingId}`).then(res => res.data);
}

/** `PUT /matchmaking/delete-creator/:id` — matches `deleteCreatorMatch`. Also imported but never
 * invoked on web (`[feedId]/page.tsx:22`); same caveat as `deleteProfileMatch`. */
export function deleteCreatorMatch(itemId: string) {
  return apiClient
    .put(`${MATCHMAKING_ENDPOINTS.DELETE_CREATOR}/${itemId}`)
    .then(res => res.data);
}

/** `POST /matchmaking/refresh-analysis/:feedId` — matches `refreshMatchAnalysis`. Re-runs the AI
 * scoring for one post's matches; can both update and delete rows, hence the counts back. */
export function refreshMatchAnalysis(feedId: string): Promise<{
  success: boolean;
  updated?: number;
  deleted?: number;
  error?: string;
}> {
  return apiClient
    .post(`${MATCHMAKING_ENDPOINTS.REFRESH_ANALYSIS}/${feedId}`)
    .then(res => res.data);
}

/**
 * `POST /matchmaking/suggested/run` — matches `runSuggestedMatches`. Generates a fresh batch of
 * person-to-person suggestions.
 *
 * `incomplete` is undeclared in web's own return type but its caller reads it via a cast
 * (`page.tsx:140`) to show a "still working" state, so it is typed properly here.
 */
export function runSuggestedMatches(): Promise<{
  success: boolean;
  inserted_count?: number;
  incomplete?: boolean;
  error?: string;
}> {
  return apiClient.post(MATCHMAKING_ENDPOINTS.SUGGESTED_RUN).then(res => res.data);
}

/** `PUT /match-settings` — matches `saveMatchSettings`. Full object, not a patch. */
export function saveMatchSettings(settings: MatchSettings) {
  return apiClient.put(MATCH_SETTINGS_ENDPOINTS.BASE, settings).then(res => res.data);
}

/** `POST /ai/draft-match-message` — matches `draftMatchMessage`. `rewriteText` asks the model to
 * revise an existing draft rather than start over. Returns the updated credit counts too, so the
 * caller never needs a follow-up `fetchAiMessageCredits`. */
export function draftMatchMessage(
  matchmakingId: string,
  rewriteText?: string,
): Promise<MatchMessageDraft> {
  return apiClient
    .post(AI_ENDPOINTS.DRAFT_MATCH_MESSAGE, {
      matchmaking_id: matchmakingId,
      ...(rewriteText ? { rewrite_text: rewriteText } : {}),
    })
    .then(res => res.data);
}
