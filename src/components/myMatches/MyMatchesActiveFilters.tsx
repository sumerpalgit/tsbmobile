import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { activeFilterChips, type MyMatchesFilters } from '../../utils/myMatchesFilters';

/**
 * Removable active-filter pills + "Clear all", shown under the search bar once anything is set.
 *
 * Web has the same row (`page.tsx:498-521`) and this app has the same pattern in
 * `directory/ActiveFilterPills.tsx`, whose styling this matches exactly. Not shared with that one
 * because it is typed to `DirectoryFilters` and its pill list is hard-coded to Directory's four
 * fields — generalising it would mean rewriting a working component for one new caller.
 *
 * Unlike the panel, these apply immediately: removing a chip is an unambiguous single action, so
 * making it wait for an Apply press would be strange. Web behaves the same way.
 */
export function MyMatchesActiveFilters({
  filters,
  isFitTab,
  onRemove,
  onClearAll,
}: {
  filters: MyMatchesFilters;
  isFitTab: boolean;
  onRemove: (key: keyof MyMatchesFilters) => void;
  onClearAll: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const chips = activeFilterChips(filters, isFitTab);

  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {chips.map(chip => (
        <Pressable
          key={chip.key}
          onPress={() => onRemove(chip.key)}
          accessibilityLabel={`Remove filter ${chip.label}`}
          style={[
            styles.pill,
            {
              borderColor: colors.goldLight,
              backgroundColor: colors.chip,
              borderRadius: radius.lg,
              borderWidth: borderWidth.thin,
            },
          ]}>
          <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.goldDark }]}>
            {chip.label}
          </Text>
          <X size={11} color={colors.goldDark} strokeWidth={1.9} />
        </Pressable>
      ))}
      <Pressable
        onPress={onClearAll}
        style={[
          styles.clearButton,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: borderWidth.thin,
          },
        ]}>
        <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink3 }]}>
          Clear all
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    gap: 7,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 32,
    paddingHorizontal: 12,
  },
  clearButton: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
