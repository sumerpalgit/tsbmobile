import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Search, Users } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useMessageMutations } from '../hooks/useMessageMutations';
import { useDirectory } from '../hooks/useDirectory';
import { useDirectoryMutations } from '../hooks/useDirectoryMutations';
import { SearchBar } from '../components';
import { DirectoryHero } from '../components/directory/DirectoryHero';
import { RoleTypeChipsRow } from '../components/directory/RoleTypeChipsRow';
import { ActiveFilterPills } from '../components/directory/ActiveFilterPills';
import { MemberCard } from '../components/directory/MemberCard';
import { DirectoryFiltersPanel } from '../components/directory/DirectoryFiltersPanel';
import { DirectoryListSkeleton } from '../components/directory/MemberCardSkeleton';
import type { AppStackParamList, MainTabParamList } from '../navigation/types';
import type { Profile } from '../types/directory';

/** Directory — functionality from `webSrc/src/app/dashboard/directory/page.tsx`, UI from
 * `Directory.html`. See the plan for the full real↔mockup mismatch list (Connect/Follow omitted
 * from cards, fabricated fields dropped, sort simplified, Message routed through the app's real
 * Messages feature instead of a fake inline widget). No own header — `HomeScreen.tsx` (the other
 * real bottom tab) renders none either; the shared `TopBar` above covers it. */
export default function DirectoryScreen() {
  const { colors, fonts, fontSize, radius } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'Directory'>>();
  const stackNavigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'Directory'>>();
  const { startConversation } = useMessageMutations();

  const [groupId, setGroupId] = useState(route.params?.groupId);
  const [chapterName, setChapterName] = useState(route.params?.chapterName);

  // `route.params` only changes reference when navigated-to again with new params — a tab screen
  // stays mounted, so the `useState` initializers above only ever ran once. Without this, tapping
  // "View member directory" from a *second* ETA chapter in the same app session left Directory
  // scoped to whichever chapter was opened first.
  useEffect(() => {
    if (route.params?.groupId) {
      setGroupId(route.params.groupId);
      setChapterName(route.params.chapterName);
    }
  }, [route.params?.groupId, route.params?.chapterName]);

  const {
    profiles,
    pagination,
    stats,
    savedUsernames,
    setSavedUsernames,
    savedProfiles,
    setSavedProfiles,
    isLoadingSaved,
    refetchSaved,
    isLoading,
    isLoadingMore,
    loadMore,
    refetch,
    filters,
    setFilters,
    clearFilters,
    sort,
    setSort,
  } = useDirectory(groupId);
  const { toggleSave } = useDirectoryMutations(savedUsernames, setSavedUsernames, setSavedProfiles);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showingSaved, setShowingSaved] = useState(false);
  const [startingChatFor, setStartingChatFor] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Matches EtaChaptersScreen.tsx's own pull-to-refresh convention exactly — `refetch()` already
  // resets the page ref to 1 (same reset the "Load more" pagination advances from), so a pull
  // starts the list over from page 1 rather than just re-fetching whatever page was last loaded.
  const handleRefresh = () => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 600);
  };

  // Matches web's own active-filter count exactly (`page.tsx:1201`) — a typed search counts too,
  // not just the role/sub-category/city picks.
  const activeFilterCount = [filters.query.trim(), filters.roleType, filters.subCategory, filters.city].filter(
    Boolean,
  ).length;
  // "Saved members" is a real, independent list (`GET /saved-contacts`, via `savedProfiles`), not
  // the currently-loaded search page filtered down to saved usernames — a saved member outside
  // the loaded/filtered page still needs to show up here.
  const visibleProfiles = showingSaved ? savedProfiles : profiles;
  const listIsLoading = showingSaved ? isLoadingSaved : isLoading;

  const handleToggleSaved = () => {
    setShowingSaved(v => {
      const next = !v;
      if (next) refetchSaved();
      return next;
    });
  };

  const handleOpenProfile = (profile: Profile) => {
    stackNavigation.navigate('MemberProfile', { profile, initialSaved: savedUsernames.has(profile.username) });
  };

  const handleMessage = async (profile: Profile) => {
    if (startingChatFor) return;
    setStartingChatFor(profile.username);
    try {
      const conversationId = await startConversation({ username: profile.username, name: profile.name, profileImg: profile.profile_img });
      navigation.navigate('Messages', {
        openConversation: {
          id: conversationId,
          name: profile.name,
          profileImg: profile.profile_img ?? null,
          participantId: conversationId,
          unreadCount: 0,
        },
      });
    } catch {
      // startConversation's own mutation already surfaces a toast on failure.
    } finally {
      setStartingChatFor(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <FlatList
        // A fresh search/filter fetch keeps `isLoading` true while the *previous* results are
        // still sitting in `profiles` — without this, the old cards stay on screen until the new
        // ones silently swap in instead of showing a loading state. Forcing `data` empty while
        // loading routes through `ListEmptyComponent` below (the skeleton), same trick
        // `ConversationList.tsx` uses via an early-return.
        data={listIsLoading ? [] : visibleProfiles}
        keyExtractor={item => item.username}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}
        ListHeaderComponent={
          <View>
            <DirectoryHero
              totalCount={stats.all}
              savedCount={savedUsernames.size}
              showingSaved={showingSaved}
              onToggleSaved={handleToggleSaved}
              chapterName={chapterName}
              onClearChapter={() => {
                setGroupId(undefined);
                setChapterName(undefined);
              }}
            />
            <View style={styles.searchRow}>
              <SearchBar
                value={filters.query}
                onChangeText={q => setFilters({ query: q })}
                placeholder="Name, company or expertise…"
                onFilterPress={() => setFiltersOpen(true)}
                filterCount={activeFilterCount}
              />
            </View>
            <RoleTypeChipsRow roleType={filters.roleType} onChange={rt => setFilters({ roleType: rt, subCategory: null })} stats={stats} />
            {activeFilterCount > 0 && (
              <View style={styles.pillsRow}>
                <ActiveFilterPills
                  filters={filters}
                  onRemove={key => setFilters({ [key]: key === 'query' ? '' : null } as Partial<typeof filters>)}
                  onClearAll={clearFilters}
                />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <MemberCard
              profile={item}
              saved={savedUsernames.has(item.username)}
              onOpen={() => handleOpenProfile(item)}
              onToggleSave={() => toggleSave(item)}
              onMessage={() => handleMessage(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          listIsLoading ? (
            <DirectoryListSkeleton />
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWell, { backgroundColor: colors.chip, borderRadius: radius.xl }]}>
                {showingSaved ? <Users size={26} color={colors.goldDark} /> : <Search size={26} color={colors.goldDark} />}
              </View>
              <Text style={[fonts.bold, { fontSize: fontSize.title, color: colors.ink }]}>
                {showingSaved ? 'No saved members' : 'No members found'}
              </Text>
              <Text style={[fonts.regular, styles.emptyDesc, { fontSize: fontSize.body, color: colors.ink2 }]}>
                {showingSaved
                  ? 'You have not saved any members yet.'
                  : 'Try a different name, or clear your role and filter selections.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          !showingSaved && pagination?.hasNextPage ? (
            <Pressable
              onPress={loadMore}
              disabled={isLoadingMore}
              style={[styles.loadMoreButton, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, opacity: isLoadingMore ? 0.6 : 1 }]}
            >
              {isLoadingMore ? (
                <ActivityIndicator size="small" color={colors.gold} />
              ) : (
                <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink }]}>Load more members</Text>
              )}
            </Pressable>
          ) : null
        }
      />

      <DirectoryFiltersPanel
        visible={filtersOpen}
        filters={filters}
        sort={sort}
        stats={stats}
        onClose={() => setFiltersOpen(false)}
        onApply={(next, nextSort) => {
          setFilters(next);
          setSort(nextSort);
          setFiltersOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  pillsRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 2,
  },
  cardWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
    maxWidth: 230,
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
