import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Keyboard, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const { items: fetchedItems, engagements, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, resetAndRefetch } = useUserFeed(username);

  // Same fix as `CreateEventWizard.tsx`'s scroll-to-focused-field mechanism (see its own doc
  // comment for the full root-cause writeup), adapted for `FlatList` instead of `ScrollView`
  // (`scrollToOffset` in place of `scrollTo`) — this list has no `KeyboardAvoidingView`/
  // auto-scroll of its own, so the search bar (sitting inside `ListHeaderComponent`, below the
  // identity block) had nothing pushing it above the keyboard when focused.
  //
  // Measures `searchBarWrapRef` (the `View` wrapping the whole `SearchBar`), NOT the `TextInput`
  // itself — first attempt measured the input and its bottom border still ended up clipped by the
  // keyboard, because the input's own tight bounding box doesn't include `SearchBar`'s pill
  // padding/border/shadow, which live in its wrapping `View`. Measuring that wrapper instead
  // gives the real visual height of the bar, border and all.
  const listRef = useRef<FlatList<FeedItem>>(null);
  const scrollOffsetRef = useRef(0);
  const searchInputRef = useRef<TextInput>(null);
  const searchBarWrapRef = useRef<View>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      const wrap = searchBarWrapRef.current;
      if (!wrap || !searchInputRef.current?.isFocused()) return;
      requestAnimationFrame(() => {
        wrap.measureInWindow((_x, y, _width, height) => {
          const keyboardTop = Dimensions.get('window').height - (e.endCoordinates?.height ?? 0);
          const overlap = y + height - keyboardTop;
          if (overlap > 0) {
            listRef.current?.scrollToOffset({ offset: scrollOffsetRef.current + overlap + 12, animated: true });
          }
        });
      });
    });
    return () => showSub.remove();
  }, []);

  // Covers both "Hide this post" (session-only, no backend call — matches web's own client-side-
  // only `tsb:hidepost` event) and "Delete post" (already persisted server-side by the time this
  // runs) — same local removal either way, just a different trigger.
  const removePost = (id: string) => setRemovedIds(prev => new Set(prev).add(id));

  /** Delete specifically ALSO re-syncs with the server, confirmed by watching web's own network
   * tab on this exact page: after the `DELETE /feed/delete/:id` call, web fires a real follow-up
   * `GET` to the feed-list endpoint (not just an engagements refresh — direct on-device
   * confirmation, since this wasn't traceable from `my-profile/page.tsx`'s own source alone).
   * `removePost` still runs first for the instant, snappy UI update; `refetch()` runs silently
   * after (no `refreshing`/spinner state — this isn't the pull-to-refresh gesture, just a quiet
   * background re-sync, matching web's own behavior). "Hide" stays local-only on purpose — see
   * `PostCardMenuSheet.tsx`'s own doc comment: web's real Hide has no backend call at all. */
  const handleDeleted = (id: string) => {
    removePost(id);
    refetch();
  };

  /** Uses `resetAndRefetch`, NOT the plain `refetch` — a plain `refetch()` on an infinite query
   * re-fetches every currently-loaded page, preserving however deep the user had scrolled, which
   * isn't what a pull-to-refresh gesture should do. `resetAndRefetch` clears the cached pages
   * first so this genuinely starts over from page 1. Awaited (in a `try/finally`) rather than the
   * fire-and-forget-plus-fixed-timeout pattern `MyEventsScreen.tsx` uses elsewhere, so the
   * spinner actually tracks the real network call instead of guessing how long it takes.
   * Locally-hidden/deleted posts (`removedIds`) intentionally stay hidden through a refresh — a
   * pull-to-refresh re-fetches what the SERVER has, it doesn't undo a client-side hide or bring
   * back a post that was just deleted. */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await resetAndRefetch();
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

  /** Clearing the search box jumps `filtered` straight from a short, filtered array back to the
   * full loaded list in one synchronous render — on a list with enough posts, `FlatList` mounting
   * a much bigger batch of rows in that single frame reads as a brief freeze (nothing visibly
   * responds to the clear for a moment) before the full list finally appears. Masking that one
   * frame with the same `FeedSkeleton` already used for the initial load/pagination gives instant
   * visual feedback the instant the box clears, while the heavier full-list render happens behind
   * it — same technique, just triggered by a different transition. Scoped to specifically the
   * searching→not-searching transition (not typing in general), since typing itself only narrows
   * an already-small filtered set, which never has the same jump in row count. */
  const [clearingSearch, setClearingSearch] = useState(false);
  const wasSearchingRef = useRef(isSearching);
  useEffect(() => {
    if (wasSearchingRef.current && !isSearching) {
      setClearingSearch(true);
      const timer = setTimeout(() => setClearingSearch(false), 260);
      wasSearchingRef.current = isSearching;
      return () => clearTimeout(timer);
    }
    wasSearchingRef.current = isSearching;
  }, [isSearching]);

  return (
    <FlatList<FeedItem>
      ref={listRef}
      style={{ backgroundColor: colors.pageBg }}
      contentContainerStyle={styles.content}
      data={clearingSearch ? [] : filtered}
      keyExtractor={item => item.id}
      keyboardShouldPersistTaps="handled"
      onScroll={e => {
        scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      // Padded individually per-row (not via the FlatList's own contentContainerStyle) so
      // `listHeaderComponent` — the identity block's full-bleed cover gradient — isn't inset too.
      renderItem={({ item }) => (
        <View style={styles.rowPadding}>
          <ViewProfilePostCard
            feedItem={item}
            engagement={engagements[item.id]}
            onHide={() => removePost(item.id)}
            onDeleted={() => handleDeleted(item.id)}
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
          <View style={styles.searchBarWrap} ref={searchBarWrapRef}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search posts by keyword or author…"
              inputRef={searchInputRef}
            />
          </View>
        </>
      }
      ListEmptyComponent={
        isLoading || clearingSearch ? (
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
