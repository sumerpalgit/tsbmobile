import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';

export type EventTab = 'upcoming' | 'past' | 'saved';

const TABS: { value: EventTab; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'saved', label: 'Saved' },
];

/**
 * Segmented Upcoming/Past/Saved tabs (with per-tab counts) that swap for an inline search field
 * when search is open, plus a filter button with an active-dot badge — matches the mockup's
 * `searchOpen`/`searchClosed` two-state controls row (`myevents_decoded.html` ~line 211).
 * No existing primitive covers the "swap to search" behavior, so this is bespoke rather than
 * built on `SegmentedControl` (which has no count-badge or search-swap support).
 */
export function EventsControls({
  activeTab,
  onTabChange,
  counts,
  searchOpen,
  searchQuery,
  onSearchChange,
  onOpenSearch,
  onCloseSearch,
  onOpenFilters,
  filtersActive,
}: {
  activeTab: EventTab;
  onTabChange: (tab: EventTab) => void;
  counts: Record<EventTab, number>;
  searchOpen: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onOpenFilters: () => void;
  filtersActive: boolean;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  if (searchOpen) {
    return (
      <View style={styles.row}>
        <View
          style={[
            styles.searchField,
            { backgroundColor: colors.surface, borderColor: colors.gold, borderWidth: borderWidth.thin, borderRadius: radius.xl },
          ]}
        >
          <Icon name="search" size={15} color={colors.gold} />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Event, host or city…"
            placeholderTextColor={colors.ink3}
            autoFocus
            style={[fonts.regular, styles.searchInput, { fontSize: fontSize.ui, color: colors.ink }]}
          />
          {!!searchQuery && (
            <Pressable
              onPress={() => onSearchChange('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={({ pressed }) => [styles.clearButton, { backgroundColor: colors.surfaceSunken, borderRadius: radius.pill }, pressed && styles.pressed]}
            >
              <Icon name="close" size={10} color={colors.ink3} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={onCloseSearch} accessibilityRole="button" style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}>
          <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={[styles.track, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}>
        {TABS.map(tab => {
          const active = tab.value === activeTab;
          return (
            <Pressable
              key={tab.value}
              onPress={() => onTabChange(tab.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.segment,
                { borderRadius: radius.lg },
                active && { backgroundColor: colors.chip, borderColor: colors.goldLight, borderWidth: borderWidth.thin },
                pressed && styles.pressed,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[active ? fonts.bold : fonts.semibold, styles.segmentLabel, { color: active ? colors.goldDark : colors.ink2 }]}
              >
                {tab.label}
              </Text>
              <Text
                style={[
                  fonts.bold,
                  styles.countBadge,
                  { borderRadius: radius.sm },
                  active ? { color: colors.goldDark } : { color: colors.ink3 },
                ]}
              >
                {counts[tab.value]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={onOpenSearch}
        accessibilityRole="button"
        accessibilityLabel="Search events"
        style={({ pressed }) => [
          styles.iconButton,
          { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl },
          pressed && styles.pressed,
        ]}
      >
        <Icon name="search" size={16} color={colors.ink2} />
      </Pressable>
      <Pressable
        onPress={onOpenFilters}
        accessibilityRole="button"
        accessibilityLabel="Filter and sort events"
        style={({ pressed }) => [
          styles.iconButton,
          { borderRadius: radius.xl },
          filtersActive
            ? { backgroundColor: colors.chip, borderColor: colors.gold, borderWidth: borderWidth.thin }
            : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin },
          pressed && styles.pressed,
        ]}
      >
        <Icon name="filter" size={16} color={filtersActive ? colors.goldDark : colors.ink2} />
        {filtersActive && <View style={[styles.filterDot, { backgroundColor: colors.gold, borderColor: colors.pageBg }]} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.65,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 3,
  },
  // No `flex: 1` here — forcing all three tabs to equal thirds starved "Upcoming" (the longest
  // label + a count) while "Past"/"Saved" sat on unused slack. Each tab now sizes to its own
  // content and the track spaces them out (`justifyContent: 'space-between'` above) instead.
  segment: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 10,
  },
  segmentLabel: {
    fontSize: 12,
  },
  countBadge: {
    fontSize: 9.5,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    paddingHorizontal: 13,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    height: 44,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
});
