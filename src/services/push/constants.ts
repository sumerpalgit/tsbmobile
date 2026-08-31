/**
 * Shared push constants.
 *
 * `ANDROID_CHANNEL_ID` must match the `com.google.firebase.messaging.default_notification_channel_id`
 * meta-data in `AndroidManifest.xml` — FCM uses that value for notifications the system tray renders
 * itself (background/quit delivery), and notifee uses this one for the foreground notifications we
 * render by hand. If the two ever diverge, foreground and background notifications land in two
 * different channels and the user sees two separate toggles in Android settings.
 */
export const ANDROID_CHANNEL_ID = 'tsb_default_v2';
export const ANDROID_CHANNEL_NAME = 'General';

/** The first channel id shipped by this feature. It was created without a sound (see
 * `channel.ts`) and Android makes channel settings **immutable after creation** — importance,
 * sound and vibration can never be changed from code again, only by the user in system settings.
 * Fixing a wrongly-configured channel therefore requires a NEW id, which is why the live id above
 * carries a `_v2` suffix. This one is deleted on startup so it doesn't linger as a dead entry in
 * the app's notification settings. Any future change to the channel's sound/importance needs the
 * same treatment: bump the id, delete the previous one. */
export const LEGACY_ANDROID_CHANNEL_IDS = ['tsb_default'];

/** Greppable prefix for the FCM registration token.
 *
 * There is no backend endpoint to register a device token against yet (confirmed: the API has no
 * device/token route at all), so for this phase the token is only logged. Pull it off the device
 * with `adb logcat | grep PUSH_TOKEN` and paste it into Firebase Console → Cloud Messaging →
 * "Send test message". When the backend ships a register endpoint, the call belongs in
 * `token.ts` next to these logs — nothing else here needs to change. */
export const PUSH_TOKEN_LOG_PREFIX = '[PUSH_TOKEN]';

/** Greppable prefix for every push lifecycle log — receive (foreground / background / killed)
 * and tap. One `adb logcat | grep "\[PUSH\]"` shows the whole flow, including the token lines,
 * since `PUSH_TOKEN_LOG_PREFIX` shares the same bracket style. */
export const PUSH_LOG_PREFIX = '[PUSH]';
