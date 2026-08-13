import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
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
import { Check, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { DateTimeField } from '../events/CreateEventWizard/DateTimeField';
import { countActiveFilterCategories, EMPTY_AD_FILTERS, PLACEMENT_LABELS, STATUS_LABELS } from '../../types/adManagement';
import type { AdFilters, AdPlacement, AdStatus } from '../../types/adManagement';

const STATUS_OPTIONS: AdStatus[] = ['active', 'review', 'paused', 'draft', 'ended'];
const PLACEMENT_OPTIONS: AdPlacement[] = ['home', 'eta', 'both'];

/** Slide-in Filters panel — same `Animated.timing` slide-from-right + mount-through-exit-animation
 * chrome as `DirectoryFiltersPanel.tsx`/`ResourceFiltersPanel.tsx` (eyebrow/title header with an
 * active-count badge, sectioned scroll body, Clear/Apply footer). This app's own established
 * filter-panel convention is followed here deliberately, over the Ad Management mockup's own
 * bottom-sheet design, for consistency across every screen's filter UI — a screen-by-screen
 * mockup-vs-app-convention call the user made explicitly (see also `AdManagementScreen.tsx`'s own
 * doc comment on the matching `SearchBar` decision for the filter *button*).
 *
 * Keyboard fix: same root cause and fix as `ContributeResourceSheet.tsx` found for its own text
 * fields — `KeyboardAvoidingView` doesn't reliably resize content inside a `Modal` on Android (the
 * `Modal` renders in its own native window), so the Budget Min/Max inputs need the keyboard height
 * tracked and the focused input scrolled clear of it manually rather than relying on
 * `KeyboardAvoidingView` alone. */
export function AdFiltersPanel({
  visible,
  filters,
  statusCounts,
  onClose,
  onApply,
}: {
  visible: boolean;
  filters: AdFilters;
  statusCounts: Record<AdStatus, number>;
  onClose: () => void;
  onApply: (filters: AdFilters) => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const screenWidth = Dimensions.get('window').width;
  const [shouldRender, setShouldRender] = useState(visible);
  const translateX = useRef(new Animated.Value(visible ? 0 : screenWidth)).current;
  const [draft, setDraft] = useState(filters);

  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const focusedInputRef = useRef<TextInput | null>(null);
  const minInputRef = useRef<TextInput>(null);
  const maxInputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  // Ported verbatim from `ContributeResourceSheet.tsx` — not reinvented, same root cause/fix.
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      const kbHeight = e.endCoordinates?.height ?? 0;
      setKeyboardHeight(kbHeight);
      const input = focusedInputRef.current;
      if (!input) return;
      requestAnimationFrame(() => {
        input.measureInWindow((_x, y, _width, height) => {
          const keyboardTop = Dimensions.get('window').height - kbHeight;
          const overlap = y + height - keyboardTop;
          if (overlap > 0) {
            scrollRef.current?.scrollTo({ y: scrollOffsetRef.current + overlap + 12, animated: true });
          }
        });
      });
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const toggleStatus = (s: AdStatus) =>
    setDraft(d => ({ ...d, statuses: d.statuses.includes(s) ? d.statuses.filter(x => x !== s) : [...d.statuses, s] }));
  const togglePlacement = (p: AdPlacement) =>
    setDraft(d => ({ ...d, placements: d.placements.includes(p) ? d.placements.filter(x => x !== p) : [...d.placements, p] }));

  const activeCount = countActiveFilterCategories(draft);

  return (
    <Modal visible={shouldRender} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.container, { backgroundColor: colors.pageBg, paddingTop: insets.top, transform: [{ translateX }] }]}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.eyebrowRow}>
                  <View style={[styles.eyebrowDash, { backgroundColor: colors.gold }]} />
                  <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>REFINE YOUR CAMPAIGNS</Text>
                </View>
                <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Filters</Text>
              </View>
              {activeCount > 0 && (
                <View style={[styles.activeBadge, { backgroundColor: colors.chip, borderColor: colors.goldLight, borderRadius: radius.md, borderWidth: borderWidth.thin }]}>
                  <Text style={[fonts.bold, styles.activeBadgeText, { color: colors.goldDark }]}>{activeCount} active</Text>
                </View>
              )}
              <Pressable
                onPress={onClose}
                accessibilityLabel="Close"
                style={[styles.closeButton, { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.lg, borderWidth: borderWidth.thin }]}
              >
                <X size={14} color={colors.ink2} strokeWidth={1.7} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: 16 + keyboardHeight }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={e => {
              scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
          >
            <View style={[styles.section, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
              <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink }]}>STATUS</Text>
              <View style={{ gap: 8, marginTop: 13 }}>
                {STATUS_OPTIONS.map(s => {
                  const active = draft.statuses.includes(s);
                  return (
                    <Pressable key={s} onPress={() => toggleStatus(s)} style={styles.checkRow}>
                      <View
                        style={[
                          styles.checkbox,
                          { borderRadius: radius.sm, borderColor: active ? colors.gold : colors.border, backgroundColor: active ? colors.gold : 'transparent' },
                        ]}
                      >
                        {active && <Check size={12} color="#fff" strokeWidth={2.4} />}
                      </View>
                      <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink, flex: 1 }]}>{STATUS_LABELS[s]}</Text>
                      <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]}>{statusCounts[s]}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
              <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink }]}>PLACEMENT</Text>
              <View style={styles.chipsRow}>
                {PLACEMENT_OPTIONS.map(p => {
                  const active = draft.placements.includes(p);
                  return (
                    <Pressable
                      key={p}
                      onPress={() => togglePlacement(p)}
                      style={[
                        styles.filterChip,
                        { borderRadius: radius.lg },
                        active
                          ? { backgroundColor: colors.chip, borderColor: colors.goldLight, borderWidth: 1 }
                          : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin },
                      ]}
                    >
                      <Text style={[active ? fonts.bold : fonts.semibold, { fontSize: fontSize.small, color: active ? colors.goldDark : colors.ink2 }]}>
                        {PLACEMENT_LABELS[p]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
              <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink }]}>BUDGET RANGE</Text>
              <View style={styles.budgetRow}>
                <TextInput
                  ref={minInputRef}
                  value={draft.minBudget}
                  onChangeText={t => setDraft(d => ({ ...d, minBudget: t.replace(/[^0-9]/g, '') }))}
                  onFocus={() => (focusedInputRef.current = minInputRef.current)}
                  placeholder="$ Min"
                  placeholderTextColor={colors.ink3}
                  keyboardType="number-pad"
                  style={[styles.input, { borderColor: colors.border, borderRadius: radius.lg, color: colors.ink, backgroundColor: colors.surface }]}
                />
                <View style={[styles.dash, { backgroundColor: colors.border }]} />
                <TextInput
                  ref={maxInputRef}
                  value={draft.maxBudget}
                  onChangeText={t => setDraft(d => ({ ...d, maxBudget: t.replace(/[^0-9]/g, '') }))}
                  onFocus={() => (focusedInputRef.current = maxInputRef.current)}
                  placeholder="$ Max"
                  placeholderTextColor={colors.ink3}
                  keyboardType="number-pad"
                  style={[styles.input, { borderColor: colors.border, borderRadius: radius.lg, color: colors.ink, backgroundColor: colors.surface }]}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink }]}>DATE RANGE</Text>
              <View style={{ gap: 10, marginTop: 13 }}>
                <View>
                  <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>Starts on or after</Text>
                  <DateTimeField value={draft.startAfter} mode="date" placeholder="Any" onChange={v => setDraft(d => ({ ...d, startAfter: v }))} />
                </View>
                <View>
                  <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>Ends on or before</Text>
                  <DateTimeField value={draft.endBefore} mode="date" placeholder="Any" onChange={v => setDraft(d => ({ ...d, endBefore: v }))} />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
            <Pressable
              onPress={() => setDraft(EMPTY_AD_FILTERS)}
              style={({ pressed }) => [styles.clearButton, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: borderWidth.thin }, pressed && styles.pressed]}
            >
              <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>Clear</Text>
            </Pressable>
            <Pressable
              onPress={() => onApply(draft)}
              style={({ pressed }) => [styles.applyButton, { backgroundColor: '#182E43', borderRadius: radius.lg }, pressed && styles.pressed]}
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
  sectionLabel: {
    fontSize: 12.5,
    letterSpacing: 0.8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 13,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 13,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  dash: {
    width: 8,
    height: 1.5,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  clearButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButton: {
    flex: 1.5,
    height: 48,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
