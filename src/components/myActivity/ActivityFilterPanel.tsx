import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import type { ActivityTab, MyActivityFeedItem } from '../../api/myActivity';

export type ActivitySort = 'newest' | 'popular';

export type ActivityFilters = {
  search: string;
  postType: string;
  authorType: string;
  /** Shared field for both "Deal Stage" (liked/commented tabs) and "Request Status" (my-posts/
   * interacted-posts) — same underlying state, different label/options/matching logic per tab,
   * matching web's `ActivityFilterPanel.tsx` exactly. */
  dealStage: string;
  dateRange: string;
  /** Client-side only — no web/backend sort logic exists for My Activity (confirmed), but the
   * mockup's own filter sheet shows a "Sort by" group, so it's kept as a cosmetic, purely local
   * reorder (same as the mockup's own `list.sort(...)` — see the plan's Decision 3). Not counted
   * in `countActiveActivityFilters`, matching the mockup's own `filtersActive` check. */
  sort: ActivitySort;
};

export const DEFAULT_ACTIVITY_FILTERS: ActivityFilters = {
  search: '',
  postType: 'All',
  authorType: 'All',
  dealStage: 'All',
  dateRange: 'Any time',
  sort: 'newest',
};

const POST_TYPES = ['All', 'Back a Searcher', 'Sell-Side M&A', 'Lender Opp.', 'Operator Wanted', 'Event'];
const AUTHOR_TYPES = ['All', 'Searcher', 'Seller', 'Investor', 'Operator'];
const REQUEST_STATUS_OPTIONS = ['All', 'Pending', 'NDA Sent', 'Signed', 'Declined', 'Withdrawn'];
const DEAL_STAGE_OPTIONS = ['All', 'Early Stage', 'In Diligence', 'LOI Signed', 'Closed'];
const DATE_RANGE_OPTIONS = ['Any time', 'This week', 'This month', 'Last 3 months', 'This year'];
const SORT_OPTIONS: { value: ActivitySort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
];

/** Matches web's `FEED_TYPE_MAP` exactly, including the real gap it has: `poll`/`atc`/
 * `find_a_connection`/an unrecognized `investor_corner` scenario aren't in this map, so picking
 * any specific Post Type pill hides them — replicated as-is per the plan's Decision 9. */
const FEED_TYPE_MAP: Record<string, string[]> = {
  'Back a Searcher': ['investor_corner'],
  'Sell-Side M&A': ['deal'],
  'Lender Opp.': ['search_capital'],
  'Operator Wanted': ['job_operator', 'job'],
  Event: ['event'],
};

const REQUEST_STATUS_MAP: Record<string, string> = {
  Pending: 'requested',
  'NDA Sent': 'nda_sent',
  Signed: 'nda_signed',
  Declined: 'declined',
  Withdrawn: 'withdrawn',
};

const DATE_RANGE_DAYS: Record<string, number> = {
  'This week': 7,
  'This month': 30,
  'Last 3 months': 90,
  'This year': 365,
};
const DAY_MS = 24 * 60 * 60 * 1000;

export function countActiveActivityFilters(f: ActivityFilters): number {
  return (
    (f.postType !== 'All' ? 1 : 0) +
    (f.authorType !== 'All' ? 1 : 0) +
    (f.dealStage !== 'All' ? 1 : 0) +
    (f.dateRange !== 'Any time' ? 1 : 0)
  );
}

/** Ported from web's `applyFilters` inside `my-activities/page.tsx` — entirely client-side over
 * the already-fetched page, same as web (no server query params beyond page/limit). The
 * `dealStage`/"Request Status" filter only has an effect on `my-posts`/`interacted-posts` — on
 * `liked-posts`/`commented-posts` it's a dead filter on web too (confirmed: web's own `else if`
 * chain doesn't cover those tabs), replicated here rather than "fixed". */
export function applyActivityFilters(
  items: MyActivityFeedItem[],
  filters: ActivityFilters,
  activeTab: ActivityTab,
): MyActivityFeedItem[] {
  const search = filters.search.trim().toLowerCase();

  return items.filter(item => {
    // "Received Requests" and "Sent Requests" are both NDA/PPM/CIM flows only — job/event posts
    // don't take that kind of request and never appear on either tab on web (`renderPosts`' own
    // `feed_type === "job" || "event"` exclusion for `my-posts`, and the identical exclusion for
    // `interacted-posts` right above `renderFeedItems`' own card dispatch, in
    // `my-activities/page.tsx`). Not a user-facing filter, always applied on both tabs.
    if ((activeTab === 'my-posts' || activeTab === 'interacted-posts') && (item.feed_type === 'job' || item.feed_type === 'event')) return false;

    if (search) {
      const raw = item.item as Record<string, unknown>;
      const title = String(raw?.post_title ?? raw?.title ?? raw?.role_title ?? raw?.investment_mandate_title ?? '');
      const author = item.profile?.name ?? '';
      if (!title.toLowerCase().includes(search) && !author.toLowerCase().includes(search)) return false;
    }

    if (filters.postType !== 'All') {
      const allowed = FEED_TYPE_MAP[filters.postType] ?? [];
      if (!allowed.includes(item.feed_type)) return false;
    }

    if (filters.authorType !== 'All') {
      if ((item.profile?.role_type ?? '').toLowerCase() !== filters.authorType.toLowerCase()) return false;
    }

    if (filters.dealStage !== 'All') {
      if (activeTab === 'interacted-posts') {
        const wanted = REQUEST_STATUS_MAP[filters.dealStage];
        if (wanted && item.interaction_details?.status !== wanted) return false;
      } else if (activeTab === 'my-posts') {
        const raw = item.item as Record<string, unknown>;
        const stage = String(raw?.process_stage ?? raw?.status ?? '').toLowerCase();
        if (!stage.includes(filters.dealStage.toLowerCase())) return false;
      }
    }

    if (filters.dateRange !== 'Any time') {
      const days = DATE_RANGE_DAYS[filters.dateRange];
      if (days && Date.now() - new Date(item.created_at).getTime() > days * DAY_MS) return false;
    }

    return true;
  });
}

/** Matches the mockup's `nounFor` map exactly. */
const RESULT_NOUN: Record<ActivityTab, string> = {
  'liked-posts': 'liked post',
  'commented-posts': 'commented post',
  'my-posts': 'request',
  'interacted-posts': 'request',
};

export function ActivityFilterPanel({
  activeTab,
  filters,
  onChange,
  onClear,
  resultsCount,
}: {
  activeTab: ActivityTab;
  filters: ActivityFilters;
  onChange: (next: ActivityFilters) => void;
  onClear: () => void;
  /** The already-filtered item count for the active tab — drives the "N liked posts" label shown
   * in place of the search bar when it's collapsed, matching the mockup's `resultsLabel`. */
  resultsCount: number;
}) {
  const { colors, fonts, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const activeCount = countActiveActivityFilters(filters);

  const isRequestStatusTab = activeTab === 'my-posts' || activeTab === 'interacted-posts';
  const fourthLabel = isRequestStatusTab ? 'Request Status' : 'Deal Stage';
  const fourthOptions = isRequestStatusTab ? REQUEST_STATUS_OPTIONS : DEAL_STAGE_OPTIONS;

  const set = <K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) => onChange({ ...filters, [key]: value });
  const noun = RESULT_NOUN[activeTab];
  const resultsLabel = `${resultsCount} ${noun}${resultsCount === 1 ? '' : 's'}`;

  return (
    <View>
      {/* Toggle-based search — matches the mockup exactly: collapsed shows a results-count label
          + a search icon button that reveals the input, not an always-visible search bar. */}
      {searchOpen ? (
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: radius.lg }]}>
            <Icon name="search" size={15} color={colors.gold} />
            <TextInput
              autoFocus
              value={filters.search}
              onChangeText={text => set('search', text)}
              placeholder="Search your activity…"
              placeholderTextColor={colors.ink3}
              style={[styles.searchInput, { color: colors.ink }]}
            />
          </View>
          <Pressable onPress={() => setSearchOpen(false)}>
            <Text style={[fonts.semibold, styles.doneLabel, { color: colors.ink2 }]}>Done</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.searchRow}>
          <Text style={[fonts.bold, styles.resultsLabel, { color: colors.ink3 }]} numberOfLines={1}>
            {resultsLabel.toUpperCase()}
          </Text>
          <Pressable
            onPress={() => setSearchOpen(true)}
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}
          >
            <Icon name="search" size={15} color={colors.ink2} />
          </Pressable>
          <Pressable
            onPress={() => setOpen(prev => !prev)}
            style={[styles.iconButton, styles.filterButton, { backgroundColor: colors.accentSolid, borderRadius: radius.lg }]}
          >
            <Icon name="filter" size={15} color="#fff" />
            {activeCount > 0 && <View style={[styles.filterDot, { backgroundColor: colors.goldLight, borderColor: colors.pageBg }]} />}
          </Pressable>
        </View>
      )}

      {activeCount > 0 && (
        <View style={styles.chipsRow}>
          {filters.postType !== 'All' && <ActiveChip label={filters.postType} onPress={() => set('postType', 'All')} />}
          {filters.authorType !== 'All' && <ActiveChip label={filters.authorType} onPress={() => set('authorType', 'All')} />}
          {filters.dealStage !== 'All' && <ActiveChip label={filters.dealStage} onPress={() => set('dealStage', 'All')} />}
          {filters.dateRange !== 'Any time' && <ActiveChip label={filters.dateRange} onPress={() => set('dateRange', 'Any time')} />}
          <Pressable onPress={onClear}>
            <Text style={[fonts.semibold, styles.clearAll, { color: colors.ink3 }]}>Clear all</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <FilterSheet
          filters={filters}
          fourthLabel={fourthLabel}
          fourthOptions={fourthOptions}
          resultsCount={resultsCount}
          onChange={onChange}
          onClear={onClear}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </View>
  );
}

/** The full-screen filter sheet — matches the mockup's `filterOpen` overlay exactly (serif title +
 * close button header, scrollable stacked groups each starting with an explicit "All"/"Any time"/
 * "Newest" pill, fixed footer with "Clear all" + "Show N results"). Was previously built as an
 * inline expandable section under the search row — a real mismatch, this is the actual mockup
 * layout. */
function FilterSheet({
  filters,
  fourthLabel,
  fourthOptions,
  resultsCount,
  onChange,
  onClear,
  onClose,
}: {
  filters: ActivityFilters;
  fourthLabel: string;
  fourthOptions: string[];
  resultsCount: number;
  onChange: (next: ActivityFilters) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const { colors, fonts, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const set = <K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) => onChange({ ...filters, [key]: value });

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <View
        style={[
          styles.sheetHeader,
          { paddingTop: insets.top + 12, backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin },
        ]}
      >
        <Text style={[fonts.display, styles.sheetTitle, { color: colors.ink }]}>Filter activity</Text>
        <Pressable
          onPress={onClose}
          style={[styles.sheetClose, { backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.lg }]}
        >
          <X size={14} color={colors.ink2} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
        <FilterGroup label="Post Type">
          {POST_TYPES.map(opt => (
            <ActivityPill key={opt} label={opt} selected={filters.postType === opt} onPress={() => set('postType', opt)} />
          ))}
        </FilterGroup>

        <FilterGroup label="Author Type">
          {AUTHOR_TYPES.map(opt => (
            <ActivityPill key={opt} label={opt} selected={filters.authorType === opt} onPress={() => set('authorType', opt)} />
          ))}
        </FilterGroup>

        <FilterGroup label={fourthLabel}>
          {fourthOptions.map(opt => (
            <ActivityPill key={opt} label={opt} selected={filters.dealStage === opt} onPress={() => set('dealStage', opt)} />
          ))}
        </FilterGroup>

        <FilterGroup label="Date Range">
          {DATE_RANGE_OPTIONS.map(opt => (
            <ActivityPill key={opt} label={opt} selected={filters.dateRange === opt} onPress={() => set('dateRange', opt)} />
          ))}
        </FilterGroup>

        <FilterGroup label="Sort By">
          {SORT_OPTIONS.map(opt => (
            <ActivityPill key={opt.value} label={opt.label} selected={filters.sort === opt.value} onPress={() => set('sort', opt.value)} />
          ))}
        </FilterGroup>
      </ScrollView>

      <View
        style={[
          styles.sheetFooter,
          { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin, paddingBottom: insets.bottom + 13 },
        ]}
      >
        <Pressable onPress={onClear}>
          <Text style={[fonts.semibold, styles.footerClearAll, { color: colors.goldDark }]}>Clear all</Text>
        </Pressable>
        <Pressable onPress={onClose} style={[styles.footerShowButton, { backgroundColor: colors.gold, borderRadius: radius.lg }]}>
          <Check size={13} color="#fff" strokeWidth={2.2} />
          <Text style={[fonts.bold, styles.footerShowText]}>Show {resultsCount} results</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** This filter sheet's own pill — gold-filled when selected, matching web's real
 * `ActivityFilterPanel.tsx` exactly (`background: active ? "var(--tsb-gold)" : "var(--tsb-surface)"`
 * — confirmed directly in source, not the mockup, which uses navy there instead). Deliberately not
 * the shared `Pill` component (`src/components/Pill.tsx`), which selects navy — that's correct for
 * Home feed's own filter panel and shouldn't change; this tab's selected color is a real,
 * confirmed difference specific to My Activity. */
function ActivityPill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.activityPill,
        selected ? { backgroundColor: colors.gold } : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <Text style={[fonts.semibold, styles.activityPillText, { color: selected ? '#fff' : colors.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={styles.group}>
      <Text style={[fonts.bold, styles.groupLabel, { color: colors.ink3 }]}>{label.toUpperCase()}</Text>
      <View style={styles.chipWrap}>{children}</View>
    </View>
  );
}

function ActiveChip({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors, fonts, radius } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.activeChip, { backgroundColor: colors.chip, borderRadius: radius.lg }]}>
      <Text style={[fonts.semibold, styles.activeChipText, { color: colors.goldDark }]}>{label} ✕</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    paddingHorizontal: 13,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 13.5,
  },
  doneLabel: {
    fontSize: 13,
  },
  resultsLabel: {
    flex: 1,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    borderWidth: 0,
  },
  filterDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  activeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeChipText: {
    fontSize: 11.5,
  },
  clearAll: {
    fontSize: 11.5,
    textDecorationLine: 'underline',
  },
  group: {
    gap: 11,
  },
  groupLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityPill: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityPillText: {
    fontSize: 12.5,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  sheetTitle: {
    fontSize: 24,
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    padding: 18,
    gap: 22,
  },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 13,
  },
  footerClearAll: {
    fontSize: 13,
  },
  footerShowButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 46,
  },
  footerShowText: {
    fontSize: 13.5,
    color: '#fff',
  },
});
