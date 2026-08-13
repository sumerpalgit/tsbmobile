import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { DrawerActions, useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Search, Users } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useMessageMutations } from '../hooks/useMessageMutations';
import { useDirectory } from '../hooks/useDirectory';
import { useDirectoryMutations } from '../hooks/useDirectoryMutations';
import { SearchBar } from '../components';
import { DirectoryHeader } from '../components/directory/DirectoryHeader';
import { RoleTypeChipsRow } from '../components/directory/RoleTypeChipsRow';
import { ActiveFilterPills } from '../components/directory/ActiveFilterPills';
import { MemberCard } from '../components/directory/MemberCard';
import { DirectoryFiltersPanel } from '../components/directory/DirectoryFiltersPanel';
import { DirectoryListSkeleton, MemberCardSkeleton } from '../components/directory/MemberCardSkeleton';
import type { AppStackParamList, MainTabParamList } from '../navigation/types';
import type { Profile } from '../types/directory';

/** Directory — functionality from `webSrc/src/app/dashboard/directory/page.tsx`, UI from
 * `Directory.html`. See the plan for the full real↔mockup mismatch list (Connect/Follow omitted
 * from cards, fabricated fields dropped, sort simplified, Message routed through the app's real
 * Messages feature instead of a fake inline widget). Owns its own header (`DirectoryHeader`,
 * per a later reference screenshot superseding the mockup's own gradient hero) instead of the
 * shared `TopBar` — wired via `focusedTabName === 'Directory'` in `DrawerNavigator.tsx`, same
 * treatment as AI Assist/Messages/Profile. */
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
  // "Saved members" is still a real, independent list (`GET /saved-contacts`, via `savedProfiles`)
  // rather than the currently-loaded search page filtered down to saved usernames — a saved member
  // outside the loaded/filtered page still needs to show up here. But the role/sub-category/city/
  // query filters the user picked before switching to this view were being silently dropped (the
  // saved view showed *every* saved member regardless of the active filters) — applied client-side
  // here instead, since `/saved-contacts` has no filter params of its own to push this down to.
  const visibleProfiles = useMemo(() => {
    if (!showingSaved) return profiles;
    const q = filters.query.trim().toLowerCase();
    return savedProfiles.filter(p => {
      if (filters.roleType && p.role_type !== filters.roleType) return false;
      if (filters.subCategory && p.sub_category !== filters.subCategory) return false;
      if (
        filters.city &&
        !(p.city === filters.city.city && p.state_code === filters.city.stateCode && p.country_code === filters.city.countryCode)
      ) {
        return false;
      }
      if (q && !(p.name?.toLowerCase().includes(q) || p.bio?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [showingSaved, profiles, savedProfiles, filters]);
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
      <DirectoryHeader
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        savedCount={savedUsernames.size}
        showingSaved={showingSaved}
        onToggleSaved={handleToggleSaved}
      />
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
        // Infinite scroll — "Saved" is a fully-loaded local list (no real pagination), so this only
        // fires `loadMore()` for the normal search results; `loadMore` is itself a no-op once
        // `pagination.hasNextPage` is false, matching `MyResourcesScreen.tsx`'s same convention.
        onEndReached={() => {
          if (!showingSaved) loadMore();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View>
            {!!chapterName && (
              <Pressable
                onPress={() => {
                  setGroupId(undefined);
                  setChapterName(undefined);
                }}
                style={[styles.chapterChip, { backgroundColor: colors.chip, borderRadius: radius.lg }]}
              >
                <Text style={[fonts.semibold, styles.chapterChipText, { color: colors.ink2 }]}>Filtered to {chapterName} · tap to clear</Text>
              </Pressable>
            )}
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
          !showingSaved && isLoadingMore ? (
            <View style={styles.loadMoreFooter}>
              <MemberCardSkeleton />
            </View>
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
  chapterChip: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  chapterChipText: {
    fontSize: 11.5,
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
  loadMoreFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
