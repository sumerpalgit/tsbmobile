import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { Bookmark, Search } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../theme';
import { useResources } from '../hooks/useResources';
import { useSavedResources } from '../hooks/useSavedResources';
import { trackDownload, trackView } from '../api/resources';
import { ResourcesHeader } from '../components/resources/ResourcesHeader';
import { ResourcesHero } from '../components/resources/ResourcesHero';
import { ResourceSegmentedTabs } from '../components/resources/ResourceSegmentedTabs';
import { ResourceSearchBar } from '../components/resources/ResourceSearchBar';
import { ResourceCard } from '../components/resources/ResourceCard';
import { ResourceListSkeleton } from '../components/resources/ResourceCardSkeleton';
import { ResourceFiltersPanel } from '../components/resources/ResourceFiltersPanel';
import { ContributeResourceSheet } from '../components/resources/ContributeResourceSheet';
import type { DrawerParamList } from '../navigation/types';
import type { ResourceItem } from '../types/resources';

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** My Resources — functionality from `webSrc/src/app/dashboard/my-resources/page.tsx` +
 * `src/actions/my-resources.ts`, UI from `Resources.html`. See the plan for the full
 * real↔mockup mismatch list (single-select filters, local-only save via `AsyncStorage`, Trending/
 * Popular topics omitted — no mockup design). Owns its own header (`ResourcesHeader`) instead of
 * the shared `TopBar`, same precedent as My Events/ETA Chapters/Messages/AI Assist. */
export default function MyResourcesScreen() {
  const { colors, fonts, fontSize, radius } = useTheme();
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

  const {
    resources,
    pagination,
    myStats,
    isLoading,
    isLoadingMore,
    loadMore,
    refetch,
    refetchMyStats,
    incrementViewCount,
    incrementDownloadCount,
    filters,
    setFilters,
  } = useResources();
  const { savedResources, savedIds, toggleSave, isLoaded: savedLoaded } = useSavedResources();

  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filtersActive = !!(filters.contentType || filters.authorType || filters.dateRange);
  const visibleResources = activeTab === 'saved' ? savedResources : resources;
  const listIsLoading = activeTab === 'saved' ? !savedLoaded : isLoading;

  const handleRefresh = () => {
    setRefreshing(true);
    refetch();
    refetchMyStats();
    setTimeout(() => setRefreshing(false), 600);
  };

  // Matches web's real `handleView` (`page.tsx:493-499`) exactly: a local +1 off the previous
  // count once `trackView` resolves and isn't `skipped` — web ignores the response's own
  // `viewCount` field entirely, so this does too (see `incrementViewCount`).
  const handleOpen = (item: ResourceItem) => {
    const url = item.resource_link || item.file_url;
    if (url) {
      Linking.openURL(normalizeUrl(url)).catch(() => Toast.show({ type: 'error', text1: 'Could not open this resource' }));
    }
    trackView(item.id)
      .then(res => {
        if (!res?.skipped) incrementViewCount(item.id);
      })
      .catch(() => {});
  };

  // Matches web's real `handleDownload` (`page.tsx:501-514`) exactly: only opens + increments
  // (local +1, not the response's `downloadCount`) when the *successful* response actually
  // carries a `fileUrl` — a success with no `fileUrl` does nothing, same as web. The
  // `item.file_url` fallback only applies when the request itself throws (the `catch` below),
  // not merely when `fileUrl` is missing from a successful response.
  const handleDownload = (item: ResourceItem) => {
    trackDownload(item.id)
      .then(res => {
        if (res?.fileUrl) {
          Linking.openURL(res.fileUrl).catch(() => {});
          if (!res?.skipped) incrementDownloadCount(item.id);
        }
      })
      .catch(() => {
        if (item.file_url) Linking.openURL(item.file_url).catch(() => {});
      });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <ResourcesHeader onMenuPress={() => navigation.openDrawer()} onContributePress={() => setContributeOpen(true)} />

      <FlatList
        data={listIsLoading ? [] : visibleResources}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          activeTab === 'all' ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} /> : undefined
        }
        ListHeaderComponent={
          <View>
            <ResourcesHero stats={myStats} />
            <View style={styles.controlsRow}>
              {searchOpen ? (
                <ResourceSearchBar
                  value={filters.query}
                  onChangeText={q => setFilters({ query: q })}
                  onDone={() => {
                    setSearchOpen(false);
                    setFilters({ query: '' });
                  }}
                />
              ) : (
                <ResourceSegmentedTabs
                  activeTab={activeTab}
                  onChangeTab={setActiveTab}
                  totalCount={pagination?.totalItems ?? null}
                  savedCount={savedResources.length}
                  onOpenSearch={() => setSearchOpen(true)}
                  onOpenFilters={() => setFiltersOpen(true)}
                  filtersActive={filtersActive}
                />
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ResourceCard
              item={item}
              saved={savedIds.has(item.id)}
              onOpen={() => handleOpen(item)}
              onToggleSave={() => toggleSave(item)}
              onDownload={() => handleDownload(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          listIsLoading ? (
            <ResourceListSkeleton />
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWell, { backgroundColor: colors.chip, borderRadius: radius.xl }]}>
                {activeTab === 'saved' ? <Bookmark size={26} color={colors.goldDark} /> : <Search size={26} color={colors.goldDark} />}
              </View>
              <Text style={[fonts.display, { fontSize: 17, color: colors.ink }]}>
                {activeTab === 'saved' ? 'No saved resources yet' : 'No resources found'}
              </Text>
              <Text style={[fonts.regular, styles.emptyDesc, { fontSize: fontSize.body, color: colors.ink3 }]}>
                {activeTab === 'saved'
                  ? 'Bookmark resources from the All Resources tab to find them here.'
                  : 'Nothing matches your filters. Try a different search or category.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          activeTab === 'all' && pagination?.hasNextPage ? (
            <Pressable
              onPress={loadMore}
              disabled={isLoadingMore}
              style={[styles.loadMoreButton, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, opacity: isLoadingMore ? 0.6 : 1 }]}
            >
              {isLoadingMore ? (
                <ActivityIndicator size="small" color={colors.gold} />
              ) : (
                <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink }]}>Load more resources</Text>
              )}
            </Pressable>
          ) : null
        }
      />

      <ResourceFiltersPanel
        visible={filtersOpen}
        filters={filters}
        resultCount={null}
        onClose={() => setFiltersOpen(false)}
        onApply={next => {
          setFilters(next);
          setFiltersOpen(false);
        }}
      />

      <ContributeResourceSheet visible={contributeOpen} onClose={() => setContributeOpen(false)} onSuccess={refetch} />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
  },
  controlsRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  cardWrap: {
    paddingHorizontal: 16,
    paddingTop: 11,
  },
  emptyState: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 30,
    paddingVertical: 48,
  },
  emptyIconWell: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
  },
  loadMoreButton: {
    height: 48,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
