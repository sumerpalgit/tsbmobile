import { useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  acceptEtaInvite,
  clearAllNotifications,
  declineEtaInvite,
  deleteNotificationById,
  fetchMatchNotificationCounts,
  fetchNotificationsPage,
  fetchUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notifications';
import type { NotificationItem, NotificationsPage } from '../api/notifications';
import {
  NOTIFICATIONS_MATCH_COUNTS_QUERY_KEY,
  NOTIFICATIONS_QUERY_KEY,
  NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
} from '../api/queryKeys';

/** Matches web's `LIMIT = 20` (`notifications/page.tsx`). */
const PAGE_SIZE = 20;

type NotificationsInfiniteData = InfiniteData<NotificationsPage, number>;

function mapAllItems(
  old: NotificationsInfiniteData | undefined,
  mapper: (item: NotificationItem) => NotificationItem,
): NotificationsInfiniteData | undefined {
  if (!old) return old;
  return { ...old, pages: old.pages.map(page => ({ ...page, items: page.items.map(mapper) })) };
}

/** One tab's paginated list — `useInfiniteQuery` copied from `useMyActivity.ts`'s shape
 * (`getNextPageParam` off each page's own `hasNextPage`, cross-page id de-dupe). Keyed by search
 * term (`[...NOTIFICATIONS_QUERY_KEY, search]`), matching web's own server-side search (not a
 * client-side filter over one cache) — a new search term is a genuinely different paginated list. */
export function useNotificationsList(search: string) {
  const query = useInfiniteQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, search],
    queryFn: ({ pageParam }) => fetchNotificationsPage(pageParam, PAGE_SIZE, search),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => (lastPage.hasNextPage ? pages.length + 1 : undefined),
  });

  const items = useMemo(() => {
    const all = query.data?.pages.flatMap(page => page.items) ?? [];
    const seen = new Set<string>();
    return all.filter(item => (seen.has(item.id) ? false : (seen.add(item.id), true)));
  }, [query.data]);

  return { ...query, items };
}

/** Polled every 60s, matching web's `DashboardNavbar` — shared by every `TopBar` bell badge and
 * this screen's own header, all reading the one cached value. */
export function useNotificationsUnreadCount() {
  return useQuery({
    queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
  });
}

/** Feeds only the Notifications screen's collapsed "Matches" filter-chip count. */
export function useMatchNotificationCounts() {
  return useQuery({
    queryKey: NOTIFICATIONS_MATCH_COUNTS_QUERY_KEY,
    queryFn: fetchMatchNotificationCounts,
  });
}

/** Write operations for the Notifications screen — each patches the cached list(s) directly
 * (`setQueriesData` matches every cached search-term variant, not just the currently active one)
 * rather than invalidating-and-refetching, so a tap-to-read/dismiss/accept feels instant and
 * doesn't reset scroll position, matching web's own local `setData` patches. Unread-count is a
 * separate cached query, so it's invalidated (not patched) after anything that can change it. */
export function useNotificationMutations() {
  const queryClient = useQueryClient();

  const patchItem = (id: string, patch: Partial<NotificationItem>) => {
    queryClient.setQueriesData<NotificationsInfiniteData>({ queryKey: NOTIFICATIONS_QUERY_KEY }, old =>
      mapAllItems(old, item => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const invalidateUnreadCount = () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: (id: string) => patchItem(id, { is_read: true }),
    onSettled: invalidateUnreadCount,
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: () => {
      queryClient.setQueriesData<NotificationsInfiniteData>({ queryKey: NOTIFICATIONS_QUERY_KEY }, old =>
        mapAllItems(old, item => ({ ...item, is_read: true })),
      );
    },
    onSettled: invalidateUnreadCount,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotificationById,
    onMutate: (id: string) => {
      queryClient.setQueriesData<NotificationsInfiniteData>({ queryKey: NOTIFICATIONS_QUERY_KEY }, old => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            items: page.items.filter(item => item.id !== id),
            total: page.items.some(item => item.id === id) ? Math.max(0, page.total - 1) : page.total,
          })),
        };
      });
    },
    onSettled: invalidateUnreadCount,
  });

  const clearAllMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      queryClient.setQueriesData<NotificationsInfiniteData>({ queryKey: NOTIFICATIONS_QUERY_KEY }, old =>
        old ? { pages: [{ items: [], total: 0, hasNextPage: false }], pageParams: [1] } : old,
      );
      invalidateUnreadCount();
    },
  });

  // Matches web's real `handleAction("accept-invite", ...)` exactly: patches `is_read`/
  // `action_required` on success, shows an error message on failure (web uses `alert(...)`, this
  // uses `Toast` — this app's established substitute for a native browser alert).
  const acceptInviteMutation = useMutation({
    mutationFn: acceptEtaInvite,
    onSuccess: (_data, id) => patchItem(id, { is_read: true, action_required: false }),
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || err?.message || 'Could not accept invite.' });
    },
  });

  // Matches web's real `handleAction("decline-invite", ...)` exactly: errors are silently
  // swallowed (`catch {}`) — the local patch still applies regardless of whether the request
  // actually succeeded, a real (if imperfect) piece of web's own behavior, not a mobile bug.
  const declineInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await declineEtaInvite(id);
      } catch {
        // Intentionally swallowed — matches web exactly.
      }
    },
    onSuccess: (_data, id) => patchItem(id, { action_required: false }),
  });

  return {
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    isMarkingAllRead: markAllReadMutation.isPending,
    deleteNotification: deleteMutation.mutate,
    clearAll: clearAllMutation.mutate,
    isClearingAll: clearAllMutation.isPending,
    acceptEtaInvite: acceptInviteMutation.mutate,
    isAcceptingInvite: acceptInviteMutation.isPending,
    acceptingInviteId: acceptInviteMutation.variables,
    declineEtaInvite: declineInviteMutation.mutate,
    isDecliningInvite: declineInviteMutation.isPending,
    decliningInviteId: declineInviteMutation.variables,
  };
}
