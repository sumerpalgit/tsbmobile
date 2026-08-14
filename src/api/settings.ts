import { Platform } from 'react-native';
import { apiClient } from './client';
import { SETTINGS_ENDPOINTS } from './endpoints';
import {
  DEFAULT_MATCH_AUDIENCE,
  DEFAULT_MATCH_BEHAVIOR,
  DEFAULT_NOTIF_PREFS,
  DEFAULT_VISIBILITY,
  MatchAudience,
  MatchBehavior,
  NotificationPrefs,
  MatchTypeKey,
  PaymentRecord,
  Session,
  Subscription,
  SupportSeverity,
  SupportTicketType,
  VisibilitySettings,
} from '../types/settings';

/** Thin `PUT/POST/DELETE/GET` wrappers over `SETTINGS_ENDPOINTS` — matches
 * `webSrc/src/app/dashboard/settings/page.tsx`'s real `authFetch` calls field-for-field (see the
 * plan at `delightful-seeking-snowglobe.md`). Every response on real web is `{ data: ... }`
 * (occasionally `{ message: ... }` for the async data-export path) — unwrapped defensively here,
 * same convention as `adManagement.ts`'s `mapAd`. */

export function changePassword(currentPassword: string, newPassword: string) {
  return apiClient
    .post(SETTINGS_ENDPOINTS.CHANGE_PASSWORD, { currentPassword, newPassword })
    .then(res => res.data);
}

/** Step 1 of the OTP-based email change (per the backend team's spec, 2026-08-14) — `oldEmail`
 * must exactly match the logged-in account's current email (caller passes the value from
 * `useMe()`, not user-typed text) and `platform` (`Platform.OS`, literally `'ios'`/`'android'`)
 * is what tells the backend to send a 4-digit code instead of the old link-based flow. Doubles
 * as the "resend code" call — the backend has no separate resend endpoint, calling this again
 * with the same emails just generates a fresh code and invalidates the old one. */
export function changeEmail(oldEmail: string, newEmail: string) {
  return apiClient
    .post(SETTINGS_ENDPOINTS.CHANGE_EMAIL, { oldEmail, newEmail, platform: Platform.OS })
    .then(res => res.data);
}

/** Step 2 — verifies the 4-digit code and, only on success, actually updates the account's
 * email server-side. Caller must invalidate `useMe()`'s query on success so the new email shows
 * up locally; on failure the account email is untouched (no rollback needed on this side). */
export function verifyEmailChangeOtp(code: string) {
  return apiClient.post(SETTINGS_ENDPOINTS.VERIFY_EMAIL_CHANGE_OTP, { code }).then(res => res.data);
}

function mapSession(raw: any): Session {
  return {
    id: String(raw?.id ?? ''),
    device: String(raw?.device ?? ''),
    location: String(raw?.location ?? ''),
    lastSeen: String(raw?.lastSeen ?? raw?.last_seen ?? ''),
    isCurrent: !!(raw?.isCurrent ?? raw?.is_current),
  };
}

export async function fetchSessions(): Promise<Session[]> {
  const data = await apiClient.get(SETTINGS_ENDPOINTS.SESSIONS).then(res => res.data);
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map(mapSession);
}

export function logoutAllDevices() {
  return apiClient.post(SETTINGS_ENDPOINTS.LOGOUT_ALL_DEVICES).then(res => res.data);
}

/** `DELETE ${SESSIONS}/:id` — matches web: client-side removes the row from local state after
 * success, no re-fetch. */
export function revokeSession(id: string) {
  return apiClient.delete(`${SETTINGS_ENDPOINTS.SESSIONS}/${id}`).then(res => res.data);
}

/** No body — matches web exactly (no re-fetch/redirect/state-change afterward on real web
 * either, just an acknowledgment; see the plan's decision #3). */
export function pauseAccount() {
  return apiClient.post(SETTINGS_ENDPOINTS.PAUSE_ACCOUNT).then(res => res.data);
}

/** `confirmation` must be the literal string `"DELETE"`, matching web's own gate. */
export function deleteAccount() {
  return apiClient
    .delete(SETTINGS_ENDPOINTS.ACCOUNT, { data: { confirmation: 'DELETE' } })
    .then(res => res.data);
}

function mapVisibility(raw: any): VisibilitySettings {
  return {
    showInDirectory: raw?.showInDirectory ?? DEFAULT_VISIBILITY.showInDirectory,
    showInMatches: raw?.showInMatches ?? DEFAULT_VISIBILITY.showInMatches,
    showProBadge: raw?.showProBadge ?? DEFAULT_VISIBILITY.showProBadge,
    defaultAnonymousPosting: raw?.defaultAnonymousPosting ?? DEFAULT_VISIBILITY.defaultAnonymousPosting,
    indexForSearchEngines: raw?.indexForSearchEngines ?? DEFAULT_VISIBILITY.indexForSearchEngines,
  };
}

export async function fetchVisibility(): Promise<VisibilitySettings> {
  const data = await apiClient.get(SETTINGS_ENDPOINTS.VISIBILITY).then(res => res.data);
  return mapVisibility(data?.data ?? data);
}

export function saveVisibility(settings: VisibilitySettings) {
  return apiClient.put(SETTINGS_ENDPOINTS.VISIBILITY, settings).then(res => res.data);
}

function mapMatchAudience(raw: any): MatchAudience {
  const keys = Object.keys(DEFAULT_MATCH_AUDIENCE) as MatchTypeKey[];
  return keys.reduce((acc, key) => {
    acc[key] = { enabled: raw?.[key]?.enabled ?? DEFAULT_MATCH_AUDIENCE[key].enabled };
    return acc;
  }, {} as MatchAudience);
}

function mapMatchBehavior(raw: any): MatchBehavior {
  return {
    mutualMatchesOnly: raw?.mutualMatchesOnly ?? DEFAULT_MATCH_BEHAVIOR.mutualMatchesOnly,
    hideConnectedMembers: raw?.hideConnectedMembers ?? DEFAULT_MATCH_BEHAVIOR.hideConnectedMembers,
    resurfaceDismissed: raw?.resurfaceDismissed ?? DEFAULT_MATCH_BEHAVIOR.resurfaceDismissed,
    dailyMatchLimit: raw?.dailyMatchLimit ?? DEFAULT_MATCH_BEHAVIOR.dailyMatchLimit,
  };
}

export async function fetchMatching(): Promise<{ matchAudience: MatchAudience; matchBehavior: MatchBehavior }> {
  const data = await apiClient.get(SETTINGS_ENDPOINTS.MATCHING).then(res => res.data);
  const raw = data?.data ?? data;
  return { matchAudience: mapMatchAudience(raw?.matchAudience), matchBehavior: mapMatchBehavior(raw) };
}

export async function fetchMatchingCounts(): Promise<Record<string, number>> {
  const data = await apiClient.get(SETTINGS_ENDPOINTS.MATCHING_COUNTS).then(res => res.data);
  const raw = data?.data ?? data;
  return raw && typeof raw === 'object' ? raw : {};
}

/** One function for both the 600ms-debounced audience-only auto-save (call with just
 * `{matchAudience}`) and the explicit "Save preferences" combined save (call with
 * `{matchAudience, ...matchBehavior}`) — matches web exactly, same endpoint either way. */
export function saveMatching(payload: Partial<MatchBehavior> & { matchAudience: MatchAudience }) {
  return apiClient.put(SETTINGS_ENDPOINTS.MATCHING, payload).then(res => res.data);
}

function mapNotifPrefs(raw: any): NotificationPrefs {
  return {
    follow: raw?.follow ?? DEFAULT_NOTIF_PREFS.follow,
    like: raw?.like ?? DEFAULT_NOTIF_PREFS.like,
    comment: raw?.comment ?? DEFAULT_NOTIF_PREFS.comment,
    system: raw?.system ?? DEFAULT_NOTIF_PREFS.system,
    eta_invitation: raw?.eta_invitation ?? DEFAULT_NOTIF_PREFS.eta_invitation,
  };
}

export async function fetchNotificationPrefs(): Promise<NotificationPrefs> {
  const data = await apiClient.get(SETTINGS_ENDPOINTS.NOTIFICATION_PREFERENCES).then(res => res.data);
  return mapNotifPrefs(data?.data ?? data);
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<NotificationPrefs> {
  const data = await apiClient.put(SETTINGS_ENDPOINTS.NOTIFICATION_PREFERENCES, prefs).then(res => res.data);
  return mapNotifPrefs(data?.data ?? data);
}

/** Response shape genuinely varies on real web: an immediate `{data:...}` (a downloadable blob,
 * no mobile file-save attempted per the plan's scope cut) or an async `{message:...}` ("you'll
 * get an email"). Returns whichever message is actually present rather than assuming one shape. */
export async function requestDataExport(): Promise<{ message: string }> {
  const data = await apiClient.post(SETTINGS_ENDPOINTS.REQUEST_DATA_EXPORT).then(res => res.data);
  return { message: data?.message || "You'll get an email when your export is ready." };
}

function mapSubscription(raw: any): Subscription {
  return {
    planName: String(raw?.plan_name ?? raw?.planName ?? 'Free'),
    status: String(raw?.status ?? ''),
    billingCycle: String(raw?.billing_cycle ?? raw?.billingCycle ?? ''),
    currentPeriodEnd: raw?.current_period_end ?? raw?.currentPeriodEnd ?? null,
  };
}

export async function fetchSubscription(): Promise<Subscription> {
  const data = await apiClient.get(SETTINGS_ENDPOINTS.SUBSCRIPTION).then(res => res.data);
  return mapSubscription(data?.data ?? data);
}

function mapPaymentRecord(raw: any): PaymentRecord {
  return {
    id: String(raw?.id ?? ''),
    planName: String(raw?.plan_name ?? raw?.planName ?? ''),
    amount: Number(raw?.amount ?? 0),
    currency: String(raw?.currency ?? ''),
    status: String(raw?.status ?? ''),
    paidAt: String(raw?.paid_at ?? raw?.paidAt ?? ''),
    invoiceUrl: raw?.invoice_url ?? raw?.invoiceUrl ?? null,
  };
}

export async function fetchPaymentHistory(): Promise<PaymentRecord[]> {
  const data = await apiClient.get(SETTINGS_ENDPOINTS.PAYMENT_HISTORY).then(res => res.data);
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map(mapPaymentRecord);
}

/** `severity` is required (not optional) so both call sites — bug report (real picker) and
 * complaint (no picker shown) — are forced to pass one, preserving web's real "always sent, even
 * when not shown" quirk at the wire level instead of relying on a caller to remember it. */
export function submitSupportTicket(
  type: SupportTicketType,
  subject: string,
  description: string,
  severity: SupportSeverity,
) {
  return apiClient
    .post(SETTINGS_ENDPOINTS.SUPPORT_TICKET, { ticketType: type, subject, description, severity })
    .then(res => res.data);
}
