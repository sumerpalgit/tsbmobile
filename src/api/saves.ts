import { apiClient } from './client';
import { SAVES_ENDPOINTS } from './endpoints';

/** `POST /api/saves/toggle` body `{feed_id}` — matches web's `handleToggleSave` (`my-events/page.tsx`).
 * Toggles bookmark state for any feed item; My Events only ever calls this with an event's
 * `feed_id`, never its `id`. */
export function toggleSave(feedId: string) {
  return apiClient.post(SAVES_ENDPOINTS.TOGGLE, { feed_id: feedId }).then(res => res.data);
}
