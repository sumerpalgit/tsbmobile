import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Search, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { searchCities } from '../../api/location';
import { ROLE_TINT_COLORS, ROLE_TYPES, SUB_CATEGORIES } from '../../types/directory';
import type { DirectorySort, DirectoryStats } from '../../types/directory';
import type { CityResult } from '../../api/location';
import type { DirectoryFilters } from '../../hooks/useDirectory';

const SEARCH_DEBOUNCE_MS = 300;

/** Slide-in Filters panel — matches `Directory.html`'s "FILTERS" overlay (~line 435). Own
 * component rather than extending `components/home/FilterPanel.tsx` (that one is hard-coded to
 * Home's flat multi-select-pill/boolean-toggle shape; this one needs a role-type grid with
 * counts, sub-category chips gated on a role type being picked, and a debounced city search — a
 * structurally different shape). Only the slide-from-right `Animated.timing` +
 * mount-through-exit-animation `shouldRender` pattern is borrowed as a template, same source as
 * `NewMessageOverlay.tsx`'s identical technique.
 *
 * Single-select for every dimension (role type / sub-category / city) — see `useDirectory.ts`'s
 * doc comment: the real `/profile/search` endpoint only accepts one value per filter param, not
 * an array, despite the mockup's drawer rendering a multi-select checkbox grid for "User type". */
export function DirectoryFiltersPanel({
  visible,
  filters,
  sort,
  stats,
  onClose,
  onApply,
}: {
  visible: boolean;
  filters: DirectoryFilters;
  sort: DirectorySort;
  stats: DirectoryStats;
  onClose: () => void;
  onApply: (filters: DirectoryFilters, sort: DirectorySort) => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const screenWidth = Dimensions.get('window').width;
  const [shouldRender, setShouldRender] = useState(visible);
  const translateX = useRef(new Animated.Value(visible ? 0 : screenWidth)).current;

  const [draft, setDraft] = useState(filters);
  const [draftSort, setDraftSort] = useState(sort);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [searchingCities, setSearchingCities] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setDraft(filters);
      setDraftSort(sort);
      setCityQuery('');
      setCityResults([]);
      translateX.setValue(screenWidth);
      Animated.timing(translateX, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateX, { toValue: screenWidth, duration: 220, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setShouldRender(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!cityQuery.trim()) {
      setCityResults([]);
      return;
    }
    setSearchingCities(true);
    const timer = setTimeout(async () => {
      try {
        setCityResults(await searchCities(cityQuery.trim()));
      } catch {
        setCityResults([]);
      } finally {
        setSearchingCities(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [cityQuery]);

  const activeCount = [draft.roleType, draft.subCategory, draft.city].filter(Boolean).length;
  const subOptions = draft.roleType ? SUB_CATEGORIES[draft.roleType] ?? [] : [];

  const handleClear = () => {
    setDraft({ query: draft.query, roleType: null, subCategory: null, city: null });
    setDraftSort('default');
    setCityQuery('');
  };

  const handleApply = () => onApply(draft, draftSort);

  return (
    <Modal visible={shouldRender} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.container, { backgroundColor: colors.pageBg, paddingTop: insets.top, transform: [{ translateX }] }]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.eyebrowRow}>
                <View style={[styles.eyebrowDash, { backgroundColor: colors.gold }]} />
                <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>REFINE THE DIRECTORY</Text>
              </View>
              <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Filter members</Text>
            </View>
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
          {/* Sort */}
          <View style={[styles.section, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
            <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink }]}>SORT BY</Text>
            <View style={styles.chipsRow}>
              {(
                [
                  ['default', 'Most Recent'],
                  ['az', 'Alphabetical'],
                ] as const
              ).map(([key, label]) => {
                const active = draftSort === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setDraftSort(key)}
                    style={[
                      styles.filterChip,
                      { borderRadius: radius.lg },
                      active
                        ? { backgroundColor: colors.chip, borderColor: colors.goldLight, borderWidth: 1 }
                        : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin },
                    ]}
                  >
                    <Text style={[active ? fonts.bold : fonts.semibold, { fontSize: fontSize.small, color: active ? colors.goldDark : colors.ink2 }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* User type */}
          <View style={[styles.section, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink }]}>USER TYPE</Text>
              {!!draft.roleType && (
                <Pressable onPress={() => setDraft(d => ({ ...d, roleType: null, subCategory: null }))}>
                  <Text style={[fonts.bold, styles.clearLink, { color: colors.gold }]}>Clear</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.typeGrid}>
              {ROLE_TYPES.map(r => {
                const active = draft.roleType === r.value;
                const rgb = ROLE_TINT_COLORS[r.value] ?? '167,133,45';
                const count = stats.byRole[r.value];
                return (
                  <Pressable
                    key={r.value}
                    onPress={() => setDraft(d => ({ ...d, roleType: active ? null : r.value, subCategory: null }))}
                    style={[
                      styles.typeCard,
                      {
                        borderRadius: radius.lg,
                        backgroundColor: `rgba(${rgb},${active ? 0.16 : 0.07})`,
                        borderColor: `rgba(${rgb},${active ? 0.85 : 0.28})`,
                        borderWidth: active ? 2 : borderWidth.thin,
                      },
                    ]}
                  >
                    <View style={styles.typeCardTop}>
                      <Text style={[fonts.bold, styles.typeCardLabel, { color: colors.ink }]}>{r.label}</Text>
                      {active && (
                        <View style={[styles.typeCheck, { backgroundColor: `rgb(${rgb})` }]}>
                          <Check size={10} color="#fff" strokeWidth={2.4} />
                        </View>
                      )}
                    </View>
                    <Text style={[fonts.semibold, styles.typeCardCount, { color: colors.ink2 }]}>
                      {count != null ? `${count} users` : '—'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Sub role */}
          <View style={[styles.section, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink }]}>SUB ROLE</Text>
              <SelectionBadge count={draft.subCategory ? 1 : 0} />
            </View>
            {subOptions.length > 0 ? (
              <View style={styles.chipsRow}>
                {subOptions.map(label => {
                  const active = draft.subCategory === label;
                  return (
                    <Pressable
                      key={label}
                      onPress={() => setDraft(d => ({ ...d, subCategory: active ? null : label }))}
                      style={[
                        styles.filterChip,
                        { borderRadius: radius.lg },
                        active
                          ? { backgroundColor: colors.feedFill, borderColor: colors.feedFill }
                          : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin },
                      ]}
                    >
                      <Text style={[fonts.semibold, { fontSize: fontSize.small, color: active ? colors.feedOnFill : colors.ink2 }]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.hintBox, { backgroundColor: colors.surfaceSunken, borderRadius: radius.lg }]}>
                <Text style={[fonts.regular, styles.hintText, { color: colors.ink3 }]}>Pick a user type above to narrow by sub role.</Text>
              </View>
            )}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink }]}>LOCATION</Text>
              <SelectionBadge count={draft.city ? 1 : 0} />
            </View>
            <View style={[styles.citySearchRow, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: borderWidth.thin }]}>
              <Search size={15} color={colors.ink3} strokeWidth={1.6} />
              <TextInput
                value={cityQuery}
                onChangeText={setCityQuery}
                placeholder="Search city…"
                placeholderTextColor={colors.ink3}
                style={[fonts.regular, styles.cityInput, { fontSize: fontSize.body, color: colors.ink }]}
              />
              {searchingCities && <ActivityIndicator size="small" color={colors.gold} />}
            </View>
            {draft.city && (
              <View style={styles.chipsRow}>
                <Pressable
                  onPress={() => setDraft(d => ({ ...d, city: null }))}
                  style={[styles.filterChip, { backgroundColor: colors.feedFill, borderColor: colors.feedFill, borderRadius: radius.lg, flexDirection: 'row', gap: 6, alignItems: 'center' }]}
                >
                  <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.feedOnFill }]}>
                    {draft.city.city}, {draft.city.stateCode}
                  </Text>
                  <X size={11} color={colors.feedOnFill} strokeWidth={1.9} />
                </Pressable>
              </View>
            )}
            {cityQuery.trim().length > 0 && (
              <View style={styles.chipsRow}>
                {cityResults.length === 0 && !searchingCities ? (
                  <Text style={[fonts.regular, styles.noCitiesText, { color: colors.ink3 }]}>No cities match "{cityQuery}".</Text>
                ) : (
                  cityResults.map(c => (
                    <Pressable
                      key={`${c.city}-${c.stateCode}-${c.countryCode}`}
                      onPress={() => {
                        setDraft(d => ({ ...d, city: c }));
                        setCityQuery('');
                        setCityResults([]);
                      }}
                      style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: borderWidth.thin }]}
                    >
                      <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>
                        {c.city}, {c.stateCode}
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [
              styles.clearButton,
              { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: borderWidth.thin },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>Clear</Text>
          </Pressable>
          <Pressable
            onPress={handleApply}
            style={({ pressed }) => [styles.applyButton, { backgroundColor: colors.gold, borderRadius: radius.lg }, pressed && styles.pressed]}
          >
            <Check size={15} color="#fff" strokeWidth={1.9} />
            <Text style={[fonts.bold, { fontSize: fontSize.body, color: '#fff' }]}>Apply filters</Text>
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

/** Matches the mockup's `badge(n)` helper (~line 899) — "Any" (neutral) or "{n} selected"
 * (gold-tinted), shown next to the Sub role / Location section labels. */
function SelectionBadge({ count }: { count: number }) {
  const { colors, fonts, radius } = useTheme();
  return (
    <View
      style={[
        styles.selectionBadge,
        { borderRadius: radius.sm },
        count > 0 ? { backgroundColor: colors.chip } : { backgroundColor: colors.surfaceSunken },
      ]}
    >
      <Text style={[fonts.bold, styles.selectionBadgeText, { color: count > 0 ? colors.goldDark : colors.ink3 }]}>
        {count > 0 ? `${count} selected` : 'Any'}
      </Text>
    </View>
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
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowDash: {
    width: 16,
    height: 2,
    borderRadius: 2,
  },
  eyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 27,
    marginTop: 8,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  sectionLabel: {
    flex: 1,
    fontSize: 12,
    letterSpacing: 0.6,
  },
  clearLink: {
    fontSize: 12,
  },
  selectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  selectionBadgeText: {
    fontSize: 10.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    height: 34,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  typeCard: {
    width: '47%',
    padding: 12,
  },
  typeCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  typeCardLabel: {
    fontSize: 13.5,
    lineHeight: 17,
  },
  typeCardCount: {
    fontSize: 11.5,
    marginTop: 6,
  },
  typeCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBox: {
    padding: 12,
    marginTop: 12,
  },
  hintText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  citySearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 46,
    paddingHorizontal: 13,
    marginTop: 12,
  },
  cityInput: {
    flex: 1,
    padding: 0,
  },
  noCitiesText: {
    fontSize: 12.5,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  clearButton: {
    height: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: {
    opacity: 0.75,
  },
});
