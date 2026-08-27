import { apiClient } from './client';
import { ETA_INVITE_ENDPOINTS, NOTIFICATION_ENDPOINTS } from './endpoints';

/** All 14 real notification types, matching `webSrc/app/dashboard/notifications/page.tsx`'s own
 * `NType` union exactly. `match_interest`/`match_mutual`/`match_nda_request`/`match_nda_signed`
 * are visually collapsed into one "Matches" category everywhere on both web and mobile (icon,
 * filter chip, counts) — see `collapseNotificationCategory` in `utils/notificationDisplay.ts`. */
export type NotificationType =
  | 'follow'
  | 'comment'
  | 'like'
  | 'system'
  | 'eta_invitation'
  | 'deal'
  | 'community'
  | 'event'
  | 'message'
  | 'match_interest'
  | 'match_mutual'
  | 'match_nda_request'
  | 'match_nda_signed'
  | 'post_recommendation';

export type NotificationActor = {
  id: string;
  name: string;
  username: string;
  profile_img: string | null;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  feed_id: string | null;
  eta_chapter_id?: string | null;
  message: string | null;
  is_read: boolean;
  action_required?: boolean;
  priority?: number;
  created_at: string;
  actor: NotificationActor | null;
};

export type NotificationsPage = {
  items: NotificationItem[];
  total: number;
  hasNextPage: boolean;
};

/** `GET /notifications?page=&limit=&search=` — matches `webSrc/actions/notifications.ts`'s
 * `fetchNotificationsPage`. Search is sent server-side (web itself does no client-side filtering
 * over the loaded page), matching `limit=20` (web's own `LIMIT`). */
export async function fetchNotificationsPage(page: number, limit: number, search?: string): Promise<NotificationsPage> {
  const result = await apiClient
    .get(NOTIFICATION_ENDPOINTS.LIST, { params: { page, limit, search: search || undefined } })
    .then(res => res.data);
  const items = Array.isArray(result?.data) ? result.data : [];
  const total = result?.total ?? items.length;
  return { items, total, hasNextPage: page * limit < total };
}

/** `GET /notifications/unread-count` — matches `fetchUnreadCount`. Polled every 60s (matches
 * web's `DashboardNavbar`) to feed every `TopBar` bell badge. */
export async function fetchUnreadCount(): Promise<number> {
  const result = await apiClient.get(NOTIFICATION_ENDPOINTS.UNREAD_COUNT).then(res => res.data);
  return result?.unread ?? 0;
}

export type MatchNotificationCounts = {
  match_interest: number;
  match_mutual: number;
  match_nda_request: number;
  match_nda_signed: number;
  total: number;
};

/** `GET /notifications/match-counts` — matches `fetchMatchNotificationCounts`. Used only to feed
 * the Notifications screen's collapsed "Matches" filter-chip count (web reserves the per-type
 * breakdown for the My Matches page itself). */
export async function fetchMatchNotificationCounts(): Promise<MatchNotificationCounts> {
  const result = await apiClient.get(NOTIFICATION_ENDPOINTS.MATCH_COUNTS).then(res => res.data);
  return {
    match_interest: result?.match_interest ?? 0,
    match_mutual: result?.match_mutual ?? 0,
    match_nda_request: result?.match_nda_request ?? 0,
    match_nda_signed: result?.match_nda_signed ?? 0,
    total: result?.total ?? 0,
  };
}

/** `POST /notifications/read/:id` — matches `markNotificationAsRead`. Id interpolated at the
 * call site, same convention as every other id-scoped endpoint in this file. */
export function markNotificationAsRead(id: string) {
  return apiClient.post(`${NOTIFICATION_ENDPOINTS.READ}/${id}`).then(res => res.data);
}

/** `POST /notifications/read-all` — matches `markAllNotificationsAsRead`. */
export function markAllNotificationsAsRead() {
  return apiClient.post(NOTIFICATION_ENDPOINTS.READ_ALL).then(res => res.data);
}

/** `DELETE /notifications/:id` — matches `deleteNotificationById`. */
export function deleteNotificationById(id: string) {
  return apiClient.delete(`${NOTIFICATION_ENDPOINTS.BASE}/${id}`).then(res => res.data);
}

/** `DELETE /notifications` — matches `clearAllNotifications`. Deletes every notification. */
export function clearAllNotifications() {
  return apiClient.delete(NOTIFICATION_ENDPOINTS.BASE).then(res => res.data);
}

/** `POST /eta/accept-invite/:notificationId` — matches `acceptEtaInvite`. */
export function acceptEtaInvite(notificationId: string) {
  return apiClient.post(`${ETA_INVITE_ENDPOINTS.ACCEPT}/${notificationId}`).then(res => res.data);
}

/** `POST /eta/decline-invite/:notificationId` — matches `declineEtaInvite`. */
export function declineEtaInvite(notificationId: string) {
  return apiClient.post(`${ETA_INVITE_ENDPOINTS.DECLINE}/${notificationId}`).then(res => res.data);
}
