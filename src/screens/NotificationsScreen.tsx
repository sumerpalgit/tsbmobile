import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, Check, ListChecks, Trash2 } from 'lucide-react-native';
import { useTheme } from '../theme';
import { SearchBar } from '../components';
import { NotificationsHeader } from '../components/notifications/NotificationsHeader';
import { NotificationRow } from '../components/notifications/NotificationRow';
import { ConfirmDialog } from '../components/events/ConfirmDialog';
import { useNotificationMutations, useNotificationsList } from '../hooks/useNotifications';
import type { NotificationItem } from '../api/notifications';
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  GROUP_LABEL,
  GROUP_ORDER,
  buildDigestSummary,
  getNotificationDestination,
  getTimeGroup,
  matchesCategory,
  sortNotifications,
} from '../utils/notificationDisplay';
import type { NotificationCategory } from '../utils/notificationDisplay';
import type { AppStackParamList } from '../navigation/types';

type ViewMode = 'list' | 'action' | 'digest';

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: 'list', label: 'List' },
  { key: 'action', label: 'Needs response' },
  { key: 'digest', label: 'Digest' },
];

type Block =
  | { kind: 'header'; key: string; label: string; count: number; variant: 'plain' | 'pill'; action?: boolean }
  | { kind: 'row'; key: string; item: NotificationItem }
  | { kind: 'banner'; key: string }
  | { kind: 'digestHero'; key: string; summary: string };

function buildBlocks(viewMode: ViewMode, sorted: NotificationItem[], all: NotificationItem[]): Block[] {
  if (viewMode === 'action') {
    const needs = sorted.filter(n => n.action_required);
    const rest = sorted.filter(n => !n.action_required);
    const blocks: Block[] = [];
    if (needs.length === 0) blocks.push({ kind: 'banner', key: 'banner' });
    if (needs.length > 0) {
      blocks.push({ kind: 'header', key: 'needs-head', label: 'Needs your response', count: needs.length, variant: 'pill', action: true });
      needs.forEach(n => blocks.push({ kind: 'row', key: n.id, item: n }));
    }
    if (rest.length > 0) {
      blocks.push({ kind: 'header', key: 'activity-head', label: 'Activity', count: rest.length, variant: 'pill' });
      rest.forEach(n => blocks.push({ kind: 'row', key: n.id, item: n }));
    }
    return blocks;
  }

  if (viewMode === 'digest') {
    const priority = sorted.filter(n => n.action_required || (n.priority ?? 0) >= 7);
    const prioIds = new Set(priority.map(n => n.id));
    const rest = sorted.filter(n => !prioIds.has(n.id));
    const blocks: Block[] = [{ kind: 'digestHero', key: 'hero', summary: buildDigestSummary(sorted, all) }];
    if (priority.length > 0) {
      blocks.push({ kind: 'header', key: 'priority-head', label: 'Worth your attention', count: priority.length, variant: 'pill' });
      priority.forEach(n => blocks.push({ kind: 'row', key: n.id, item: n }));
    }
    if (rest.length > 0) {
      blocks.push({ kind: 'header', key: 'rest-head', label: 'Everything else', count: rest.length, variant: 'pill' });
      rest.forEach(n => blocks.push({ kind: 'row', key: n.id, item: n }));
    }
    return blocks;
  }

  // 'list' — grouped by time, plain (uncounted) section labels, matching web exactly.
  const blocks: Block[] = [];
  GROUP_ORDER.forEach(group => {
    const rows = sorted.filter(n => getTimeGroup(n.created_at) === group);
    if (!rows.length) return;
    blocks.push({ kind: 'header', key: `${group}-head`, label: GROUP_LABEL[group], count: rows.length, variant: 'plain' });
    rows.forEach(n => blocks.push({ kind: 'row', key: n.id, item: n }));
  });
  return blocks;
}

type ConfirmAction = { type: 'markAll' } | { type: 'clearAll' } | { type: 'delete'; id: string };

/** Notifications — ported to match `webSrc/app/dashboard/notifications/page.tsx` exactly (no
 * mobile mockup exists for this screen). Web's left rail (filter categories + Mark all/Clear all)
 * reflows into a horizontal chip row + action row here; its "action"/"digest" view content and
 * `getMessage`/`getUrl`/`timeAgo`/grouping logic are ported verbatim in `utils/notificationDisplay.ts`.
 * `comment`/`like`/`deal`/`community`/`event`/`post_recommendation` (feed post), `message`, and
 * `follow` taps are documented no-ops (mark-read only) until Phases 1–3 of the plan wire their real
 * destinations; `match_*` already navigates to `MyMatches` (today's placeholder) since that route
 * exists now. */
export default function NotificationsScreen() {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [category, setCategory] = useState<NotificationCategory>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { items: all, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = useNotificationsList(search);
  const mutations = useNotificationMutations();

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(value.trim()), 400);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchInput('');
    setSearch('');
  };

  const counts = useMemo(() => {
    const result = {} as Record<NotificationCategory, number>;
    CATEGORY_ORDER.forEach(cat => {
      result[cat] = all.filter(n => matchesCategory(n, cat)).length;
    });
    return result;
  }, [all]);

  const filtered = useMemo(() => all.filter(n => matchesCategory(n, category)), [all, category]);
  const sorted = useMemo(() => sortNotifications(filtered), [filtered]);
  const blocks = useMemo(() => buildBlocks(viewMode, sorted, all), [viewMode, sorted, all]);

  const mainTitle = viewMode === 'action' ? 'Needs response' : viewMode === 'digest' ? 'Smart digest' : CATEGORY_LABEL[category];

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const handleRowPress = useCallback(
    (item: NotificationItem) => {
      if (!item.is_read) mutations.markRead(item.id);
      const destination = getNotificationDestination(item);
      if (!destination) return;
      if (destination.kind === 'myMatches') {
        navigation.navigate('Drawer', { screen: 'MyMatches' });
      }
      // 'feedPost' / 'messages' / 'profile': no destination screen wired yet (Phases 1–3) — the
      // mark-read above already happened, matching web's own "mark read, then navigate if there's
      // somewhere to go" order.
    },
    [mutations, navigation],
  );

  const confirmCopy: { title: string; message: string; confirmLabel: string; destructive?: boolean } | null = confirmAction
    ? confirmAction.type === 'markAll'
      ? { title: 'Mark all as read?', message: 'Every notification in this list will be marked as read.', confirmLabel: 'Mark all read' }
      : confirmAction.type === 'clearAll'
        ? { title: 'Clear all notifications?', message: 'This cannot be undone.', confirmLabel: 'Clear all', destructive: true }
        : { title: 'Delete this notification?', message: 'This cannot be undone.', confirmLabel: 'Delete', destructive: true }
    : null;

  const runConfirmedAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'markAll') mutations.markAllRead();
    else if (confirmAction.type === 'clearAll') mutations.clearAll();
    else mutations.deleteNotification(confirmAction.id);
    setConfirmAction(null);
  };

  const emptyTitle = category === 'unread' ? 'All caught up' : 'Nothing here';
  const emptyBody =
    category === 'unread'
      ? 'You have no unread notifications. Nice work staying on top of things.'
      : `No ${CATEGORY_LABEL[category].toLowerCase()} right now.`;

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <NotificationsHeader
        onBack={() => navigation.goBack()}
        searchOpen={searchOpen}
        onToggleSearch={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
      />

      <FlatList
        data={isLoading && all.length === 0 ? [] : blocks}
        keyExtractor={block => block.key}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View>
            {searchOpen && (
              <View style={styles.searchWrap}>
                <SearchBar value={searchInput} onChangeText={handleSearchChange} placeholder="Search notifications…" />
              </View>
            )}

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={CATEGORY_ORDER}
              keyExtractor={cat => cat}
              contentContainerStyle={styles.chipsRow}
              renderItem={({ item: cat }) => {
                const active = category === cat;
                return (
                  <Pressable
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.chip,
                      {
                        borderRadius: radius.pill,
                        borderWidth: borderWidth.thin,
                        borderColor: active ? colors.gold : colors.border,
                        backgroundColor: active ? colors.chip : colors.surface,
                      },
                    ]}
                  >
                    <Text style={[active ? fonts.bold : fonts.semibold, styles.chipText, { color: active ? colors.goldDark : colors.ink2 }]}>
                      {CATEGORY_LABEL[cat]}
                    </Text>
                    <View style={[styles.chipCount, { backgroundColor: active ? colors.gold : colors.surfaceSunken }]}>
                      <Text style={[fonts.bold, styles.chipCountText, { color: active ? '#fff' : colors.ink3 }]}>{counts[cat]}</Text>
                    </View>
                  </Pressable>
                );
              }}
            />

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => setConfirmAction({ type: 'markAll' })}
                disabled={counts.unread === 0}
                style={[styles.actionRowButton, { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.md, opacity: counts.unread === 0 ? 0.4 : 1 }]}
              >
                <ListChecks size={13} color={colors.ink2} strokeWidth={1.8} />
                <Text style={[fonts.semibold, styles.actionRowText, { color: colors.ink2 }]}>Mark all as read</Text>
              </Pressable>
              <Pressable
                onPress={() => setConfirmAction({ type: 'clearAll' })}
                disabled={mutations.isClearingAll || all.length === 0}
                style={[styles.actionRowButton, { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.md, opacity: mutations.isClearingAll || all.length === 0 ? 0.4 : 1 }]}
              >
                <Trash2 size={13} color={colors.ink2} strokeWidth={1.8} />
                <Text style={[fonts.semibold, styles.actionRowText, { color: colors.ink2 }]}>
                  {mutations.isClearingAll ? 'Clearing…' : 'Clear all'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.columnHeader}>
              <Text style={[fonts.display, styles.mainTitle, { fontSize: 17, color: colors.ink }]}>{mainTitle}</Text>
              {!isLoading && (
                <Text style={[fonts.regular, styles.countLabel, { color: colors.ink3 }]}>
                  {sorted.length} {sorted.length === 1 ? 'notification' : 'notifications'}
                </Text>
              )}
              <View style={[styles.segmented, { backgroundColor: colors.surfaceSunken, borderRadius: radius.md }]}>
                {VIEW_MODES.map(mode => {
                  const active = viewMode === mode.key;
                  return (
                    <Pressable
                      key={mode.key}
                      onPress={() => setViewMode(mode.key)}
                      style={[styles.segmentButton, { borderRadius: radius.sm, backgroundColor: active ? colors.surface : 'transparent' }]}
                    >
                      <Text style={[fonts.semibold, styles.segmentText, { color: active ? colors.ink : colors.ink2 }]}>{mode.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {isLoading && all.length === 0 && (
              <View style={styles.skeletonWrap}>
                {[1, 2, 3, 4].map(i => (
                  <View key={i} style={[styles.skeletonRow, { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderRadius: radius.lg, borderWidth: borderWidth.thin }]}>
                    <View style={[styles.skeletonAvatar, { backgroundColor: colors.borderSoft }]} />
                    <View style={{ flex: 1, gap: 8, paddingTop: 3 }}>
                      <View style={[styles.skeletonLine, { backgroundColor: colors.borderSoft, width: '78%' }]} />
                      <View style={[styles.skeletonLine, { backgroundColor: colors.borderSoft, width: '38%', height: 8 }]} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        }
        renderItem={({ item: block }) => {
          switch (block.kind) {
            case 'header':
              return (
                <View style={styles.sectionHead}>
                  {block.variant === 'pill' ? (
                    <>
                      <View style={[styles.sectionIconWell, { backgroundColor: block.action ? colors.gold : colors.surfaceSunken, borderRadius: radius.sm }]}>
                        {block.action ? <Check size={12} color="#fff" strokeWidth={2} /> : null}
                      </View>
                      <Text style={[fonts.bold, styles.sectionLabel, { color: block.action ? colors.gold : colors.ink2 }]}>{block.label}</Text>
                      <View style={[styles.sectionCount, { backgroundColor: block.action ? colors.gold : colors.surfaceSunken }]}>
                        <Text style={[fonts.bold, styles.sectionCountText, { color: block.action ? '#fff' : colors.ink3 }]}>{block.count}</Text>
                      </View>
                    </>
                  ) : (
                    <Text style={[fonts.bold, styles.plainSectionLabel, { color: colors.ink3 }]}>{block.label}</Text>
                  )}
                </View>
              );
            case 'banner':
              return (
                <View style={[styles.banner, { backgroundColor: colors.successSurface, borderColor: colors.success, borderRadius: radius.md }]}>
                  <Check size={15} color={colors.success} strokeWidth={1.8} />
                  <Text style={[fonts.semibold, styles.bannerText, { color: colors.success }]}>Nothing needs your response right now.</Text>
                </View>
              );
            case 'digestHero':
              return (
                <View style={[styles.digestHero, { backgroundColor: colors.hero1, borderRadius: radius.lg }]}>
                  <View style={[styles.digestIconWell, { backgroundColor: colors.gold, borderRadius: radius.sm }]}>
                    <Bell size={16} color="#fff" strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[fonts.bold, styles.digestEyebrow, { color: colors.goldLight }]}>YOUR DIGEST</Text>
                    <Text style={[fonts.regular, styles.digestSummary, { color: '#fff' }]}>{block.summary}</Text>
                  </View>
                </View>
              );
            case 'row':
              return (
                <View style={styles.rowWrap}>
                  <NotificationRow
                    item={block.item}
                    onPress={() => handleRowPress(block.item)}
                    onDismiss={() => setConfirmAction({ type: 'delete', id: block.item.id })}
                    onAcceptInvite={() => mutations.acceptEtaInvite(block.item.id)}
                    onDeclineInvite={() => mutations.declineEtaInvite(block.item.id)}
                    etaInvitePending={
                      mutations.isAcceptingInvite && mutations.acceptingInviteId === block.item.id
                        ? 'accepting'
                        : mutations.isDecliningInvite && mutations.decliningInviteId === block.item.id
                          ? 'declining'
                          : 'idle'
                    }
                  />
                </View>
              );
            default:
              return null;
          }
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWell, { backgroundColor: colors.surfaceSunken, borderColor: colors.borderSoft, borderWidth: borderWidth.thin }]}>
                <Bell size={24} color={colors.gold} strokeWidth={1.8} />
              </View>
              <Text style={[fonts.display, { fontSize: 17, color: colors.ink }]}>{emptyTitle}</Text>
              <Text style={[fonts.regular, styles.emptyDesc, { fontSize: fontSize.body, color: colors.ink3 }]}>{emptyBody}</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <Text style={[fonts.regular, styles.loadingMore, { color: colors.ink3 }]}>Loading more…</Text>
          ) : null
        }
      />

      <ConfirmDialog
        visible={!!confirmAction}
        title={confirmCopy?.title ?? ''}
        message={confirmCopy?.message ?? ''}
        confirmLabel={confirmCopy?.confirmLabel ?? 'Confirm'}
        destructive={confirmCopy?.destructive}
        onConfirm={runConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 12,
  },
  chipCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCountText: {
    fontSize: 9.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  actionRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionRowText: {
    fontSize: 11.5,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  mainTitle: {
    letterSpacing: -0.2,
  },
  countLabel: {
    fontSize: 11.5,
  },
  segmented: {
    flexDirection: 'row',
    padding: 2,
    marginLeft: 'auto',
    gap: 1,
  },
  segmentButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  segmentText: {
    fontSize: 11,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionIconWell: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  sectionCountText: {
    fontSize: 9.5,
  },
  plainSectionLabel: {
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bannerText: {
    fontSize: 12,
    flex: 1,
  },
  digestHero: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  digestIconWell: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digestEyebrow: {
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 4,
  },
  digestSummary: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  rowWrap: {
    paddingHorizontal: 16,
  },
  skeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  skeletonAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 30,
    paddingVertical: 56,
  },
  emptyIconWell: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
  loadingMore: {
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: 16,
  },
});
