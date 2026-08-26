import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { Heart, MessageCircle, FileText, MousePointerClick, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useMe } from '../hooks/useMe';
import { useMyActivityTab, useMyActivityStats } from '../hooks/useMyActivity';
import { useFeedActions } from '../hooks/useFeedActions';
import { MyActivitiesHeader } from '../components/myActivity/MyActivitiesHeader';
import { ActivityHero } from '../components/myActivity/ActivityHero';
import {
  ActivityFilterPanel,
  ActivityFilters,
  DEFAULT_ACTIVITY_FILTERS,
  applyActivityFilters,
  countActiveActivityFilters,
} from '../components/myActivity/ActivityFilterPanel';
import { buildStatusBarSlot } from '../components/myActivity/ActivityCardWrapper';
import { ActivityMiniCard } from '../components/myActivity/cards/ActivityMiniCard';
import { RequestsSheet } from '../components/myActivity/RequestsSheet';
import { SentRequestSheet } from '../components/myActivity/SentRequestSheet';
import { FeedSkeleton } from '../components/home/FeedSkeleton';
import { CommentComposerSheet } from '../components/home/CommentComposerSheet';
import { JobApplyFormSheet } from '../components/home/JobApplyFormSheet';
import type { ActivityTab, MyActivityFeedItem } from '../api/myActivity';
import type { DrawerParamList } from '../navigation/types';

type TabDef = { key: ActivityTab; label: string; countKey: 'liked' | 'commented' | 'received' | 'sent' };

/** Order/labels match `webSrc/app/dashboard/my-activities/page.tsx`'s own `tab` array exactly.
 * No icons — the mockup's tab pills are plain text (`tsbTabsRow`), confirmed against a real
 * rendered screenshot. */
const TABS: TabDef[] = [
  { key: 'liked-posts', label: 'Liked Posts', countKey: 'liked' },
  { key: 'commented-posts', label: 'Commented Posts', countKey: 'commented' },
  { key: 'my-posts', label: 'Received Requests', countKey: 'received' },
  { key: 'interacted-posts', label: 'Sent Requests', countKey: 'sent' },
];

/** Exact copy from web's per-tab `EmptyState`. */
const EMPTY_COPY: Record<ActivityTab, { title: string; body: string; Icon: typeof Heart }> = {
  'my-posts': {
    title: 'No requests received yet',
    body: "When others send NDA or PPM requests on your posts, they'll appear here.",
    Icon: FileText,
  },
  'liked-posts': {
    title: 'No liked posts yet',
    body: 'Posts you like will appear here. Start exploring the feed to like posts.',
    Icon: Heart,
  },
  'commented-posts': {
    title: 'No commented posts yet',
    body: "Posts you've commented on will show up here.",
    Icon: MessageCircle,
  },
  'interacted-posts': {
    title: 'No sent requests yet',
    body: 'Your NDA requests, PPM applications, and job applications will appear here.',
    Icon: MousePointerClick,
  },
};

/**
 * My Activity — read-side screen shell (Phase 1). Functionality from
 * `webSrc/app/dashboard/my-activities/page.tsx` + its `components/activity/*`, UI chrome from the
 * mockup. "View Requests"/"View My Request" (the my-posts/interacted-posts status bars) toast
 * "Coming soon" for now — Phase 2/3 build the screens they'll navigate to.
 */
export default function MyActivitiesScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  const { data: me } = useMe();

  const [activeTab, setActiveTab] = useState<ActivityTab>('liked-posts');
  const [filters, setFilters] = useState<ActivityFilters>(DEFAULT_ACTIVITY_FILTERS);
  const [commentTargetId, setCommentTargetId] = useState<string | null>(null);
  const [jobApplyTarget, setJobApplyTarget] = useState<{ jobId: string; screeningQuestions: string[] } | null>(null);
  // Hidden/deleted via the card's own 3-dot menu — removed from view immediately, scoped to this
  // screen's own session (matches web's own `tsb:hidepost` handling: client-side only, no global
  // hidden-ids fetch built here — see `ActivityCardMenu.tsx`'s doc comment).
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const removeFromView = (feedId: string) => setRemovedIds(prev => new Set(prev).add(feedId));
  // "View Requests" (my-posts) / "View My Request" (interacted-posts) each open a request-detail
  // sheet for that post. Stored as just the id (not the item snapshot) so the sheet re-derives
  // fresh `interaction_details`/`recent_requesters` after a send-NDA/send-CIM/decline/withdraw/
  // sign mutation invalidates and refetches the tab — otherwise it'd keep showing the pre-action
  // status until closed and reopened.
  const [requestsSheetFeedId, setRequestsSheetFeedId] = useState<string | null>(null);
  const [sentRequestSheetFeedId, setSentRequestSheetFeedId] = useState<string | null>(null);

  const statsQuery = useMyActivityStats();
  const tabQuery = useMyActivityTab(activeTab);
  const requestsSheetItem = tabQuery.items.find(i => i.id === requestsSheetFeedId) ?? null;
  const sentRequestSheetItem = tabQuery.items.find(i => i.id === sentRequestSheetFeedId) ?? null;
  const feedActions = useFeedActions();

  // Refetches the active tab on every focus (drawer screens stay mounted across menu
  // navigations), same convention as `MyResourcesScreen.tsx`. Counts/stats intentionally do NOT
  // refetch here — matches web (see `useMyActivityStats`' doc comment).
  useFocusEffect(
    useCallback(() => {
      tabQuery.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]),
  );

  const counts = statsQuery.data?.counts ?? { liked: 0, commented: 0, received: 0, sent: 0 };
  const stats = statsQuery.data?.stats ?? null;
  const visibleItems = tabQuery.items.filter(item => !removedIds.has(item.id));
  const filteredItems = applyActivityFilters(visibleItems, filters, activeTab);
  // "Most popular" is client-side only (no server sort exists) — matches the mockup's own
  // `list.sort((x,y) => y.likes - x.likes)`. "Newest" keeps the server's own order.
  const items =
    filters.sort === 'popular'
      ? [...filteredItems].sort(
          (a, b) => (tabQuery.engagements[b.id]?.likes.count ?? 0) - (tabQuery.engagements[a.id]?.likes.count ?? 0),
        )
      : filteredItems;

  // The "N liked posts" label must show the tab's real total (from `/my-activity/counts`, stable
  // regardless of pagination) — using `items.length` showed only what's loaded so far, so it read
  // "8" on first open and silently grew to "18" once the user scrolled into page 2, which is
  // wrong. Falls back to the loaded+filtered count only once a filter/search is actually active,
  // since there's no server endpoint for "total matching this filter" to show instead.
  const hasActiveFilters = filters.search.trim() !== '' || countActiveActivityFilters(filters) > 0;
  const resultsCount = hasActiveFilters ? items.length : counts[TABS.find(t => t.key === activeTab)!.countKey];

  const emptyCopy = EMPTY_COPY[activeTab];
  const showEmpty = !tabQuery.isLoading && !tabQuery.isError && items.length === 0;
  const showError = !tabQuery.isLoading && tabQuery.isError && tabQuery.items.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <MyActivitiesHeader onMenuPress={() => navigation.openDrawer()} />

      <FlatList<MyActivityFeedItem>
        style={{ backgroundColor: colors.pageBg }}
        contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.lg }}
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const onViewRequestsOrRequest =
            activeTab === 'my-posts' ? () => setRequestsSheetFeedId(item.id) : () => setSentRequestSheetFeedId(item.id);
          return (
            <View style={{ paddingHorizontal: spacing.md }}>
              <ActivityMiniCard
                item={item}
                engagement={tabQuery.engagements[item.id]}
                currentUsername={me?.username}
                activeTab={activeTab}
                onLike={() => feedActions.toggleLike(item.id)}
                onComment={() => setCommentTargetId(item.id)}
                onViewRequests={onViewRequestsOrRequest}
                onViewRequest={onViewRequestsOrRequest}
                requestDealNda={() => feedActions.requestDealNdaAsync({ dealId: item.item_id, feedId: item.id })}
                requestPpm={() => feedActions.requestPpmAsync({ searchCapitalId: item.item_id, feedId: item.id })}
                handleInvestorCornerAction={() =>
                  feedActions.handleInvestorCornerActionAsync({
                    item: item.item as any,
                    investorCornerId: item.item_id,
                    feedId: item.id,
                  })
                }
                submitRsvp={() => feedActions.submitRsvpAsync(item.item_id)}
                submitPollVote={optionIndex => feedActions.submitPollVote({ pollId: item.item_id, optionIndex, feedId: item.id })}
                openJobApply={() =>
                  setJobApplyTarget({ jobId: item.item_id, screeningQuestions: (item.item as any).screening_questions ?? [] })
                }
                statusBarSlot={buildStatusBarSlot(activeTab, item, onViewRequestsOrRequest)}
                onHide={() => removeFromView(item.id)}
                onDeleted={() => removeFromView(item.id)}
              />
            </View>
          );
        }}
        onEndReached={() => {
          if (tabQuery.hasNextPage && !tabQuery.isFetchingNextPage) tabQuery.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: spacing.md }}>
            {tabQuery.isLoading ? (
              <FeedSkeleton />
            ) : showError ? (
              <ErrorState onRetry={() => tabQuery.refetch()} />
            ) : showEmpty ? (
              <EmptyState title={emptyCopy.title} body={emptyCopy.body} Icon={emptyCopy.Icon} />
            ) : null}
          </View>
        }
        ListFooterComponent={
          tabQuery.isFetchingNextPage ? (
            <View style={{ paddingVertical: spacing.lg }}>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : !tabQuery.hasNextPage && items.length > 0 ? (
            <Text style={[styles.endOfList, { color: colors.ink3 }]}>You've reached the end</Text>
          ) : null
        }
        ListHeaderComponent={
          <View>
            <ActivityHero activeTab={activeTab} tabStats={stats} tabCounts={counts} />

            <View style={{ gap: spacing.md, padding: spacing.md }}>
              <TabRow activeTab={activeTab} counts={counts} onChange={setActiveTab} />

              <ActivityFilterPanel
                activeTab={activeTab}
                filters={filters}
                onChange={setFilters}
                onClear={() => setFilters(DEFAULT_ACTIVITY_FILTERS)}
                resultsCount={resultsCount}
              />
            </View>
          </View>
        }
      />

      <CommentComposerSheet
        visible={commentTargetId !== null}
        onClose={() => setCommentTargetId(null)}
        submitting={feedActions.isPostingComment}
        onSubmit={content => {
          if (!commentTargetId) return;
          feedActions.postComment({ feedId: commentTargetId, content });
          setCommentTargetId(null);
        }}
      />

      <RequestsSheet visible={requestsSheetFeedId !== null} item={requestsSheetItem} onClose={() => setRequestsSheetFeedId(null)} />

      <SentRequestSheet visible={sentRequestSheetFeedId !== null} item={sentRequestSheetItem} onClose={() => setSentRequestSheetFeedId(null)} />

      <JobApplyFormSheet
        visible={jobApplyTarget !== null}
        jobId={jobApplyTarget?.jobId ?? null}
        screeningQuestions={jobApplyTarget?.screeningQuestions ?? []}
        onClose={() => setJobApplyTarget(null)}
        submitting={feedActions.isSubmittingJobApplication}
        onSubmit={async args => {
          try {
            await feedActions.submitJobApplication(args);
            setJobApplyTarget(null);
          } catch {
            // Toast already shown by the mutation's onError — keep the sheet open to retry.
          }
        }}
      />
    </View>
  );
}

/** Pill-shaped tab buttons — matches the mockup exactly (`tsbTabsRow`): filled navy when active,
 * outlined white when not, no icons, horizontally scrollable. A small gold dot (not a count
 * badge) appears next to "Received Requests" only when there's a pending request
 * (`hasDot: t.key === 'received' && receivedTotalRequests > 0` in `my_activities_decoded.html`). */
function TabRow({
  activeTab,
  counts,
  onChange,
}: {
  activeTab: ActivityTab;
  counts: Record<TabDef['countKey'], number>;
  onChange: (tab: ActivityTab) => void;
}) {
  const { colors, fonts } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
      {TABS.map(tab => {
        const selected = tab.key === activeTab;
        const showDot = tab.key === 'my-posts' && counts.received > 0;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.tabPill,
              selected
                ? { backgroundColor: colors.accentSolid }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <Text style={[fonts.bold, styles.tabLabel, { color: selected ? '#fff' : colors.ink2 }]} numberOfLines={1}>
              {tab.label}
            </Text>
            {showDot && <View style={[styles.tabDot, { backgroundColor: colors.goldLight }]} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function EmptyState({ title, body, Icon }: { title: string; body: string; Icon: typeof Heart }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[styles.stateBox, { borderColor: colors.border }]}>
      <Icon size={26} color={colors.ink3} strokeWidth={1.5} />
      <Text style={[fonts.bold, styles.stateTitle, { color: colors.ink }]}>{title}</Text>
      <Text style={[fonts.regular, styles.stateBody, { color: colors.ink3 }]}>{body}</Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { colors, fonts, radius } = useTheme();
  return (
    <View style={[styles.stateBox, { borderColor: colors.border }]}>
      <RefreshCw size={24} color={colors.ink3} strokeWidth={1.5} />
      <Text style={[fonts.bold, styles.stateTitle, { color: colors.ink }]}>Couldn't load your activity</Text>
      <Text style={[fonts.regular, styles.stateBody, { color: colors.ink3 }]}>
        The request timed out or the server didn't respond. Your data is safe — please try again.
      </Text>
      <Pressable onPress={onRetry} style={[styles.retryButton, { backgroundColor: colors.gold, borderRadius: radius.lg }]}>
        <Text style={[fonts.bold, styles.retryText]}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: 7,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  tabLabel: {
    fontSize: 12,
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  endOfList: {
    textAlign: 'center',
    fontSize: 11.5,
    paddingVertical: 20,
  },
  stateBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  stateTitle: {
    fontSize: 14,
    marginTop: 4,
  },
  stateBody: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  retryButton: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  retryText: {
    fontSize: 12.5,
    color: '#fff',
  },
});
