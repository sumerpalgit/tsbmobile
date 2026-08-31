import {
  getMessaging,
  getInitialNotification,
  onMessage,
  onNotificationOpenedApp,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { queryClient } from '../../config/queryClient';
import {
  NOTIFICATIONS_QUERY_KEY,
  NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
} from '../../api/queryKeys';
import { ANDROID_CHANNEL_ID, PUSH_LOG_PREFIX } from './constants';
import { navigateFromPush } from './navigateFromPush';

type PushData = Record<string, string | undefined>;

/**
 * Refreshes the in-app notification state after a push arrives.
 *
 * `NOTIFICATIONS_QUERY_KEY` is `['notifications']` and the list query is keyed
 * `[...NOTIFICATIONS_QUERY_KEY, search]`, so invalidating the base key prefix-matches every
 * search variant in the cache. The unread count is a single shared entry read by both the
 * TopBar bell (`DrawerNavigator.tsx`) and `ProfileScreen`, so invalidating it updates every
 * badge at once.
 */
function refreshNotificationState() {
  queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
  queryClient.invalidateQueries({
    queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
  });
}

/**
 * Displays a notification while the app is in the foreground.
 *
 * FCM deliberately does NOT display foreground messages — it just hands them to `onMessage` —
 * so without this the user sees nothing at all while the app is open. notifee renders it into
 * the same channel the tray uses for background delivery (`ANDROID_CHANNEL_ID`, kept in sync
 * with the manifest meta-data), so foreground and background notifications look identical and
 * share one toggle in Android settings.
 */
async function displayForeground(message: RemoteMessage) {
  const data = message.data as PushData | undefined;
  const title =
    message.notification?.title ?? data?.title ?? 'The Search Bridge';
  const body = message.notification?.body ?? data?.message ?? '';

  await notifee.displayNotification({
    title,
    body,
    // Carried through so a tap on THIS notification routes the same way a tray tap does.
    data: (data ?? {}) as Record<string, string>,
    android: {
      channelId: ANDROID_CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
      smallIcon: 'ic_launcher',
    },
  });
}

/**
 * Registers the foreground message listener and both tap handlers. Call once from `App.tsx`.
 * Returns an unsubscribe function.
 *
 * Background/quit delivery is NOT handled here — `setBackgroundMessageHandler` must be registered
 * outside the React tree, in `index.js`. That's a hard requirement of the library.
 */
export function registerPushHandlers(): () => void {
  const app = getMessaging();

  const unsubscribeOnMessage = onMessage(app, async message => {
    console.log(
      `${PUSH_LOG_PREFIX} RECEIVED [foreground] — app open and visible`,
      JSON.stringify({
        messageId: message.messageId,
        title: message.notification?.title,
        body: message.notification?.body,
        data: message.data,
      }),
    );
    await displayForeground(message);
    refreshNotificationState();
  });

  // Warm tap: app was backgrounded, user tapped the tray notification.
  const unsubscribeOnOpened = onNotificationOpenedApp(app, message => {
    console.log(
      `${PUSH_LOG_PREFIX} TAPPED [background] — app was backgrounded, tray notification opened it`,
      JSON.stringify({ data: message?.data }),
    );
    navigateFromPush(message?.data as PushData | undefined);
    refreshNotificationState();
  });

  // Tap on a notification WE rendered via notifee while in the foreground. FCM's own
  // `onNotificationOpenedApp` never fires for these, so without this the foreground banner is
  // not tappable.
  const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
    // 1 === EventType.PRESS. Imported numerically to avoid pulling the enum into this module's
    // import list for a single comparison.
    if (type === 1 && detail.notification?.data) {
      console.log(
        `${PUSH_LOG_PREFIX} TAPPED [foreground banner]`,
        JSON.stringify({ data: detail.notification.data }),
      );
      navigateFromPush(detail.notification.data as PushData);
    }
  });

  return () => {
    unsubscribeOnMessage();
    unsubscribeOnOpened();
    unsubscribeNotifee();
  };
}

/**
 * Handles the cold-start case: the app was killed, the user tapped a notification, and that tap
 * is what launched the process.
 *
 * This must be *replayed*, not just read: `App.tsx` holds a splash for at least 2s and until both
 * theme and auth have loaded, so at the moment this resolves the navigator does not exist yet.
 * `navigateFromPush` returns false in that case, and the caller retries once navigation is ready.
 * Dropping this is the single most likely bug in the feature — it looks fine in every test except
 * "tap a notification while the app is fully closed".
 */
export async function consumeInitialNotification(): Promise<
  PushData | undefined
> {
  try {
    const initial = await getInitialNotification(getMessaging());
    if (initial) {
      console.log(
        `${PUSH_LOG_PREFIX} TAPPED [killed / cold start] — this tap launched the app`,
        JSON.stringify({
          title: initial.notification?.title,
          body: initial.notification?.body,
          data: initial.data,
        }),
      );
    } else {
      console.log(
        `${PUSH_LOG_PREFIX} cold start — not launched by a notification`,
      );
    }
    return initial?.data as PushData | undefined;
  } catch {
    return undefined;
  }
}
