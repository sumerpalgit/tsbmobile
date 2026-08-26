import { apiClient } from './client';
import { COMMENTS_ENDPOINTS, ENGAGEMENT_ENDPOINTS, FEED_ENDPOINTS, LIKES_ENDPOINTS } from './endpoints';
import type { FeedEngagement } from './feed';

/** `POST /likes/toggle` body `{feed_id}` — matches `webSrc/hooks/useFeedActions.ts`'s `toggleLike`. */
export function toggleLike(feedId: string) {
  return apiClient.post(LIKES_ENDPOINTS.TOGGLE, { feed_id: feedId }).then(res => res.data);
}

/** `POST /comments` body `{feed_id, content}` — matches `useFeedActions.ts`'s `postComment`. */
export function postComment(feedId: string, content: string) {
  return apiClient.post(COMMENTS_ENDPOINTS.BASE, { feed_id: feedId, content }).then(res => res.data);
}

/** `PUT /comments/:id` body `{content}` — matches web's inline edit-comment call in
 * `my-activities/page.tsx`'s `saveEditComment` (there's no dedicated `useFeedActions` function for
 * this — web wires it directly in the page). Powers My Activity's Commented Posts "Edit" action. */
export function editComment(commentId: string, content: string) {
  return apiClient.put(`${COMMENTS_ENDPOINTS.BASE}/${commentId}`, { content }).then(res => res.data);
}

/** `POST /feed/poll/vote` body `{poll_id, option_index}` — matches `useFeedActions.ts`'s
 * `submitPollVote`. */
export function submitPollVote(pollId: string, optionIndex: number) {
  return apiClient
    .post(FEED_ENDPOINTS.POLL_VOTE, { poll_id: pollId, option_index: optionIndex })
    .then(res => res.data);
}

/** `DELETE /feed/poll/delete/:pollId` — matches `useFeedActions.ts`'s `deletePollVote`. */
export function deletePollVote(pollId: string) {
  return apiClient.delete(`${FEED_ENDPOINTS.POLL_DELETE_VOTE}/${pollId}`).then(res => res.data);
}

/** `POST /engagement` body `{feed_ids}` → `{engagement: Record<feedId, Engagement>}` — matches
 * `webSrc/actions/my-activity.ts`'s `fetchMyActivityEngagements`. My Activity's per-tab list
 * endpoints don't inline `engagements` the way `/feed`/`/feed/search` do, so this batch call fills
 * that gap for the current page's feed ids. */
export async function fetchEngagements(feedIds: string[]): Promise<Record<string, FeedEngagement>> {
  if (feedIds.length === 0) return {};
  const result = await apiClient.post(ENGAGEMENT_ENDPOINTS.BATCH, { feed_ids: feedIds }).then(res => res.data);
  return result?.engagement ?? {};
}

/** `POST /feed/interactions/count` body `{feedIds}` → `{data: [{feedId, interaction_count}]}` —
 * matches `fetchMyActivityInteractionCounts`. Batch companion to `fetchEngagements` above. */
export async function fetchInteractionCounts(feedIds: string[]): Promise<Record<string, number>> {
  if (feedIds.length === 0) return {};
  const result = await apiClient
    .post(FEED_ENDPOINTS.INTERACTION_COUNTS, { feedIds })
    .then(res => res.data);

  const rows: Array<{ feedId: string; interaction_count: number }> = Array.isArray(result?.data)
    ? result.data
    : [];
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.feedId] = row.interaction_count;
    return acc;
  }, {});
}
