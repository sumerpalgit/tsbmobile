import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LayoutGrid, Rows3, Search, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { EtaChapterTab } from '../../hooks/useMyEtaChapters';

export type ChapterListView = 'grid' | 'rows';

/** Segmented Local/International tabs (with live counts) + search + grid/list toggle — matches
 * `ETAChapters_decoded.html`'s sticky CONTROLS section (~line 299). Built bespoke rather than
 * reusing the shared `SegmentedControl`/`SearchBar` — both are close but not exact matches here
 * (count badges inside each segment, a clear button inside the search field) that those generic
 * components don't support. */
export function ChapterListControls({
  tab,
  onTabChange,
  counts,
  localCountryName,
  query,
  onQueryChange,
  view,
  onToggleView,
}: {
  tab: EtaChapterTab;
  onTabChange: (tab: EtaChapterTab) => void;
  counts: { local: number | null; international: number | null };
  /** Real, not hardcoded — derived from the local tab's own returned chapters (see
   * `useMyEtaChapters.ts`). `null` until the local tab has loaded at least once. */
  localCountryName: string | null;
  query: string;
  onQueryChange: (text: string) => void;
  view: ChapterListView;
  onToggleView: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  const segments: { key: EtaChapterTab; label: string; count: number | null }[] = [
    { key: 'local', label: localCountryName ? `Local · ${localCountryName}` : 'Local', count: counts.local },
    { key: 'international', label: 'International', count: counts.international },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <View style={[styles.segmentTrack, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg }]}>
        {segments.map(s => {
          const active = s.key === tab;
          return (
            <Pressable
              key={s.key}
              onPress={() => onTabChange(s.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.segment, { borderRadius: radius.md }, active && { backgroundColor: colors.feedFill }]}
            >
              <Text numberOfLines={1} style={[active ? fonts.bold : fonts.semibold, styles.segmentLabel, { color: active ? colors.feedOnFill : colors.ink3 }]}>
                {s.label}
              </Text>
              {s.count != null && (
                <View
                  style={[
                    styles.segmentBadge,
                    { backgroundColor: active ? 'rgba(255,255,255,0.15)' : colors.border },
                  ]}
                >
                  <Text style={[fonts.bold, styles.segmentBadgeText, { color: active ? 'rgba(255,255,255,0.8)' : colors.ink3 }]}>
                    {s.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl }]}>
          <Search size={15} color={colors.ink3} strokeWidth={1.6} />
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Search city or country…"
            placeholderTextColor={colors.ink3}
            style={[fonts.regular, styles.input, { fontSize: fontSize.body, color: colors.ink }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => onQueryChange('')} accessibilityLabel="Clear search" style={[styles.clearButton, { backgroundColor: colors.surfaceSunken }]}>
              <X size={9} color={colors.ink3} strokeWidth={1.8} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={onToggleView}
          accessibilityLabel="Toggle layout"
          style={[styles.toggleButton, { borderColor: colors.border, backgroundColor: colors.surface, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}
        >
          {view === 'grid' ? (
            <Rows3 size={17} color={colors.ink2} strokeWidth={1.6} />
          ) : (
            <LayoutGrid size={17} color={colors.ink2} strokeWidth={1.6} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  segmentTrack: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 34,
  },
  segmentLabel: {
    fontSize: 12.5,
  },
  segmentBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 20,
  },
  segmentBadgeText: {
    fontSize: 9,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 42,
    paddingHorizontal: 13,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
