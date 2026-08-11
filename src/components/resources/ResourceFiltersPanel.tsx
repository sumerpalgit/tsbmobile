import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { CONTENT_TYPES, DATE_RANGES, RESOURCE_AUTHOR_TYPES, RESOURCE_SORTS } from '../../types/resources';
import type { ResourceFilters } from '../../hooks/useResources';

/** Slide-in Filters panel — matches `Resources.html`'s "Filter resources" overlay (~line 292).
 * Same `Animated.timing` slide-from-right + mount-through-exit `shouldRender` template as
 * `DirectoryFiltersPanel.tsx`. All 4 sections (Resource type / Author type / Date added / Sort
 * by) are single-select and staged in a local `draft`, committed together on "Show results" —
 * Sort lives inside this drawer rather than web's own separate main-list dropdown, same
 * UI-space tradeoff already made (at the user's own direction) for Directory's filters panel. */
export function ResourceFiltersPanel({
  visible,
  filters,
  resultCount,
  onClose,
  onApply,
}: {
  visible: boolean;
  filters: ResourceFilters;
  resultCount: number | null;
  onClose: () => void;
  onApply: (filters: ResourceFilters) => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const screenWidth = Dimensions.get('window').width;
  const [shouldRender, setShouldRender] = useState(visible);
  const translateX = useRef(new Animated.Value(visible ? 0 : screenWidth)).current;

  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setDraft(filters);
      translateX.setValue(screenWidth);
      Animated.timing(translateX, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateX, { toValue: screenWidth, duration: 220, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setShouldRender(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const activeCount = [draft.contentType, draft.authorType, draft.dateRange].filter(Boolean).length;

  const handleClear = () => {
    setDraft({ query: draft.query, contentType: null, authorType: null, dateRange: null, sort: 'newest' });
  };

  const handleApply = () => onApply(draft);

  return (
    <Modal visible={shouldRender} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.container, { backgroundColor: colors.pageBg, paddingTop: insets.top, transform: [{ translateX }] }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
          <View style={styles.headerRow}>
            <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Filter resources</Text>
            {activeCount > 0 && (
              <View style={[styles.activeBadge, { backgroundColor: colors.chip, borderColor: colors.goldLight, borderRadius: radius.md, borderWidth: borderWidth.thin }]}>
                <Text style={[fonts.bold, styles.activeBadgeText, { color: colors.goldDark }]}>{activeCount} active</Text>
              </View>
            )}
            <Pressable onPress={onClose} accessibilityLabel="Close" style={[styles.closeButton, { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.lg, borderWidth: borderWidth.thin }]}>
              <X size={14} color={colors.ink2} strokeWidth={1.7} />
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Resource type */}
          <View style={[styles.section, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
            <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink2 }]}>RESOURCE TYPE</Text>
            <View style={styles.chipsRow}>
              {CONTENT_TYPES.map(t => {
                const active = draft.contentType === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setDraft(d => ({ ...d, contentType: active ? null : t }))}
                    style={[
                      styles.filterChip,
                      { borderRadius: radius.lg },
                      active
                        ? { backgroundColor: colors.chip, borderColor: colors.gold, borderWidth: 1 }
                        : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin },
                    ]}
                  >
                    <Text style={[fonts.semibold, { fontSize: fontSize.small, color: active ? colors.goldDark : colors.ink2 }]}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Author type */}
          <View style={[styles.section, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
            <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink2 }]}>AUTHOR TYPE</Text>
            <View style={styles.chipsRow}>
              <Pressable
                onPress={() => setDraft(d => ({ ...d, authorType: null }))}
                style={[
                  styles.filterChip,
                  { borderRadius: radius.lg },
                  !draft.authorType
                    ? { backgroundColor: colors.feedFill, borderColor: colors.feedFill }
                    : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin },
                ]}
              >
                <Text style={[fonts.bold, { fontSize: fontSize.small, color: !draft.authorType ? colors.feedOnFill : colors.ink2 }]}>All</Text>
              </Pressable>
              {RESOURCE_AUTHOR_TYPES.map(a => {
                const active = draft.authorType === a.value;
                return (
                  <Pressable
                    key={a.value}
                    onPress={() => setDraft(d => ({ ...d, authorType: active ? null : a.value }))}
                    style={[
                      styles.filterChip,
                      { borderRadius: radius.lg },
                      active
                        ? { backgroundColor: colors.chip, borderColor: colors.gold, borderWidth: 1 }
                        : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin },
                    ]}
                  >
                    <Text style={[fonts.semibold, { fontSize: fontSize.small, color: active ? colors.goldDark : colors.ink2 }]}>{a.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Date added */}
          <View style={[styles.section, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
            <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink2 }]}>DATE ADDED</Text>
            <View style={styles.radioList}>
              {DATE_RANGES.map(d => {
                const active = (draft.dateRange ?? '') === d.value;
                return (
                  <Pressable key={d.value || 'any'} onPress={() => setDraft(p => ({ ...p, dateRange: d.value || null }))} style={styles.radioRow}>
                    <View style={[styles.radioOuter, { borderColor: active ? colors.gold : colors.border }]}>
                      {active && <View style={[styles.radioInner, { backgroundColor: colors.gold }]} />}
                    </View>
                    <Text style={[active ? fonts.bold : fonts.regular, styles.radioLabel, { color: active ? colors.ink : colors.ink2 }]}>{d.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Sort by */}
          <View style={styles.section}>
            <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink2 }]}>SORT BY</Text>
            <View style={styles.radioList}>
              {RESOURCE_SORTS.map(s => {
                const active = draft.sort === s.value;
                return (
                  <Pressable key={s.value} onPress={() => setDraft(p => ({ ...p, sort: s.value }))} style={styles.radioRow}>
                    <View style={[styles.radioOuter, { borderColor: active ? colors.gold : colors.border }]}>
                      {active && <View style={[styles.radioInner, { backgroundColor: colors.gold }]} />}
                    </View>
                    <Text style={[active ? fonts.bold : fonts.regular, styles.radioLabel, { color: active ? colors.ink : colors.ink2 }]}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [styles.clearLink, pressed && styles.pressed]}
          >
            <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.goldDark }]}>Clear all filters</Text>
          </Pressable>
          <Pressable
            onPress={handleApply}
            style={({ pressed }) => [styles.applyButton, { backgroundColor: colors.feedFill, borderRadius: radius.lg }, pressed && styles.pressed]}
          >
            <Check size={15} color={colors.feedOnFill} strokeWidth={1.9} />
            <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.feedOnFill }]}>
              {resultCount != null ? `Show ${resultCount} results` : 'Show results'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  title: {
    flex: 1,
    fontSize: 24,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  activeBadgeText: {
    fontSize: 11,
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexShrink: 1,
    paddingHorizontal: 18,
  },
  section: {
    paddingVertical: 18,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
    marginBottom: 13,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    height: 34,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioList: {
    gap: 2,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    height: 42,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  radioLabel: {
    fontSize: 13.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 16,
  },
  clearLink: {
    paddingVertical: 8,
  },
  applyButton: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: {
    opacity: 0.75,
  },
});
