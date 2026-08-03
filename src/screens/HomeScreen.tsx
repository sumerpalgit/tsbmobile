import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { useTheme } from '../theme';
import { SearchBar } from '../components';
import { EMPTY_FILTERS, FilterPanel, FilterState, countActiveFilters } from '../components/home/FilterPanel';

/**
 * Home — the real feed screen, matching the app bar/drawer reference (`TSB Home FV.html`)'s
 * Home tab: Search bar, Profile Completion card, Quick Actions, Trending, then the feed itself.
 * Built incrementally, top section first — search bar + filters are the first pieces in.
 *
 * `filters` is only stored here for now — there's no feed yet to actually apply it to. Wiring
 * it into a real feed/search call is a later step once the feed itself is built.
 */
function HomeScreen() {
  const { colors, spacing } = useTheme();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.pageBg }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.lg }}
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search posts, members, deals…"
          onFilterPress={() => setFilterPanelOpen(true)}
          filtersActive={countActiveFilters(filters) > 0}
        />
      </ScrollView>

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
