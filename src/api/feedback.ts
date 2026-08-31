import { apiClient } from './client';
import { FEEDBACK_ENDPOINTS } from './endpoints';

/** `POST /api/feature-suggestions` body `{suggestion}` — matches web's `SuggestFeatureModal`
 * `handleSubmit` (`webSrc/app/dashboard/layout.tsx:19-30`) exactly.
 *
 * This function rejects on failure — web swallows errors at its own call site rather than in a
 * transport helper, and the same split is kept here: `SuggestFeatureSheet` is what catches and
 * shows the thank-you state regardless, matching web's behavior exactly (confirmed with the
 * user). Keeping the rejection here means any future caller can still choose to handle it.
 *
 * Note: this route currently **404s** on the backend (verified 2026-08-31; `/api/notifications`
 * on the same host 401s, so the host is right and the route just isn't implemented) — meaning
 * suggestions are dropped on web today too. Nothing to change here when it lands.
 *
 * Unlike web's raw `fetch`, this carries the user's auth header (via `apiClient`'s request
 * interceptor), so the backend can attribute the suggestion once the route exists. */
export function submitFeatureSuggestion(suggestion: string) {
  return apiClient
    .post(FEEDBACK_ENDPOINTS.FEATURE_SUGGESTIONS, {
      suggestion: suggestion.trim(),
    })
    .then(res => res.data);
}
