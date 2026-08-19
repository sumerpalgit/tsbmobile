import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { MAX_ETA_CHAPTERS } from '../../../screens/onboarding/constants';
import { EtaChapter } from '../../../api/eta';
import { EtaEmptyState } from '../../../screens/onboarding/components/EtaEmptyState';

/** One ETA chapter row — a single-line "initial-letter thumb + name/meta + toggle button", not
 * onboarding's `EtaChapterCard` (bigger photo thumb, two meta rows, Join/Joined pill) and not
 * split into a separate removable-chip section either. The real mockup's Select ETAs screen
 * (`dpIs3` block, decoded source) is its own single-list layout: a gold-filled initial avatar
 * once selected, one combined "{location} · {n} members" meta line, and the button itself
 * doubling as both the toggle and the only selection indicator — verified directly against the
 * decoded mockup rather than assumed from onboarding's structurally-different Step 2, per this
 * build's corrected "always check the actual mockup" lesson from Choose Role. */
function EtaCityRow({ chapter, selected, onToggle }: { chapter: EtaChapter; selected: boolean; onToggle: () => void }) {
  const { colors, fonts, fontSize } = useTheme();
  const meta = [chapter.location, `${chapter.memberCount} members`].filter(Boolean).join(' · ');

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.obLine2 }]}>
      <View style={[styles.thumb, { backgroundColor: selected ? colors.obGold : colors.obSunken }]}>
        <Text style={[fonts.authDisplay, styles.thumbLabel, { color: selected ? colors.onAccent : colors.obInk3 }]}>
          {chapter.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[fonts.bold, styles.name, { color: colors.obInk }]} numberOfLines={1}>
          {chapter.name}
        </Text>
        <Text style={[fonts.regular, styles.meta, { color: colors.obInk3 }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Pressable
        onPress={onToggle}
        style={[
          styles.button,
          selected
            ? { borderWidth: 1, borderColor: colors.obGoldLight, backgroundColor: colors.obChip }
            : { backgroundColor: colors.obGold },
        ]}
      >
        <Text style={[fonts.bold, { fontSize: fontSize.small, color: selected ? colors.obGoldDark : colors.onAccent }]}>
          {selected ? 'Joined' : 'Join'}
        </Text>
      </Pressable>
    </View>
  );
}

export function StepSelectEtas({
  roleLabel,
  query,
  onQueryChange,
  chapters,
  selectedCount,
  selectedIds,
  loading,
  onToggle,
}: {
  /** The newly-chosen role from Choose Role (`draft.roleType`) — named in the subtitle, matching
   * the mockup's `dpRoleLabel` reference here. */
  roleLabel: string;
  query: string;
  onQueryChange: (value: string) => void;
  chapters: EtaChapter[];
  selectedCount: number;
  selectedIds: Set<string>;
  loading: boolean;
  onToggle: (chapter: EtaChapter) => void;
}) {
  const { colors, fonts } = useTheme();

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Text style={[fonts.display, styles.headline, { color: colors.obInk }]}>
          Step into a city that thinks ahead
        </Text>
        <Text style={[fonts.regular, styles.body, { color: colors.obInk3 }]}>
          Pick preferred cities for your <Text style={[fonts.bold, { color: colors.obGoldDark }]}>{roleLabel}</Text> profile
          — up to {MAX_ETA_CHAPTERS}.
        </Text>
      </View>

      <View style={[styles.inputWrap, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2 }]}>
        <Search size={15} color={colors.obInk3} strokeWidth={1.6} />
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

      <View style={styles.eyebrowRow}>
        <Text style={[fonts.bold, styles.eyebrow, { color: colors.obInk3 }]}>SUGGESTED ETAS</Text>
        <Text style={[fonts.regular, styles.count, { color: colors.obInk3 }]}>
          {selectedCount} of {MAX_ETA_CHAPTERS} selected
        </Text>
      </View>

      {loading && chapters.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.obInk3} />
        </View>
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={chapter => chapter.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <EtaCityRow chapter={item} selected={selectedIds.has(item.id)} onToggle={() => onToggle(item)} />
          )}
          ListEmptyComponent={EtaEmptyState}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headline: { fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontSize: 12.5, lineHeight: 18 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 46,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
  },
  plainInput: { flex: 1, padding: 0, fontSize: 13.5 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 10, letterSpacing: 0.7 },
  count: { fontSize: 10.5 },
  list: { gap: 9 },
  loadingWrap: { paddingVertical: 28, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLabel: { fontSize: 17 },
  name: { fontSize: 13.5 },
  meta: { fontSize: 11 },
  button: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
