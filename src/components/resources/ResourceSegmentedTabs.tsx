import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '../../theme';

/** "All · {n} / Saved · {n}" segmented pill control + adjacent search/filter square buttons —
 * matches `Resources.html`'s sticky controls bar (~line 213, built at ~595). Mutually exclusive
 * with `ResourceSearchBar` (the caller swaps between the two, not an overlay), same as the
 * mockup's own `sc-if searchClosed` toggle. */
export function ResourceSegmentedTabs({
  activeTab,
  onChangeTab,
  totalCount,
  savedCount,
  onOpenSearch,
  onOpenFilters,
  filtersActive,
}: {
  activeTab: 'all' | 'saved';
  onChangeTab: (tab: 'all' | 'saved') => void;
  totalCount: number | null;
  savedCount: number;
  onOpenSearch: () => void;
  onOpenFilters: () => void;
  filtersActive: boolean;
}) {
  const { colors, fonts } = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.segmentGroup, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        {(
          [
            ['all', `All · ${totalCount ?? '…'}`],
            ['saved', `Saved · ${savedCount}`],
          ] as const
        ).map(([key, label]) => {
          const active = activeTab === key;
          return (
            <Pressable
              key={key}
              onPress={() => onChangeTab(key)}
              style={[
                styles.segment,
                active
                  ? { backgroundColor: colors.chip, borderColor: colors.goldLight, borderWidth: 1 }
                  : { backgroundColor: 'transparent' },
              ]}
            >
              <Text style={[active ? fonts.bold : fonts.semibold, styles.segmentText, { color: active ? colors.goldDark : colors.ink2 }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onOpenSearch}
        accessibilityLabel="Search resources"
        style={({ pressed }) => [styles.squareButton, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}
      >
        <Search size={17} color={colors.ink2} strokeWidth={1.8} />
      </Pressable>

      <Pressable
        onPress={onOpenFilters}
        accessibilityLabel="Filter resources"
        style={({ pressed }) => [styles.squareButton, { backgroundColor: colors.feedFill, borderColor: colors.feedFill }, pressed && styles.pressed]}
      >
        <SlidersHorizontal size={17} color={colors.feedOnFill} strokeWidth={1.8} />
        {filtersActive && <View style={[styles.filterDot, { backgroundColor: colors.goldLight, borderColor: colors.pageBg }]} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  segmentGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentText: {
    fontSize: 12,
  },
  squareButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  filterDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.75,
  },
});
