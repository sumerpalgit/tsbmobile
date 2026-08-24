import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '../../../theme';

/**
 * "Chosen chips + search + suggestions" multi-select — matches the mockup's Deal Coverage & Fit
 * sheet exactly (decoded `profilelast_decoded_role.html:3147-3185`, its `dcGroups`), reused here
 * for Industry Focus/Avoided Industries/Geography Focus. NOT the onboarding `ChipMultiSelect` this
 * looks structurally similar to — that component hardcodes onboarding's own distinct `ob*` color
 * tokens (confirmed a different palette from the rest of this app, `theme/colors.ts:179-197`),
 * which would visually mismatch View Profile's real theme; this is a from-scratch, main-theme
 * version of the same shape instead of forcing a reuse that would fail the "match mockup exactly"
 * bar the rest of this tab was held to.
 *
 * Suggestions only populate once the user actually types a search query — per explicit user
 * direction matching web's real functionality: web's own picker (`components/onboarding/
 * SearchableMultiSelect.tsx`) is a click-to-open dropdown that only surfaces matches as you type,
 * not an always-visible wall of every option (the real industries/geographies catalog runs to
 * dozens of entries — showing all of them inline at once, as this component did on the first
 * pass, doesn't match web and is a poor UX for a list that size).
 */
export function ThesisSearchableChips({
  selected,
  onToggle,
  options,
  placeholder,
  tone = 'gold',
}: {
  selected: string[];
  onToggle: (option: string) => void;
  options: string[];
  placeholder: string;
  /** Chosen-chip color — `'gold'` (Industry/Geography Focus) matches the mockup's default;
   * `'danger'` (Avoided Industries) matches its one red-tinted variant. */
  tone?: 'gold' | 'danger';
}) {
  const { colors, fonts } = useTheme();
  const [query, setQuery] = useState('');
  const trimmed = query.trim().toLowerCase();
  const suggestions = trimmed ? options.filter(o => !selected.includes(o) && o.toLowerCase().includes(trimmed)) : [];
  const chosenColor = tone === 'danger' ? colors.danger : colors.goldDark;
  const chosenBorder = tone === 'danger' ? colors.danger : colors.gold;

  return (
    <View style={{ gap: 10 }}>
      {selected.length > 0 && (
        <View style={styles.chipRow}>
          {selected.map(item => (
            <Pressable
              key={item}
              onPress={() => onToggle(item)}
              style={[styles.chosenChip, { backgroundColor: colors.chip, borderColor: chosenBorder }]}
            >
              <Text style={[fonts.semibold, styles.chipText, { color: chosenColor }]}>{item}</Text>
              <X size={9} color={chosenColor} strokeWidth={1.6} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={[styles.searchBox, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
        <Search size={14} color={colors.ink3} strokeWidth={1.8} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={colors.ink3}
          autoCapitalize="none"
          style={[fonts.regular, styles.searchInput, { color: colors.ink }]}
        />
      </View>

      <View style={[styles.suggestionsBox, { backgroundColor: colors.authField, borderColor: colors.borderSoft }]}>
        <View style={styles.suggestionsHeader}>
          <Text style={[fonts.semibold, styles.suggestionsLabel, { color: colors.ink2 }]}>Suggestions</Text>
          {suggestions.length > 0 && <Text style={[fonts.regular, styles.count, { color: colors.ink3 }]}>{suggestions.length} more</Text>}
        </View>
        <View style={styles.chipRow}>
          {suggestions.length > 0 ? (
            suggestions.map(item => (
              <Pressable
                key={item}
                onPress={() => onToggle(item)}
                style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.authFieldBorder }]}
              >
                <Text style={[fonts.semibold, styles.chipText, { color: colors.ink2 }]}>{item}</Text>
                <Text style={[fonts.semibold, styles.plus, { color: colors.gold }]}>+</Text>
              </Pressable>
            ))
          ) : (
            <Text style={[fonts.regular, styles.allAdded, { color: colors.ink3 }]}>
              {trimmed ? `No matches for "${query.trim()}".` : 'Start typing to search…'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chosenChip: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 36, paddingLeft: 13, paddingRight: 10, borderRadius: 999, borderWidth: 1 },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 36, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 11.5 },
  plus: { fontSize: 13, lineHeight: 13 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 42, paddingHorizontal: 13, borderWidth: 1, borderRadius: 11 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 12.5, padding: 0 },
  suggestionsBox: { padding: 12, borderWidth: 1, borderRadius: 14, gap: 9 },
  suggestionsHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  suggestionsLabel: { fontSize: 11 },
  count: { fontSize: 10.5 },
  allAdded: { fontSize: 12 },
});
