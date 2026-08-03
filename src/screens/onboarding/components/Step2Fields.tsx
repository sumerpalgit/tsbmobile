import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { MAX_ETA_CHAPTERS } from '../constants';
import { EtaChapter } from '../../../api/eta';
import { EtaChapterCard } from './EtaChapterCard';
import { EtaChip } from './EtaChip';
import { EtaEmptyState } from './EtaEmptyState';

/** Step 2 body — search, selected-chapter chips, suggested ETA list. Pulled out of
 * `OnboardingScreen` for the same reason as `Step1Fields`; parent still owns the query/selection
 * state, the fetch/search calls, and the `MAX_ETA_CHAPTERS` cap — this just renders and forwards
 * onToggle. `selectedChapters` (not just IDs) so the "Selected Cities" chips can show a name even
 * for a chapter that's since scrolled out of `chapters` (e.g. after a new search).
 *
 * `chapters` now comes from `getSuggestedEtaChapters`/`searchEtaChapters` (`src/api/eta.ts`)
 * instead of a static list — this component didn't need to change shape for that, only the data
 * source did, per its own original design intent.
 *
 * `scrollEnabled={false}` lets the parent `KeyboardAwareScrollView` (the page's only scroll
 * container) keep owning the actual scrolling — RN explicitly skips its "nested VirtualizedList"
 * warning when `scrollEnabled` is `false`, so this is a sanctioned pattern, not a workaround. */
export function Step2Fields({
  query,
  onQueryChange,
  selectedChapters,
  chapters,
  loading,
  onToggle,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  selectedChapters: EtaChapter[];
  chapters: EtaChapter[];
  loading: boolean;
  onToggle: (chapter: EtaChapter) => void;
}) {
  const { colors, fonts, fontSize } = useTheme();
  const selectedIds = new Set(selectedChapters.map(c => c.id));

  return (
    <View style={{ gap: 16 }}>
      {/* Search */}
      <View style={[styles.inputWrap, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2 }]}>
        <Search size={16} color={colors.obInk3} strokeWidth={1.6} />
        <TextInput
          style={[styles.plainInput, { color: colors.obInk }]}
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search city"
          placeholderTextColor={colors.obInk3}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Selected */}
      <View style={{ gap: 8 }}>
        <View style={styles.selectedHeaderRow}>
          <Text style={[fonts.semibold, styles.selectedLabel, { color: colors.obInk2 }]}>
            Selected Cities ({selectedChapters.length}/{MAX_ETA_CHAPTERS})
          </Text>
          <Text style={[fonts.regular, styles.selectedHint, { color: colors.obInk3 }]}>
            Up to {MAX_ETA_CHAPTERS} cities
          </Text>
        </View>
        <View style={styles.chipRow}>
          {selectedChapters.length === 0 ? (
            <Text style={[fonts.regular, { fontSize: fontSize.small, color: colors.obInk3 }]}>
              No cities selected yet
            </Text>
          ) : (
            selectedChapters.map(chapter => (
              <EtaChip key={chapter.id} name={chapter.name} onRemove={() => onToggle(chapter)} />
            ))
          )}
        </View>
      </View>

      {/* Suggested */}
      <View style={{ gap: 9 }}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>Suggested ETAs</Text>
        {loading && chapters.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.obInk3} />
          </View>
        ) : (
          <FlatList
            data={chapters}
            keyExtractor={chapter => chapter.id}
            scrollEnabled={false}
            contentContainerStyle={styles.suggestedList}
            renderItem={({ item }) => (
              <EtaChapterCard chapter={item} joined={selectedIds.has(item.id)} onToggle={() => onToggle(item)} />
            )}
            ListEmptyComponent={EtaEmptyState}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 12.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 46,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
  },
  plainInput: {
    flex: 1,
    padding: 0,
    fontSize: 13.5,
  },
  selectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectedLabel: {
    fontSize: 12,
  },
  selectedHint: {
    fontSize: 10.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  suggestedList: {
    gap: 9,
  },
  loadingWrap: {
    paddingVertical: 28,
    alignItems: 'center',
  },
});
