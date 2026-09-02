import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '../components';
import { MyMatchesHero } from '../components/myMatches/MyMatchesHero';
import { MyMatchesActiveFilters } from '../components/myMatches/MyMatchesActiveFilters';
import { MyMatchesFiltersPanel } from '../components/myMatches/MyMatchesFiltersPanel';
import { MyMatchesTabs, type MyMatchesTab } from '../components/myMatches/MyMatchesTabs';
import { RawRow } from '../components/myMatches/RawRow';
import { RawSection } from '../components/myMatches/RawSection';
import { useMatchNotificationCounts } from '../hooks/useNotifications';
import {
  useAiMessageCredits,
  useCombinedMatches,
  useMatchSettings,
  usePassedFeedMatches,
  usePassedSuggestedMatches,
  useSuggestedMatches,
} from '../hooks/useMyMatches';
import type { FeedMatch, MyPostMatchSummary, SuggestedMatch } from '../api/myMatches';
import { resolveMatchFeed } from '../api/myMatches';
import {
  MATCH_THRESHOLD,
  filterFeedMatches,
  filterMyPosts,
  filterSuggested,
  imAFitStats,
  myPostsStats,
  qualifyingFeedMatches,
  suggestedStats,
  type HeroStat,
} from '../utils/myMatchesStats';
import {
  EMPTY_MY_MATCHES_FILTERS,
  applyFeedMatchFilters,
  applyMyPostFilters,
  countActiveMyMatchesFilters,
  resetValueFor,
  type MyMatchesFilters,
} from '../utils/myMatchesFilters';
import { fontSize, fonts, spacing, useTheme } from '../theme';

/**
 * My Matches — real chrome, raw rows.
 *
 * The hero, tabs and search are built properly and match both this app's house style and web's own
 * numbers. The **item rows are deliberately raw**: the match cards are being redesigned, so
 * anything card-shaped built now would be thrown away, whereas knowing exactly what each endpoint
 * returns survives any redesign.
 *
 * The hero stats and the section counts will often disagree, and that is the point. Web computes
 * every stat over a filtered, deduplicated subset — a 30% score floor, five permitted feed types,
 * one row per post — while the sections below show every row the backend sent. The gap between the
 * two numbers is how much web is hiding, which is worth seeing before designing anything.
 *
 * One thing this screen deliberately does NOT do: **fire `POST /notifications/read-all`**. Web
 * calls it on mount (`page.tsx:163`) to clear the match badge, but it marks *every* notification
 * read, not just match ones. That side effect does not belong on a read-only screen; it goes in
 * with the real UI.
 */

/** Web's per-tab hero copy (`page.tsx:355-364`), verbatim. */
const TAB_META: Record<MyMatchesTab, { heading: string; subtitle: string }> = {
  suggested: {
    heading: 'Suggested Connections',
    subtitle:
      'People our algorithm thinks you should connect with — based on your profile and activity',
  },
  'my-posts': {
    heading: 'From My Posts',
    subtitle:
      'Investors, searchers and operators that match the posts you’ve published — review and decide who to engage',
  },
  'im-a-fit': {
    heading: 'Where I’m a Fit',
    subtitle: 'Posts matched to your profile by AI — review and decide whether to engage',
  },
  // Not a web tab; web reaches these through a gear button and a settings drawer.
  other: {
    heading: 'Settings & Credits',
    subtitle:
      'The endpoints behind Match Settings, AI message credits and the match notification badges',
  },
};

const SEARCH_PLACEHOLDER: Record<MyMatchesTab, string> = {
  suggested: 'Name, role or match reason…',
  'my-posts': 'Post title…',
  'im-a-fit': 'Post title, author or match reason…',
  other: '',
};

/** A very long list of one-line rows is still a lot of views; cap and say so rather than jank. */
const MAX_ROWS = 100;

function flag(value: boolean | null | undefined): string {
  return value === null || value === undefined ? 'null' : String(value);
}

function shortId(id: string | undefined): string {
  if (!id) return 'no-id';
  return id.length > 12 ? `${id.slice(0, 12)}…` : id;
}

function suggestedSummary(item: SuggestedMatch): string {
  const target = item.target ?? {};
  return [shortId(item.id), target.name ?? 'no name', target.role_type ?? 'no role'].join('  ·  ');
}

function suggestedDetail(item: SuggestedMatch): string {
  return `profile_interest=${flag(item.profile_interest)}  creator_interest=${flag(
    item.creator_interest,
  )}  passed_at=${item.passed_at ?? 'null'}`;
}

function feedMatchSummary(item: FeedMatch): string {
  const feed = resolveMatchFeed(item);
  return [
    shortId(item.id),
    item.match_percentage === undefined ? 'no %' : `${item.match_percentage}%`,
    feed.feed_type ?? 'no feed_type',
  ].join('  ·  ');
}

function feedMatchDetail(item: FeedMatch): string {
  return `profile_interest=${flag(item.profile_interest)}  creator_interest=${flag(
    item.creator_interest,
  )}  nda_sent=${flag(item.nda_sent)}  nda_request.status=${item.nda_request?.status ?? 'null'}`;
}

function postSummary(item: MyPostMatchSummary): string {
  return [
    shortId(item.id),
    item.feed_type ?? 'no feed_type',
    `match_count=${item.match_count ?? 0}`,
  ].join('  ·  ');
}

function postDetail(item: MyPostMatchSummary): string {
  return `has_new_matches=${flag(item.has_new_matches)}  likes=${item.likes_count ?? 0}  comments=${
    item.comments_count ?? 0
  }  reactions=${item.reactions_count ?? 0}`;
}

export default function MyMatchesScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<MyMatchesTab>('suggested');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<MyMatchesFilters>(EMPTY_MY_MATCHES_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Web hides the Filters button on Suggested entirely (`page.tsx:429`) — three of the four groups
  // are about posts, which suggested rows have none of.
  const filtersApply = tab === 'my-posts' || tab === 'im-a-fit';

  /**
   * Switching tabs clears search and filters, matching web (`page.tsx:158-161`). Not just tidiness:
   * Match Status has different option sets per tab and Fit Score only exists on one, so a value
   * carried across would silently filter against an option the new tab never offered.
   */
  const changeTab = useCallback((next: MyMatchesTab) => {
    setTab(next);
    setSearch('');
    setFilters(EMPTY_MY_MATCHES_FILTERS);
    setFiltersOpen(false);
  }, []);

  const combined = useCombinedMatches();
  const suggested = useSuggestedMatches();
  const passedSuggested = usePassedSuggestedMatches();
  const passedFeed = usePassedFeedMatches();
  const settings = useMatchSettings();
  const credits = useAiMessageCredits();
  const matchCounts = useMatchNotificationCounts();

  const refetchAll = useCallback(() => {
    setRefreshing(true);
    Promise.allSettled([
      combined.refetch(),
      suggested.refetch(),
      passedSuggested.refetch(),
      passedFeed.refetch(),
      settings.refetch(),
      credits.refetch(),
      matchCounts.refetch(),
    ]).finally(() => setRefreshing(false));
  }, [combined, suggested, passedSuggested, passedFeed, settings, credits, matchCounts]);

  // Memoised because the `?? []` fallback would otherwise be a fresh array each render, which the
  // derived useMemos below would then never be able to skip.
  const feedMatches = useMemo(() => combined.data?.matchmaking ?? [], [combined.data]);
  const userPosts = useMemo(() => combined.data?.userPosts ?? [], [combined.data]);
  const suggestedItems = useMemo(() => suggested.data ?? [], [suggested.data]);
  const passedSuggestedItems = useMemo(() => passedSuggested.data ?? [], [passedSuggested.data]);
  const passedFeedItems = useMemo(() => passedFeed.data ?? [], [passedFeed.data]);

  /** Hero numbers, computed exactly as web computes them so they agree across platforms. */
  const stats: HeroStat[] = useMemo(() => {
    if (tab === 'suggested') return suggestedStats(suggestedItems);
    if (tab === 'my-posts') return myPostsStats(userPosts, feedMatches);
    if (tab === 'im-a-fit') return imAFitStats(feedMatches);
    // Web has no hero for these — they live behind a gear button — so these five are chosen to be
    // the numbers actually worth glancing at, rather than a 1/0 "did it load" tile.
    return [
      { value: settings.data?.sectors.length ?? 0, label: 'Sectors' },
      { value: settings.data?.geographies.length ?? 0, label: 'Geographies' },
      { value: credits.data?.used ?? 0, label: 'Credits Used' },
      { value: credits.data?.max ?? 0, label: 'Credit Limit' },
      { value: matchCounts.data?.total ?? 0, label: 'Match Alerts' },
    ];
  }, [tab, suggestedItems, userPosts, feedMatches, settings.data, credits.data, matchCounts.data]);

  // Search is a local substring match over already-fetched arrays — no My Matches endpoint takes a
  // search param. Undebounced for the same reason `ChapterChatListScreen` is: nothing goes over the
  // network, so a delay would only add lag between keystroke and result.
  const shownSuggested = useMemo(
    () => filterSuggested(suggestedItems, search),
    [suggestedItems, search],
  );
  const shownPassedSuggested = useMemo(
    () => filterSuggested(passedSuggestedItems, search),
    [passedSuggestedItems, search],
  );
  // Filters stack on top of search, in that order, exactly as web composes them.
  const shownPosts = useMemo(
    () => applyMyPostFilters(filterMyPosts(userPosts, search), filters),
    [userPosts, search, filters],
  );
  const shownFeedMatches = useMemo(
    () => applyFeedMatchFilters(filterFeedMatches(feedMatches, search), filters),
    [feedMatches, search, filters],
  );
  const shownPassedFeed = useMemo(
    () => applyFeedMatchFilters(filterFeedMatches(passedFeedItems, search), filters),
    [passedFeedItems, search, filters],
  );

  const activeFilterCount = countActiveMyMatchesFilters(filters);

  /** Lets the panel count its own draft live. Search stays applied, since it is not part of the
   * draft and the user can see it is still in the box. */
  const countForFilters = useCallback(
    (next: MyMatchesFilters) =>
      tab === 'my-posts'
        ? applyMyPostFilters(filterMyPosts(userPosts, search), next).length
        : applyFeedMatchFilters(filterFeedMatches(feedMatches, search), next).length,
    [tab, userPosts, feedMatches, search],
  );

  /** What web's 30% floor, feed-type allowlist and per-post dedup would remove from the raw list. */
  const hiddenByWeb = useMemo(
    () => feedMatches.length - qualifyingFeedMatches(feedMatches).length,
    [feedMatches],
  );

  /** Says why a section is showing fewer rows than the endpoint returned, when it is. */
  const narrowedNote = (shown: number, total: number) => {
    if (shown === total) return undefined;
    const reasons = [search.trim() ? 'search' : null, activeFilterCount > 0 ? 'filters' : null]
      .filter(Boolean)
      .join(' + ');
    return reasons ? `Showing ${shown} of ${total} after ${reasons}.` : undefined;
  };

  const renderRows = <T,>(
    items: T[],
    summary: (item: T) => string,
    detail: (item: T) => string,
  ) => (
    <>
      {items.slice(0, MAX_ROWS).map((item, i) => (
        <RawRow
          key={(item as { id?: string }).id ?? String(i)}
          index={i + 1}
          summary={summary(item)}
          detail={detail(item)}
          value={item}
        />
      ))}
      {items.length > MAX_ROWS ? (
        <Text style={[styles.truncated, { color: colors.ink3 }]}>
          Showing the first {MAX_ROWS} of {items.length} — the cap is local, the response held every
          row.
        </Text>
      ) : null}
    </>
  );

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetchAll}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }>
        <MyMatchesHero
          heading={TAB_META[tab].heading}
          subtitle={TAB_META[tab].subtitle}
          stats={stats}
        />

        <View style={styles.controls}>
          <MyMatchesTabs activeTab={tab} onChange={changeTab} />
          {tab === 'other' ? null : (
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={SEARCH_PLACEHOLDER[tab]}
              onFilterPress={filtersApply ? () => setFiltersOpen(true) : undefined}
              filterCount={activeFilterCount}
            />
          )}
          {filtersApply ? (
            <MyMatchesActiveFilters
              filters={filters}
              isFitTab={tab === 'im-a-fit'}
              onRemove={key => setFilters(prev => ({ ...prev, [key]: resetValueFor(key) }))}
              onClearAll={() => setFilters(EMPTY_MY_MATCHES_FILTERS)}
            />
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={[styles.banner, { color: colors.ink3 }]}>
            Rows below are raw API output — no cards, no score filtering, no sorting. The hero
            numbers use web’s own rules, so they will read lower than the counts here. Tap a row for
            its full JSON.
          </Text>

          {tab === 'suggested' ? (
            <>
              <RawSection
                title="Suggested connections"
                endpoint="GET /matchmaking/suggested"
                note={
                  narrowedNote(shownSuggested.length, suggestedItems.length) ??
                  'Person-to-person suggestions. These carry no match_percentage at all — web’s suggested card is deliberately score-less.'
                }
                count={shownSuggested.length}
                isLoading={suggested.isLoading}
                error={suggested.error}>
                {renderRows(shownSuggested, suggestedSummary, suggestedDetail)}
              </RawSection>

              <RawSection
                title="Passed suggestions"
                endpoint="GET /matchmaking/suggested/passed"
                note={narrowedNote(shownPassedSuggested.length, passedSuggestedItems.length)}
                count={shownPassedSuggested.length}
                isLoading={passedSuggested.isLoading}
                error={passedSuggested.error}>
                {renderRows(shownPassedSuggested, suggestedSummary, suggestedDetail)}
              </RawSection>
            </>
          ) : null}

          {tab === 'my-posts' ? (
            <RawSection
              title="My posts and their match counts"
              endpoint="GET /matchmaking/my-combined → user_posts[]"
              note={
                narrowedNote(shownPosts.length, userPosts.length) ??
                'One call serves this tab and Where I’m a Fit; the response carries both arrays.'
              }
              count={shownPosts.length}
              isLoading={combined.isLoading}
              error={combined.error}>
              {renderRows(shownPosts, postSummary, postDetail)}
            </RawSection>
          ) : null}

          {tab === 'im-a-fit' ? (
            <>
              <RawSection
                title="Posts I match"
                endpoint="GET /matchmaking/my-combined → matchmaking[]"
                note={
                  narrowedNote(shownFeedMatches.length, feedMatches.length) ??
                  `Unfiltered. Web would drop ${hiddenByWeb} of these ${feedMatches.length} — anything under ${MATCH_THRESHOLD}%, any feed type outside deal/search_capital/investor_corner/job/fae, and duplicate rows for the same post.`
                }
                count={shownFeedMatches.length}
                isLoading={combined.isLoading}
                error={combined.error}>
                {renderRows(shownFeedMatches, feedMatchSummary, feedMatchDetail)}
              </RawSection>

              <RawSection
                title="Passed posts"
                endpoint="GET /matchmaking/my-combined?include_passed=true"
                note={
                  narrowedNote(shownPassedFeed.length, passedFeedItems.length) ??
                  'No passed-only route exists on the feed side — the flag widens the same list and rows without passed_at are dropped here.'
                }
                count={shownPassedFeed.length}
                isLoading={passedFeed.isLoading}
                error={passedFeed.error}>
                {renderRows(shownPassedFeed, feedMatchSummary, feedMatchDetail)}
              </RawSection>
            </>
          ) : null}

          {tab === 'other' ? (
            <>
              <RawSection
                title="Match settings"
                endpoint="GET /match-settings"
                note="My Matches’ own settings resource — not /settings/matching, which backs the Settings › Matching screen and has a different shape."
                count={settings.data ? 1 : 0}
                isLoading={settings.isLoading}
                error={settings.error}>
                {settings.data ? (
                  <RawRow
                    index={1}
                    summary={`active=${settings.data.active}  ·  deal_size ${
                      settings.data.deal_size_min ?? 'null'
                    }–${settings.data.deal_size_max ?? 'null'}`}
                    detail={`sectors=${settings.data.sectors.length}  geographies=${settings.data.geographies.length}  role_types=${settings.data.role_types.length}`}
                    value={settings.data}
                  />
                ) : null}
              </RawSection>

              <RawSection
                title="AI message draft credits"
                endpoint="GET /ai/message-draft-credits"
                note="Powers web’s AI message modal. A separate credit pool from AI Assist, which has no credit concept."
                count={credits.data ? 1 : 0}
                isLoading={credits.isLoading}
                error={credits.error}>
                {credits.data ? (
                  <RawRow
                    index={1}
                    summary={`used=${credits.data.used}  ·  max=${credits.data.max}`}
                    value={credits.data}
                  />
                ) : null}
              </RawSection>

              <RawSection
                title="Match notification counts"
                endpoint="GET /notifications/match-counts"
                note="Already wired in this app for the notification badges — shown here because web’s My Matches reads it too."
                count={matchCounts.data ? 1 : 0}
                isLoading={matchCounts.isLoading}
                error={matchCounts.error}>
                {matchCounts.data ? (
                  <RawRow
                    index={1}
                    summary={`total=${matchCounts.data.total}`}
                    detail={`interest=${matchCounts.data.match_interest}  mutual=${matchCounts.data.match_mutual}  nda_request=${matchCounts.data.match_nda_request}  nda_signed=${matchCounts.data.match_nda_signed}`}
                    value={matchCounts.data}
                  />
                ) : null}
              </RawSection>
            </>
          ) : null}
        </View>
      </ScrollView>

      <MyMatchesFiltersPanel
        visible={filtersOpen}
        filters={filters}
        isFitTab={tab === 'im-a-fit'}
        countFor={countForFilters}
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
  scroll: {
    paddingBottom: spacing.xxxl,
  },
  controls: {
    gap: spacing.md,
    padding: spacing.md,
  },
  body: {
    paddingHorizontal: spacing.lg,
  },
  banner: {
    ...fonts.regular,
    fontSize: fontSize.caption,
    lineHeight: 15,
    marginBottom: spacing.lg,
  },
  truncated: {
    ...fonts.regular,
    fontSize: fontSize.caption,
    lineHeight: 15,
    marginTop: spacing.sm,
  },
});
