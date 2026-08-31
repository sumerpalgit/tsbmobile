import notifee, { AndroidImportance } from '@notifee/react-native';
import {
  ANDROID_CHANNEL_ID,
  ANDROID_CHANNEL_NAME,
  LEGACY_ANDROID_CHANNEL_IDS,
} from './constants';

/**
 * Creates the default Android notification channel.
 *
 * Android 8+ (API 26) drops any notification posted to a channel that doesn't exist — silently,
 * with nothing in logcat. Since this app's `minSdkVersion` is 24 but every realistic device is
 * well past 26, treat the channel as mandatory.
 *
 * `createChannel` is idempotent: calling it on every launch is the documented pattern, not a
 * leak. Note that once a channel exists, Android owns its settings — importance, sound and
 * vibration can no longer be changed from code, only by the user in system settings. Changing
 * them later requires a NEW channel id, so `ANDROID_CHANNEL_ID` is effectively permanent for
 * installed users.
 *
 * The id must stay in sync with the `default_notification_channel_id` meta-data in
 * `AndroidManifest.xml`, which FCM uses for tray notifications it renders itself. If the two
 * diverge, foreground and background notifications land in different channels and the user sees
 * two separate toggles in Android settings for what looks like one feature.
 */
export async function createDefaultChannel(): Promise<void> {
  try {
    // Remove superseded channels so they don't show as dead entries in the app's notification
    // settings. Deleting a channel the user never sees is safe; deleting one they may have
    // customised is not, which is why only ids we know we mis-created are listed.
    for (const legacyId of LEGACY_ANDROID_CHANNEL_IDS) {
      await notifee.deleteChannel(legacyId).catch(() => {});
    }

    await notifee.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: ANDROID_CHANNEL_NAME,
      importance: AndroidImportance.HIGH,
      // `sound` and `vibration` MUST be set explicitly. notifee does NOT fall back to the
      // platform default: omit `sound` and the channel is created with `mSound=null`, i.e.
      // permanently silent, even at HIGH importance. That produced the original symptom —
      // notifications arriving in the tray with no sound at all. Verified against the device
      // with `adb shell dumpsys notification`, where a working channel shows
      // `mSound=content://settings/system/notification_sound` and ours showed `mSound=null`.
      sound: 'default',
      vibration: true,
    });
  } catch {
    // Non-fatal: a failed channel creation means notifications won't display, but it must not
    // take the app down at startup. The failure is visible immediately in testing anyway.
  }
}
