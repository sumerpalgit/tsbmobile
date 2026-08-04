import React, { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';
import { SearchBar } from '../components';
import { EMPTY_FILTERS, FilterPanel, FilterState, countActiveFilters } from '../components/home/FilterPanel';
import { ProfileCompletionCard } from '../components/home/ProfileCompletionCard';
import { PostCard } from '../components/home/PostCard';
import { useHomeFeed } from '../hooks/useHomeFeed';
import type { FeedItem } from '../api/feed';
import type { MainTabParamList } from '../navigation/types';

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
 */
function HomeScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const { items, engagements, fetchNextPage, hasNextPage, isFetchingNextPage } = useHomeFeed(query, filters);

  return (
    <>
      <FlatList<FeedItem>
        style={{ backgroundColor: colors.pageBg }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.lg }}
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PostCard feedItem={item} engagement={engagements[item.id]} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
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
