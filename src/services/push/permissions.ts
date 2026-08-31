import notifee, { AuthorizationStatus } from '@notifee/react-native';

/**
 * Asks for notification permission.
 *
 * Android 13+ (API 33) gates notifications behind the runtime `POST_NOTIFICATIONS` permission,
 * and this app targets 36 — without the prompt the system silently drops every notification,
 * with no error anywhere. Declaring it in `AndroidManifest.xml` is only half the job.
 *
 * `notifee.requestPermission()` is used rather than `messaging().requestPermission()` because it
 * covers the Android runtime prompt directly; the Firebase call is an iOS-only concern.
 *
 * Called after login rather than at cold start (see `usePush.ts`) so a brand-new user isn't
 * asked for permission before they've seen anything worth being notified about — Android only
 * ever shows this dialog once, so spending it on a first-launch screen wastes it.
 *
 * Returns whether notifications are permitted. Never throws: a denied permission is a normal
 * outcome, not an error, and the caller carries on either way.
 */
export async function requestPushPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

/** Current permission state without prompting — for deciding whether to bother fetching a token. */
export async function hasPushPermission(): Promise<boolean> {
  try {
    const settings = await notifee.getNotificationSettings();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}
