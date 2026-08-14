import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Megaphone, Plus, Search } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useAdCampaigns } from '../hooks/useAdCampaigns';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { AdKpiStrip } from '../components/adManagement/AdKpiStrip';
import { AdStatusChipsRow } from '../components/adManagement/AdStatusChipsRow';
import { AdCampaignCard } from '../components/adManagement/AdCampaignCard';
import { AdCampaignListSkeleton } from '../components/adManagement/AdCampaignCardSkeleton';
import { AdFiltersPanel } from '../components/adManagement/AdFiltersPanel';
import { SearchBar } from '../components';
import type { AppStackParamList } from '../navigation/types';

/**
 * Ad Management dashboard — reached from Profile's menu list. UI matches `Profile.html`'s
 * `adAtDash` (~line 329); functionality (client-side filter/search/status over one unfiltered
 * `GET /ads/my-ads` fetch, KPIs computed the same way) matches real web's `page.tsx` exactly — see
 * the plan at `delightful-seeking-snowglobe.md`. "New Campaign" navigates to `CreateAdCampaign`
 * (`CreateCampaignWizard` reused unmodified — it has no chapter-specific coupling), the exact
 * same route ETA Chapters' own "+ Create Ad" button also navigates to.
 *
 * Search/filter row deliberately uses the shared `SearchBar` (Directory's own icon-only filter
 * button) rather than the mockup's own labeled "Filter" button — an explicit call to follow this
 * app's established filter-panel/filter-button convention for consistency across screens, over
 * per-screen mockup fidelity for this one control. `AdFiltersPanel` follows the same reasoning
 * (side-slide panel matching `DirectoryFiltersPanel.tsx`, not the mockup's bottom sheet).
 *
 * Refetches on every focus (`useFocusEffect`, same hook `MessagesScreen`/`HomeScreen` already use
 * elsewhere in this app) — without this, deleting/editing/pausing a campaign from the detail
 * screen and tapping back left the dashboard's own `useAdCampaigns()` state stale (it only ever
 * fetched once, on mount), so a deleted campaign kept showing in the list. Pull-to-refresh matches
 * `DirectoryScreen.tsx`'s exact convention (`refreshing` state + a short `setTimeout` so the
 * pull gesture's own release animation has something to settle against).
 */
function AdManagementScreen() {
  const { colors, fonts, fontSize, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const {
    filteredAds,
    isLoading,
    refetch,
    filters,
    setFilters,
    activeFilterCount,
    statusTab,
    setStatusTab,
    statusCounts,
    kpis,
    ads,
  } = useAdCampaigns();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    // `SafeAreaView` (edges: ['bottom']) instead of a manual `useSafeAreaInsets().bottom` read
    // into padding — the raw hook value has already been shown unreliable in this app in at
    // least one screen position (see `ChapterChatComposer.tsx`'s doc comment: a real device still
    // showed content behind the gesture-nav bar even with the hook-based padding applied and a
    // full app reload). `SafeAreaView` applies the inset at the native layout level instead of a
    // JS-computed value, which is the proven fix for that exact failure mode in this codebase.
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader
        title="Ad Management"
        onBack={() => navigation.goBack()}
        rightAction={
          <Pressable
            onPress={() => navigation.navigate('CreateAdCampaign')}
            style={({ pressed }) => [styles.newButton, { backgroundColor: '#182E43', borderRadius: radius.md }, pressed && styles.pressed]}
          >
            <Plus size={14} color="#fff" strokeWidth={2.2} />
            <Text style={[fonts.bold, { fontSize: fontSize.small, color: '#fff' }]}>New Campaign</Text>
          </Pressable>
        }
      />

      <FlatList
        data={isLoading ? [] : filteredAds}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View>
              <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>CAMPAIGNS DASHBOARD</Text>
              <Text style={[fonts.regular, styles.eyebrowSub, { color: colors.ink3 }]}>
                Manage your TSB advertising campaigns, track performance, and review billing.
              </Text>
            </View>

            <AdKpiStrip kpis={kpis} onPressMetric={metric => navigation.navigate('AdInsights', { metric })} />

            <SearchBar
              value={filters.query}
              onChangeText={q => setFilters({ query: q })}
              placeholder="Search campaigns…"
              onFilterPress={() => setFiltersOpen(true)}
              filterCount={activeFilterCount}
            />

            <AdStatusChipsRow active={statusTab} onChange={setStatusTab} counts={statusCounts} total={ads.length} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <AdCampaignCard ad={item} onOpen={() => navigation.navigate('AdCampaignDetail', { adId: item.id })} />
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.cardWrap}>
              <AdCampaignListSkeleton />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWell, { backgroundColor: colors.chip, borderRadius: radius.xl }]}>
                <Search size={26} color={colors.goldDark} />
              </View>
              <Text style={[fonts.bold, { fontSize: fontSize.title, color: colors.ink }]}>
                {ads.length === 0 ? 'No campaigns yet' : 'No campaigns match'}
              </Text>
              <Text style={[fonts.regular, styles.emptyDesc, { fontSize: fontSize.body, color: colors.ink2 }]}>
                {ads.length === 0
                  ? 'Create your first campaign to start advertising on TSB.'
                  : 'Try a different status, search term, or clear your filters.'}
              </Text>
              {ads.length === 0 && (
                <Pressable
                  onPress={() => navigation.navigate('CreateAdCampaign')}
                  style={[styles.emptyCta, { backgroundColor: colors.gold, borderRadius: radius.lg }]}
                >
                  <Megaphone size={15} color="#fff" strokeWidth={1.8} />
                  <Text style={[fonts.bold, { fontSize: fontSize.body, color: '#fff' }]}>New Campaign</Text>
                </Pressable>
              )}
            </View>
          )
        }
      />

      <AdFiltersPanel
        visible={filtersOpen}
        filters={filters}
        statusCounts={statusCounts}
        onClose={() => setFiltersOpen(false)}
        onApply={next => {
          setFilters(next);
          setFiltersOpen(false);
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    height: 36,
  },
  pressed: {
    opacity: 0.75,
  },
  listContent: {
    paddingBottom: 32,
  },
  headerBlock: {
    padding: 16,
    gap: 14,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 0.6,
  },
  eyebrowSub: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  cardWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 30,
    paddingVertical: 40,
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
    maxWidth: 260,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 20,
    marginTop: 4,
  },
});

export default AdManagementScreen;
