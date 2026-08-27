import type { NotificationItem, NotificationType } from '../api/notifications';

/** Ported verbatim from `webSrc/app/dashboard/notifications/page.tsx`'s own `MATCH_TYPES` — the 4
 * match types are visually collapsed into one "Matches" category everywhere (filter chip, icon,
 * counts). */
export const MATCH_TYPES: NotificationType[] = ['match_interest', 'match_mutual', 'match_nda_request', 'match_nda_signed'];

export function isMatchType(type: NotificationType): boolean {
  return MATCH_TYPES.includes(type);
}

/** `catFilter`'s 9 categories, matching web's own `Cat` union exactly — note `like`/`comment`/
 * `follow`/`post_recommendation` deliberately have no dedicated chip of their own on web (they
 * only ever show up under "All notifications"/"Unread"), a real quirk replicated here rather than
 * "fixed" by adding chips web itself doesn't have. */
export type NotificationCategory = 'all' | 'unread' | 'match' | 'deal' | 'community' | 'eta_invitation' | 'event' | 'message' | 'system';

export const CATEGORY_ORDER: NotificationCategory[] = ['all', 'unread', 'match', 'deal', 'community', 'eta_invitation', 'event', 'message', 'system'];

/** Matches web's `CAT_LABELS` — the main column's title when that category is active. */
export const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  all: 'All notifications',
  unread: 'Unread',
  match: 'Matches',
  deal: 'Deals',
  community: 'Community',
  eta_invitation: 'Chapters',
  event: 'Events',
  message: 'Messages',
  system: 'System',
};

/** Matches web's `TYPE_CAT_LABEL` — the small gold category tag shown on each row. */
export const TYPE_CATEGORY_LABEL: Record<NotificationType, string> = {
  match_interest: 'Match',
  match_mutual: 'Match',
  match_nda_request: 'Match',
  match_nda_signed: 'Match',
  deal: 'Deal',
  community: 'Community',
  eta_invitation: 'Chapter',
  event: 'Event',
  follow: 'Follow',
  comment: 'Comment',
  like: 'Like',
  message: 'Message',
  system: 'System',
  post_recommendation: 'Pick',
};

/** Matches web's `catFilter` exactly. */
export function matchesCategory(n: NotificationItem, category: NotificationCategory): boolean {
  switch (category) {
    case 'all':
      return true;
    case 'unread':
      return !n.is_read;
    case 'match':
      return isMatchType(n.type);
    case 'deal':
      return n.type === 'deal';
    case 'community':
      return n.type === 'community';
    case 'eta_invitation':
      return n.type === 'eta_invitation';
    case 'event':
      return n.type === 'event';
    case 'message':
      return n.type === 'message';
    case 'system':
      return n.type === 'system';
    default:
      return true;
  }
}

/** Matches web's local `getMessage` exactly, including the odd real copy for a few types
 * ("bookmarked your post"/"voted on your poll"/"RSVP'd to your event" for deal/community/event —
 * not a typo, that's the live fallback text) — `n.message` (when present) always wins over the
 * template for every type except `follow`/`comment`/`like`, which always use the template. */
export function getNotificationMessage(n: NotificationItem): string {
  const who = n.actor?.name || 'Someone';
  switch (n.type) {
    case 'follow':
      return `${who} started following you.`;
    case 'comment':
      return `${who} commented on your post.`;
    case 'like':
      return `${who} liked your post.`;
    case 'eta_invitation':
      return n.message || `${who} invited you to join an ETA chapter.`;
    case 'message':
      return n.message || `${who} sent you a message.`;
    case 'deal':
      return n.message || `${who} bookmarked your post.`;
    case 'community':
      return n.message || `${who} voted on your poll.`;
    case 'event':
      return n.message || `${who} RSVP'd to your event.`;
    case 'match_mutual':
      return n.message || 'You have a new mutual match!';
    case 'match_interest':
      return n.message || 'Someone expressed interest in your match.';
    case 'match_nda_request':
      return n.message || 'An NDA has been sent for your match.';
    case 'match_nda_signed':
      return n.message || 'An NDA was signed.';
    default:
      return n.message || 'New notification.';
  }
}

/** Which destination a tap should resolve to, matching web's `getUrl` exactly — the mobile screen
 * names/params are filled in as each of Phases 1–4 lands. `null` means no navigation, same as web
 * returning `null` (either permanently, for `eta_invitation`/`system`, or temporarily until that
 * destination phase is built). */
export type NotificationDestination =
  | { kind: 'feedPost'; feedId: string }
  | { kind: 'messages' }
  | { kind: 'profile'; username: string }
  | { kind: 'myMatches' }
  | null;

export function getNotificationDestination(n: NotificationItem): NotificationDestination {
  switch (n.type) {
    case 'comment':
    case 'like':
    case 'deal':
    case 'community':
    case 'event':
    case 'post_recommendation':
      return n.feed_id ? { kind: 'feedPost', feedId: n.feed_id } : null;
    case 'message':
      return { kind: 'messages' };
    case 'follow':
      return n.actor?.username ? { kind: 'profile', username: n.actor.username } : null;
    case 'match_interest':
    case 'match_mutual':
    case 'match_nda_request':
    case 'match_nda_signed':
      return { kind: 'myMatches' };
    default:
      return null;
  }
}

/** Matches web's local `timeAgo` exactly — deliberately NOT `utils/formatRelativeTime.ts` (that
 * one caps at a week and falls back to a calendar date; web's own Notifications page never caps,
 * and lowercases "just now"). Kept local to this feature for the same reason
 * `myActivity/cards/cardTime.ts`'s `cardTimeAgo` is kept local rather than reusing the general
 * util — this feature's real web source has its own distinct cutoff behavior. */
export function notificationTimeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export type TimeGroup = 'new' | 'today' | 'week' | 'older';
export const GROUP_ORDER: TimeGroup[] = ['new', 'today', 'week', 'older'];
export const GROUP_LABEL: Record<TimeGroup, string> = { new: 'New', today: 'Earlier today', week: 'This week', older: 'Older' };

/** Matches web's `getGroup` exactly (2h / 24h / 7d cutoffs in ms). */
export function getTimeGroup(iso: string): TimeGroup {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 7_200_000) return 'new';
  if (ms < 86_400_000) return 'today';
  if (ms < 604_800_000) return 'week';
  return 'older';
}

/** Matches web's sort: `action_required` first, then descending `priority`. */
export function sortNotifications(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort((a, b) => {
    if (a.action_required && !b.action_required) return -1;
    if (!a.action_required && b.action_required) return 1;
    return (b.priority ?? 0) - (a.priority ?? 0);
  });
}

/** Matches web's Digest view summary-sentence builder exactly, including reading `unread` off the
 * already-category-filtered `sorted` list while `matchCount` reads off the unfiltered `all` list —
 * a real asymmetry in web's own code, not a mobile mistake. */
export function buildDigestSummary(sorted: NotificationItem[], all: NotificationItem[]): string {
  const unreadCount = sorted.filter(n => !n.is_read).length;
  const needCount = sorted.filter(n => n.action_required).length;
  const matchCount = all.filter(n => isMatchType(n.type)).length;

  const bits: string[] = [];
  if (needCount) bits.push(`${needCount} thing${needCount !== 1 ? 's' : ''} need${needCount === 1 ? 's' : ''} your response`);
  if (matchCount) bits.push(`${matchCount} new match${matchCount !== 1 ? 'es' : ''}`);
  if (unreadCount) bits.push(`${unreadCount} unread`);

  if (!bits.length) return "You're all caught up — nothing urgent right now.";
  const joined = bits.length > 1 ? `${bits.slice(0, -1).join(', ')} and ${bits[bits.length - 1]}` : bits[0];
  return `You have ${joined}.`;
}
