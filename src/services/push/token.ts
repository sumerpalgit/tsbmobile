import {
  deleteToken,
  getMessaging,
  getToken,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import { PUSH_TOKEN_LOG_PREFIX } from './constants';

/**
 * FCM registration token handling.
 *
 * There is no backend device-token endpoint yet (verified: the API has no device/token route at
 * all), so this phase only *logs* the token. Pull it off the device with
 * `adb logcat | grep PUSH_TOKEN` and paste it into Firebase Console → Cloud Messaging →
 * "Send test message". When the backend ships a register endpoint, the call goes right here
 * alongside each log — nothing else in this folder changes.
 *
 * Uses @react-native-firebase v26's **modular** API (`getMessaging(...)` + free functions). The
 * older namespaced form — `messaging().getToken()` — was removed in v22; there is no default
 * export any more, so `import messaging from ...` fails to compile.
 */

function logToken(label: string, token: string | null) {
  console.log(`${PUSH_TOKEN_LOG_PREFIX} ${label}: ${token ?? '(none)'}`);
}

/** Fetches the current FCM token and logs it. Returns null if it can't be obtained. */
export async function getAndLogPushToken(): Promise<string | null> {
  try {
    const token = await getToken(getMessaging());
    logToken('current', token);
    return token;
  } catch (err) {
    logToken('failed', null);
    console.log(`${PUSH_TOKEN_LOG_PREFIX} error:`, err);
    return null;
  }
}

/**
 * Subscribes to FCM's own token rotation (it reissues on app restore, data clear, and periodically
 * on its own schedule). Returns the unsubscribe function.
 *
 * Without this, a rotated token would leave the device unreachable and — once a backend register
 * endpoint exists — the server holding a dead token with no way to learn about it.
 */
export function subscribeToTokenRefresh(): () => void {
  return onTokenRefresh(getMessaging(), token => {
    logToken('refreshed', token);
  });
}

/**
 * Deletes the current token and issues a fresh one — used when switching dual profile.
 *
 * Worth being explicit about the underlying behaviour, because it is counter-intuitive: **an FCM
 * token belongs to the app install, not to the user account.** Switching profile rotates the JWT
 * (`api/dual-profile.ts`'s `applyRotatedToken`) but leaves the FCM token untouched, so without
 * this call the device would keep the push identity of the profile the user just left.
 *
 * Rotating here keeps the device's push identity tied to the profile actually in use. The
 * consequence — deliberate, and the thing to expect when testing — is that **the old token is
 * dead immediately**: sends to it from the Firebase console will not arrive. That is the correct
 * result, not a failure.
 *
 * Order matters: `deleteToken()` must complete before `getToken()`, or the SDK hands back the
 * token that was just scheduled for deletion.
 */
export async function rotateTokenForProfileSwitch(): Promise<string | null> {
  try {
    const app = getMessaging();
    await deleteToken(app);
    const token = await getToken(app);
    logToken('rotated (profile switch)', token);
    return token;
  } catch (err) {
    // Non-fatal: the profile switch itself has already succeeded by the time this runs, and
    // failing to rotate must not surface as a switch failure to the user.
    console.log(`${PUSH_TOKEN_LOG_PREFIX} rotation failed:`, err);
    return null;
  }
}
