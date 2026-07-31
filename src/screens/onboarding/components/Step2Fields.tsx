import React from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { EtaChapter, MAX_ETA_CHAPTERS } from '../constants';
import { EtaChapterCard } from './EtaChapterCard';
import { EtaChip } from './EtaChip';
import { EtaEmptyState } from './EtaEmptyState';

/** Step 2 body — search, selected-chapter chips, suggested ETA list. Pulled out of
 * `OnboardingScreen` for the same reason as `Step1Fields`; parent still owns the query/joined
 * state and does the filtering, this just renders and forwards onChange/onToggle.
 *
 * The suggested list is a `FlatList` (data/renderItem/keyExtractor/ListEmptyComponent) rather
 * than a `.map()` in a `View`, even though `chapters` is a short static array today — once a real
 * "get ETA Chapters" API lands, swapping `chapters` for fetched data (and later adding
 * `onEndReached` pagination) is then a prop change here, not a rewrite of how the list renders.
 * `scrollEnabled={false}` lets the parent `KeyboardAwareScrollView` (the page's only scroll
 * container) keep owning the actual scrolling — RN explicitly skips its "nested VirtualizedList"
 * warning when `scrollEnabled` is `false`, so this is a sanctioned pattern, not a workaround. */
export function Step2Fields({
  query,
  onQueryChange,
  joined,
  chapters,
  onToggle,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  joined: string[];
  chapters: EtaChapter[];
  onToggle: (name: string) => void;
}) {
  const { colors, fonts, fontSize } = useTheme();

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
            Selected Cities ({joined.length}/{MAX_ETA_CHAPTERS})
          </Text>
          <Text style={[fonts.regular, styles.selectedHint, { color: colors.obInk3 }]}>
            Up to {MAX_ETA_CHAPTERS} cities
          </Text>
        </View>
        <View style={styles.chipRow}>
          {joined.length === 0 ? (
            <Text style={[fonts.regular, { fontSize: fontSize.small, color: colors.obInk3 }]}>
              No cities selected yet
            </Text>
          ) : (
            joined.map(name => <EtaChip key={name} name={name} onRemove={() => onToggle(name)} />)
          )}
        </View>
      </View>

      {/* Suggested */}
      <View style={{ gap: 9 }}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>Suggested ETAs</Text>
        <FlatList
          data={chapters}
          keyExtractor={chapter => chapter.name}
          scrollEnabled={false}
          contentContainerStyle={styles.suggestedList}
          renderItem={({ item }) => (
            <EtaChapterCard chapter={item} joined={joined.includes(item.name)} onToggle={() => onToggle(item.name)} />
          )}
          ListEmptyComponent={EtaEmptyState}
        />
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
});
