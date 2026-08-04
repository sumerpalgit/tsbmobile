import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useTheme } from '../theme';
import { SearchBar } from '../components';
import { EMPTY_FILTERS, FilterPanel, FilterState, countActiveFilters } from '../components/home/FilterPanel';
import { ProfileCompletionCard } from '../components/home/ProfileCompletionCard';
import { FeedSkeleton } from '../components/home/FeedSkeleton';
import { PostCard } from '../components/home/PostCard';
import { useHomeFeed } from '../hooks/useHomeFeed';
import type { FeedItem } from '../api/feed';
import type { DrawerParamList, MainTabParamList } from '../navigation/types';

/** Ignores scroll jitter smaller than this (a stationary thumb still fires tiny deltas) so the
 * bars don't flicker on a near-still list. */
const SCROLL_DIRECTION_THRESHOLD = 12;

/**
 * Home — the real feed screen, matching the app bar/drawer reference (`TSB Home FV.html`)'s
 * Home tab: Search bar, Profile Completion card, then the feed itself. `FlatList` instead of
 * `ScrollView` — the feed is unbounded (paginated, `onEndReached` loads more), so it needs
 * virtualization; the search bar/profile card ride along as `ListHeaderComponent` instead of
 * sitting outside the list, so `contentContainerStyle`'s `gap` still spaces everything evenly.
 *
 * `filters`/`query` flow straight into `useHomeFeed`, which switches to `GET /api/feed/search`
 * once either is active — applying a filter or typing a search term actually changes what
 * renders, not just what's displayed as "active" on the search bar's filter button.
 *
 * `ListEmptyComponent` shows `FeedSkeleton` while `isLoading` (the very first fetch, no cached
 * data yet) — `FlatList` only renders it when `data` is empty, which is exactly that window —
 * so opening the app shows loading placeholders instead of a blank screen. Once real results (or
 * a genuine empty result) land, `isLoading` flips false and the skeleton is gone.
 *
 * Scrolling forward through the feed hides the bottom tab bar and the app bar (`TopBar`, owned
 * by `DrawerNavigator`) for a fuller view of the list; scrolling back toward the top brings both
 * back. Neither bar lives inside this screen, so this reaches them via React Navigation's own
 * `setOptions`/`getParent()` rather than a new shared state mechanism: `navigation.setOptions`
 * targets the bottom tab bar directly (this screen's own navigator), and `getParent()` reaches
 * one level up to `DrawerNavigator` for the header. This is a plain show/hide (no slide
 * animation) — React Navigation doesn't animate `tabBarStyle`/`headerShown` changes smoothly on
 * its own, and building a custom animated tab bar + header for that polish is a lot of
 * additional surface for a first pass.
 */
function HomeScreen() {
  const { colors, spacing, borderWidth } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const { items, engagements, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useHomeFeed(query, filters);

  const lastScrollY = useRef(0);
  const chromeHidden = useRef(false);

  const setChromeHidden = useCallback(
    (hidden: boolean) => {
      chromeHidden.current = hidden;
      navigation.setOptions({
        tabBarStyle: hidden
          ? { display: 'none' }
          : { backgroundColor: colors.surface, borderTopColor: colors.borderSoft, borderTopWidth: borderWidth.thin },
      });
      navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.setOptions({ headerShown: !hidden });
    },
    [navigation, colors.surface, colors.borderSoft, borderWidth.thin],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = e.nativeEvent.contentOffset.y;
      const delta = currentY - lastScrollY.current;

      if (currentY <= 0) {
        if (chromeHidden.current) setChromeHidden(false);
      } else if (delta > SCROLL_DIRECTION_THRESHOLD && !chromeHidden.current) {
        setChromeHidden(true);
      } else if (delta < -SCROLL_DIRECTION_THRESHOLD && chromeHidden.current) {
        setChromeHidden(false);
      }

      lastScrollY.current = currentY;
    },
    [setChromeHidden],
  );

  // Always land back on Home with both bars visible — e.g. after switching tabs mid-scroll,
  // rather than leaving them stuck hidden from a previous visit.
  useFocusEffect(
    useCallback(() => {
      setChromeHidden(false);
    }, [setChromeHidden]),
  );

  return (
    <>
      <FlatList<FeedItem>
        style={{ backgroundColor: colors.pageBg }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.lg }}
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PostCard feedItem={item} engagement={engagements[item.id]} />}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={isLoading ? <FeedSkeleton /> : null}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: spacing.lg }}>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search posts, members, deals…"
              onFilterPress={() => setFilterPanelOpen(true)}
              filtersActive={countActiveFilters(filters) > 0}
            />
            <ProfileCompletionCard onCompleteProfile={() => navigation.navigate('Profile')} />
          </View>
        }
      />

      <FilterPanel
        visible={filterPanelOpen}
        initialFilters={filters}
        onClose={() => setFilterPanelOpen(false)}
        onApply={next => {
          setFilters(next);
          setFilterPanelOpen(false);
        }}
      />
    </>
  );
}

export default HomeScreen;
