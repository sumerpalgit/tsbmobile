import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import {
  DATE_RANGE_OPTIONS,
  EMPTY_MY_MATCHES_FILTERS,
  FIT_SCORE_OPTIONS,
  FIT_STATUS_OPTIONS,
  POSTS_STATUS_OPTIONS,
  POST_TYPE_OPTIONS,
  countActiveMyMatchesFilters,
  type FilterOption,
  type MyMatchesFilters,
} from '../../utils/myMatchesFilters';

/**
 * Slide-in Filters panel for My Matches.
 *
 * Follows this app's established filter-panel convention rather than web's own design: web renders
 * an inline expandable panel of radio columns beneath the toolbar, but every filter surface in this
 * app — Home, Directory, Resources, Ad Management, My Events — is a full-screen panel that slides
 * in from the right with an eyebrow/title header, sectioned scroll body and a Clear/Apply footer.
 * Matching the app is the right call here; a screen-specific filter UI would be the odd one out.
 * Chrome copied from `adManagement/AdFiltersPanel.tsx`, which is the newest expression of it.
 *
 * `Modal`'s own `animationType` cannot express this — it only slides vertically — hence the manual
 * `translateX` timing, and `shouldRender` keeping the modal mounted through the exit animation.
 *
 * Edits are staged in `draft` and only committed on Apply, matching every other panel in the app.
 * Clear resets the draft only; the user still has to press Apply.
 */

export function MyMatchesFiltersPanel({
  visible,
  filters,
  isFitTab,
  countFor,
  onClose,
  onApply,
}: {
  visible: boolean;
  filters: MyMatchesFilters;
  /** Which tab is open. Match Status has different options per tab, and Fit Score exists only on
   * "Where I'm a Fit" — posts carry no score of their own. */
  isFitTab: boolean;
  /** Counts rows for an arbitrary filter set. Takes a function rather than a number so the
   * "Show N results" button can track the **draft** as the user taps, not the filters currently
   * applied behind the panel — with draft-then-Apply staging those two differ, and a stale count
   * on the button that commits the draft would be actively misleading. */
  countFor: (filters: MyMatchesFilters) => number;
  onClose: () => void;
  onApply: (filters: MyMatchesFilters) => void;
}) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const [shouldRender, setShouldRender] = useState(visible);
  const translateX = useRef(new Animated.Value(visible ? 0 : screenWidth)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateX.setValue(screenWidth);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: screenWidth,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setShouldRender(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={shouldRender} animationType="none" transparent onRequestClose={onClose}>
      <SafeAreaProvider>
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: colors.pageBg, transform: [{ translateX }] },
          ]}>
          <PanelContent
            visible={visible}
            filters={filters}
            isFitTab={isFitTab}
            countFor={countFor}
            onClose={onClose}
            onApply={onApply}
          />
        </Animated.View>
      </SafeAreaProvider>
    </Modal>
  );
}

/**
 * Split out because `useSafeAreaInsets()` has to run *inside* the `SafeAreaProvider` rendered
 * above — a component cannot read a provider it renders itself. `Modal` gets its own native window
 * on Android, so insets measured against the main window are not guaranteed to apply here.
 */
function PanelContent({
  visible,
  filters,
  isFitTab,
  countFor,
  onClose,
  onApply,
}: {
  visible: boolean;
  filters: MyMatchesFilters;
  isFitTab: boolean;
  countFor: (filters: MyMatchesFilters) => number;
  onClose: () => void;
  onApply: (filters: MyMatchesFilters) => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(filters);

  // Re-sync each time the panel opens, so a cancelled edit doesn't persist into the next open.
  useEffect(() => {
    if (!visible) return;
    setDraft(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const activeCount = countActiveMyMatchesFilters(draft);
  const resultCount = countFor(draft);
  const set = (key: keyof MyMatchesFilters, value: string) =>
    setDraft(prev => ({ ...prev, [key]: value }));

  const renderGroup = (
    label: string,
    key: keyof MyMatchesFilters,
    options: FilterOption[],
    resetValue: string,
  ) => (
    <View
      style={[
        styles.section,
        { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin },
      ]}>
      <View style={styles.sectionHeader}>
        <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink }]}>{label}</Text>
        <View
          style={[
            styles.badge,
            {
              borderRadius: radius.lg,
              backgroundColor: draft[key] !== resetValue ? colors.chip : colors.surfaceSunken,
            },
          ]}>
          <Text
            style={[
              fonts.bold,
              styles.badgeText,
              { color: draft[key] !== resetValue ? colors.goldDark : colors.ink3 },
            ]}>
            {draft[key] !== resetValue
              ? (options.find(o => o.value === draft[key])?.label ?? '1 selected')
              : 'Any'}
          </Text>
        </View>
      </View>

      <View style={styles.chipsRow}>
        {options.map(option => {
          const active = draft[key] === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => set(key, option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[
                styles.filterChip,
                { borderRadius: radius.lg },
                active
                  ? { backgroundColor: colors.chip, borderColor: colors.goldLight, borderWidth: 1 }
                  : {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: borderWidth.thin,
                    },
              ]}>
              <Text
                style={[
                  active ? fonts.bold : fonts.semibold,
                  { fontSize: fontSize.small, color: active ? colors.goldDark : colors.ink2 },
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            borderBottomWidth: borderWidth.thin,
            paddingTop: 15 + insets.top,
          },
        ]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.eyebrowRow}>
              <View style={[styles.eyebrowDash, { backgroundColor: colors.gold }]} />
              <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>
                REFINE YOUR MATCHES
              </Text>
            </View>
            <Text style={[fonts.display, styles.title, { color: colors.ink }]}>
              {isFitTab ? 'Filter matches' : 'Filter posts'}
            </Text>
          </View>

          {activeCount > 0 && (
            <View
              style={[
                styles.activeBadge,
                {
                  backgroundColor: colors.chip,
                  borderColor: colors.goldLight,
                  borderRadius: radius.md,
                  borderWidth: borderWidth.thin,
                },
              ]}>
              <Text style={[fonts.bold, styles.activeBadgeText, { color: colors.goldDark }]}>
                {activeCount} active
              </Text>
            </View>
          )}

          <Pressable
            onPress={onClose}
            accessibilityLabel="Close"
            style={[
              styles.closeButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface2,
                borderRadius: radius.lg,
                borderWidth: borderWidth.thin,
              },
            ]}>
            <X size={14} color={colors.ink2} strokeWidth={1.7} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 12 }}>
        {renderGroup('POST TYPE', 'postType', POST_TYPE_OPTIONS, 'all')}
        {renderGroup(
          'MATCH STATUS',
          'matchStatus',
          isFitTab ? FIT_STATUS_OPTIONS : POSTS_STATUS_OPTIONS,
          'all',
        )}
        {/* Fit Score is "Where I'm a Fit" only — a post has no score of its own, only its
            matches do. Web hides the whole column the same way (`page.tsx:589`). */}
        {isFitTab ? renderGroup('FIT SCORE', 'fitScore', FIT_SCORE_OPTIONS, 'any') : null}
        {/* Same options either way, but a different date: when the post went up vs. when the
            match surfaced. Web renames the heading for exactly that reason (`page.tsx:617`). */}
        {renderGroup(
          isFitTab ? 'SURFACED' : 'DATE POSTED',
          'dateRange',
          DATE_RANGE_OPTIONS,
          'any',
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: borderWidth.thin,
            paddingBottom: 16 + insets.bottom,
          },
        ]}>
        <Pressable
          onPress={() => setDraft(EMPTY_MY_MATCHES_FILTERS)}
          disabled={activeCount === 0}
          style={({ pressed }) => [
            styles.clearButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: borderWidth.thin,
              opacity: activeCount === 0 ? 0.5 : 1,
            },
            pressed && styles.pressed,
          ]}>
          <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>
            Clear
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onApply(draft)}
          style={({ pressed }) => [
            styles.applyButton,
            { backgroundColor: '#182E43', borderRadius: radius.lg },
            pressed && styles.pressed,
          ]}>
          <Check size={15} color="#fff" strokeWidth={1.9} />
          <Text style={[fonts.bold, { fontSize: fontSize.body, color: '#fff' }]}>
            Show {resultCount} result{resultCount === 1 ? '' : 's'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12.5,
    letterSpacing: 0.8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10.5,
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  pressed: {
    opacity: 0.85,
  },
});
