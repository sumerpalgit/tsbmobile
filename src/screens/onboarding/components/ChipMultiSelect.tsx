import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { ScrollViewWithScrollbar } from './ScrollViewWithScrollbar';

/** Chip-based multi-select: chosen items as removable pills, remaining options as tappable "+"
 * suggestions below. This is Step 3's "Suggested Interests" picker, generalized — Step 4 needs
 * the exact same pattern for "Industries of Interest" and "Geography Focus", just with different
 * `label`/`options`/`selected`, so this stays option-list-agnostic rather than interest-specific. */
export function ChipMultiSelect({
  label,
  required,
  options,
  selected,
  onToggle,
  suggestionsLabel = 'Suggestions',
  emptyHint = 'Tap a suggestion below to add your first one.',
  loading = false,
}: {
  label: string;
  required?: boolean;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  suggestionsLabel?: string;
  emptyHint?: string;
  /** Distinguishes "still fetching" from "server returned zero options" — otherwise an
   * empty `options` list mid-fetch would show the same "All suggestions added." as a
   * genuinely exhausted list. */
  loading?: boolean;
}) {
  const { colors, fonts } = useTheme();
  const suggestions = options.filter(o => !selected.includes(o));

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.headerRow}>
        <Text style={[fonts.semibold, styles.label, { color: colors.obInk }]}>
          {label} {required && <Text style={{ color: colors.obRequired }}>*</Text>}
        </Text>
        <Text style={[fonts.regular, styles.count, { color: colors.obInk3 }]}>{selected.length} selected</Text>
      </View>

      {selected.length > 0 ? (
        <View style={styles.chipRow}>
          {selected.map(item => (
            <Pressable
              key={item}
              onPress={() => onToggle(item)}
              style={[styles.chosenChip, { backgroundColor: colors.obChip, borderColor: colors.obGold }]}
            >
              <Text style={[fonts.semibold, styles.chipText, { color: colors.obGold }]}>{item}</Text>
              <X size={10} color={colors.obGold} strokeWidth={1.6} />
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={[styles.emptyHint, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2 }]}>
          <Text style={[fonts.regular, styles.emptyHintText, { color: colors.obInk3 }]}>{emptyHint}</Text>
        </View>
      )}

      <View style={[styles.suggestionsBox, { backgroundColor: colors.obSurface2, borderColor: colors.borderSoft }]}>
        <View style={styles.headerRow}>
          <Text style={[fonts.semibold, styles.suggestionsLabel, { color: colors.obInk2 }]}>{suggestionsLabel}</Text>
          {suggestions.length > 0 && (
            <Text style={[fonts.regular, styles.count, { color: colors.obInk3 }]}>{suggestions.length} more</Text>
          )}
        </View>
        {/* Capped at the design's own 198px, scrollable instead of growing forever once a real
            (much longer, role-scoped) suggestions list replaces the static 15-item one — with a
            hand-built scrollbar (track/thumb/arrow buttons) matching the design's desktop
            scrollbar, since RN has no native equivalent of that. */}
        <ScrollViewWithScrollbar maxHeight={198} contentContainerStyle={styles.chipRow}>
          {suggestions.length > 0 ? (
            suggestions.map(item => (
              <Pressable
                key={item}
                onPress={() => onToggle(item)}
                style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.obLine2 }]}
              >
                <Text style={[fonts.semibold, styles.chipText, { color: colors.obInk2 }]}>{item}</Text>
                <Text style={[fonts.semibold, styles.plusIcon, { color: colors.obGold }]}>+</Text>
              </Pressable>
            ))
          ) : (
            <Text style={[fonts.regular, styles.allAdded, { color: colors.obInk3 }]}>
              {loading ? 'Loading suggestions…' : 'All suggestions added.'}
            </Text>
          )}
        </ScrollViewWithScrollbar>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  label: {
    fontSize: 12.5,
  },
  count: {
    fontSize: 10.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chosenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingLeft: 15,
    paddingRight: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 44,
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11.5,
  },
  plusIcon: {
    fontSize: 13,
    lineHeight: 13,
  },
  emptyHint: {
    padding: 12,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 13,
  },
  emptyHintText: {
    fontSize: 12,
  },
  suggestionsBox: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 14,
    gap: 9,
  },
  suggestionsLabel: {
    fontSize: 11.5,
  },
  allAdded: {
    fontSize: 12,
  },
});
