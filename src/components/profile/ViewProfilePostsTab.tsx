import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { SearchBar } from '../SearchBar';
import { ViewProfilePostCard } from './postCard/ViewProfilePostCard';
import { FeedSkeleton } from '../home/FeedSkeleton';
import { useUserFeed } from '../../hooks/useUserFeed';
import type { FeedItem } from '../../api/feed';

/** No uniform "title" field exists across `FeedItemData`'s 8 variants (`question_title`,
 * `question`, `title`, `role_title`, `post_title`, `investment_mandate_title` — each type names
 * it differently), so the client-side search filter needs an explicit switch rather than a loose
 * `'title' in item` guess. */
function feedItemTitle(item: FeedItem): string {
  switch (item.feed_type) {
    case 'atc':
      return item.item.question_title;
    case 'poll':
      return item.item.question;
    case 'event':
      return item.item.title;
    case 'job':
      return item.item.role_title;
    case 'deal':
    case 'search_capital':
    case 'find_a_connection':
      return item.item.post_title;
    case 'investor_corner':
      return item.item.investment_mandate_title;
    default:
      return '';
  }
}

/**
 * View Profile's Posts tab — Phase 3 of the plan. Own component/data-fetch, same reasoning as
 * `ViewProfileOverviewTab.tsx`: only fetches once this tab is actually active.
 *
 * Card rendering — CORRECTED (2026-08-20) to a dedicated `ViewProfilePostCard`
 * (`./postCard/ViewProfilePostCard.tsx`), NOT the Home feed's `PostCard`. An earlier version
 * reused `PostCard` verbatim on the wrong assumption that it's "the same card family" — it isn't:
 * `PostCard` matches web's big, action-heavy `FeedItemCard` (quick-profile overlay, per-type CTA
 * buttons like "Apply Now"/RSVP), which web's OWN Posts tab doesn't even use — it renders distinct
 * compact "mini-cards" instead. `ViewProfilePostCard` matches the mockup's own decoded Posts-tab
 * markup exactly (gradient hero, kindLabel eyebrow, stats footer, like/comment/owner-label
 * footer); its per-type content (kindLabel/stats) is pulled from web's real mini-card components,
 * confirmed via direct research — see `postCardContent.ts`'s own doc comment.
 *
 * Functionality is READ-ONLY, matching this app's own current ceiling: web's real Posts tab wires
 * real delete/like/comment/RSVP/vote/NDA-request actions via a shared `useFeedActions` hook, but
 * NONE of those are wired anywhere in this app yet — not even on the Home feed itself
 * (`HomeScreen.tsx` renders `PostCard` with every action callback left `undefined`). Building them
 * here first would be inventing a whole new interaction system out of scope for View Profile, not
 * filling a gap specific to this tab — so this stays at parity with the rest of the app. Likes/
 * comments ARE real counts (`engagements[item.id]`, same envelope `fetchFeed` already returns) —
 * only the ACTIONS (tap to like/comment) are unbuilt, the numbers themselves aren't fabricated.
 *
 * Pagination is `FlatList` + `onEndReached` infinite scroll (`useUserFeed`, mirrors
 * `useHomeFeed`'s shape), NOT web's real page-number Previous/Next bar and NOT the mockup's
 * static no-pagination demo list — neither source actually specifies a real mobile pagination UI
 * (web's is a desktop pattern, the mockup's absence is just because its data is a hardcoded
 * array), so this follows the app's own already-established convention for identical content
 * (the Home feed) instead of inventing a third approach.
 *
 * Search is a pure CLIENT-SIDE filter over already-loaded posts (title/author), matching BOTH
 * sources: the mockup's own search is a client-side filter over static demo data, and web's real
 * `postSearch` state also filters "client-side over the already-fetched page" per direct research
 * — its backend endpoint has no query-string search param. Not sending a search request to the
 * server is therefore correct, not a shortcut.
 */
export function ViewProfilePostsTab({
  username,
  listHeaderComponent,
}: {
  username: string;
  /** The identity block + tab bar `ViewProfileScreen` normally scrolls above the active tab's
   * content — this tab is a `FlatList`, not the `ScrollView`/`KeyboardAwareScrollView` the other
   * tabs render inside, so it needs that content passed in as its own header rather than sitting
   * in an outer scroll container (nesting a `FlatList` inside a `ScrollView` breaks
   * virtualization and is an RN anti-pattern). */
  listHeaderComponent?: React.ReactElement;
}) {
  const { colors, fonts } = useTheme();
  const [query, setQuery] = useState('');
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const { items: fetchedItems, engagements, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useUserFeed(username);

  // Covers both "Hide this post" (session-only, no backend call — matches web's own client-side-
  // only `tsb:hidepost` event) and "Delete post" (already persisted server-side by the time this
  // runs) — same local removal either way, just a different trigger.
  const removePost = (id: string) => setRemovedIds(prev => new Set(prev).add(id));

  /** `refetch` comes straight from `useUserFeed`'s underlying `useInfiniteQuery` (spread through
   * unchanged) — awaited here rather than the fire-and-forget-plus-fixed-timeout pattern
   * `MyEventsScreen.tsx` uses elsewhere, so the spinner actually tracks the real network call
   * instead of guessing how long it takes. Locally-hidden/deleted posts (`removedIds`) intentionally
   * stay hidden through a refresh — a pull-to-refresh re-fetches what the SERVER has, it doesn't
   * undo a client-side hide or bring back a post that was just deleted. */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const items = fetchedItems.filter(item => !removedIds.has(item.id));
  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? items.filter(
        item => feedItemTitle(item).toLowerCase().includes(trimmed) || item.profile.name.toLowerCase().includes(trimmed),
      )
    : items;

  const isSearching = trimmed.length > 0;

  return (
    <FlatList<FeedItem>
      style={{ backgroundColor: colors.pageBg }}
      contentContainerStyle={styles.content}
      data={filtered}
      keyExtractor={item => item.id}
      // Padded individually per-row (not via the FlatList's own contentContainerStyle) so
      // `listHeaderComponent` — the identity block's full-bleed cover gradient — isn't inset too.
      renderItem={({ item }) => (
        <View style={styles.rowPadding}>
          <ViewProfilePostCard
            feedItem={item}
            engagement={engagements[item.id]}
            onHide={() => removePost(item.id)}
            onDeleted={() => removePost(item.id)}
          />
        </View>
      )}
      onEndReached={() => {
        if (!isSearching && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.4}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}
      ListHeaderComponent={
        <>
          {listHeaderComponent}
          <View style={styles.searchBarWrap}>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search posts by keyword or author…" />
          </View>
        </>
      }
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.rowPadding}>
            <FeedSkeleton />
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Search size={22} color={colors.ink3} strokeWidth={1.6} />
            <Text style={[fonts.semibold, styles.emptyTitle, { color: colors.ink2 }]}>
              {isSearching ? 'No posts match your search.' : 'No posts from this user yet.'}
            </Text>
            {isSearching && (
              <Text style={[fonts.regular, styles.emptySubtitle, { color: colors.ink3 }]}>
                Try a different keyword or clear the search.
              </Text>
            )}
          </View>
        )
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.rowPadding}>
            <FeedSkeleton count={2} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28, gap: 16, flexGrow: 1 },
  searchBarWrap: { paddingHorizontal: 16, paddingTop: 16 },
  rowPadding: { paddingHorizontal: 16 },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 13.5, textAlign: 'center' },
  emptySubtitle: { fontSize: 12, textAlign: 'center' },
});
