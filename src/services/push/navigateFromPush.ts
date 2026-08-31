import Toast from 'react-native-toast-message';
import { navigationRef } from '../../navigation/navigationRef';
import { getNotificationDestination } from '../../utils/notificationDisplay';
import { fetchProfileByUsername } from '../../api/profile';
import type {
  NotificationItem,
  NotificationType,
} from '../../api/notifications';
import { PUSH_LOG_PREFIX } from './constants';

/**
 * Routes a push-notification tap to the same screen the in-app Notifications list opens for that
 * notification type.
 *
 * The type→destination decision is NOT reimplemented here: it reuses
 * `getNotificationDestination` (`utils/notificationDisplay.ts`), the same function
 * `NotificationsScreen`'s own row tap uses. Any future change to where a notification type leads
 * is then made once and applies to both. Only the `navigate()` calls themselves are duplicated
 * from `NotificationsScreen.tsx:193-217` (~20 lines) — deliberately, rather than refactoring a
 * working screen for this.
 *
 * Deliberate difference from the in-app row: no `markRead` call. A push tap means the user opened
 * the notification, but the read state belongs to the in-app list, and marking it here would need
 * the notification's own id — which the push payload isn't guaranteed to carry. The list marks it
 * read when they next visit it.
 */

/** The subset of `NotificationItem` that `getNotificationDestination` actually reads. */
type PushPayload = Record<string, string | undefined>;

function toNotificationLike(data: PushPayload): NotificationItem | null {
  const type = data.type as NotificationType | undefined;
  if (!type) return null;
  return {
    id: data.id ?? '',
    type,
    feed_id: data.feed_id ?? null,
    message: data.message ?? null,
    is_read: false,
    created_at: data.created_at ?? '',
    // `getNotificationDestination` reads `actor?.username` for the `follow` case. The rest of the
    // actor shape is unused here, so it's filled in only enough to satisfy the type.
    actor: data.username
      ? {
          id: '',
          name: data.name ?? '',
          username: data.username,
          profile_img: null,
        }
      : null,
  };
}

/**
 * `MemberProfile` takes a full `Profile` object, not a username, so a `follow` push needs a
 * fetch before it can navigate — the same two-step `NotificationsScreen`'s `navigateToProfile`
 * and `MessagesScreen`'s `handleViewProfile` already do.
 */
async function navigateToProfile(username: string) {
  try {
    const profile = await fetchProfileByUsername(username);
    navigationRef.navigate('MemberProfile', { profile, initialSaved: false });
  } catch {
    Toast.show({ type: 'error', text1: 'Could not open this profile' });
  }
}

/**
 * Navigates for a tapped push. Safe to call before the navigator exists — returns false so the
 * caller can queue and replay (see `handlers.ts`); a cold start always arrives before the tree
 * is ready, since `App.tsx` holds a splash for ≥2s and until theme+auth resolve.
 */
export async function navigateFromPush(
  data: PushPayload | undefined,
): Promise<boolean> {
  if (!data) return false;
  if (!navigationRef.isReady()) {
    console.log(
      `${PUSH_LOG_PREFIX} navigation not ready yet — queued for replay`,
    );
    return false;
  }

  const item = toNotificationLike(data);
  if (!item) return true; // Nothing to route to, but the navigator was ready — don't re-queue.

  const destination = getNotificationDestination(item);
  console.log(
    `${PUSH_LOG_PREFIX} routing tap`,
    JSON.stringify({ type: item.type, destination }),
  );
  if (!destination) return true; // `eta_invitation`/`system` have no destination, matching web.

  switch (destination.kind) {
    case 'feedPost':
      navigationRef.navigate('FeedPostDetail', { feedId: destination.feedId });
      return true;
    case 'messages':
      // Matches web's own `getUrl` — a `message` notification opens the inbox, not a specific
      // thread (no conversation id in the payload).
      navigationRef.navigate('Drawer', {
        screen: 'Tabs',
        params: { screen: 'Messages' },
      });
      return true;
    case 'myMatches':
      navigationRef.navigate('Drawer', { screen: 'MyMatches' });
      return true;
    case 'profile':
      await navigateToProfile(destination.username);
      return true;
    default:
      return true;
  }
}
