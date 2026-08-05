import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { Pill } from '../Pill';
import { Button } from '../Button';
import type { EventTab } from './EventsControls';

export type EventDateRange = 'any' | 'week' | 'month' | 'quarter' | 'custom';
export type EventSort = 'soon' | 'late' | 'az';

export type EventsFilterState = {
  types: string[];
  locs: string[];
  cities: string[];
  dateRange: EventDateRange;
  dateFrom: string;
  dateTo: string;
  sort: EventSort;
};

export const EMPTY_EVENTS_FILTERS: EventsFilterState = {
  types: [],
  locs: [],
  cities: [],
  dateRange: 'any',
  dateFrom: '',
  dateTo: '',
  sort: 'soon',
};

export function countActiveEventFilters(f: EventsFilterState): number {
  return f.types.length + f.locs.length + f.cities.length + (f.dateRange !== 'any' ? 1 : 0);
}

const EVENT_TYPES = ['Chapter Event', 'Webinar', 'Workshop', 'Networking', 'Conference', 'Technical'];
const LOCATION_TYPES = ['In-Person', 'Virtual', 'Hybrid'];
const DATE_OPTIONS: { value: EventDateRange; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'quarter', label: 'Next 3 months' },
  { value: 'custom', label: 'Custom range' },
];

/**
 * Full-screen filter page — event type / location type / date range (+ custom from-to) / city
 * search / sort, modeled directly on `FilterPanel.tsx` (same Modal + manual slide-in mechanism,
 * same section grouping, same Clear-all/Apply footer) since that's the closest existing analog.
 * Sort options depend on the active tab, matching the mockup exactly (`myevents_decoded.html`
 * ~line 1270: "Most recent first"/"Oldest first" for Past vs "soonest"/"latest" for Upcoming).
 */
export function EventsFilterPage({
  visible,
  activeTab,
  initialFilters,
  cityOptions,
  onClose,
  onApply,
}: {
  visible: boolean;
  activeTab: EventTab;
  initialFilters: EventsFilterState;
  cityOptions: string[];
  onClose: () => void;
  onApply: (filters: EventsFilterState) => void;
}) {
  const { colors, fonts, fontSize, spacing, radius, borderWidth, letterSpacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(initialFilters);
  const [cityQuery, setCityQuery] = useState('');

  const screenWidth = Dimensions.get('window').width;
  const [shouldRender, setShouldRender] = useState(visible);
  const translateX = useRef(new Animated.Value(visible ? 0 : screenWidth)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setDraft(initialFilters);
      setCityQuery('');
      translateX.setValue(screenWidth);
      Animated.timing(translateX, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateX, { toValue: screenWidth, duration: 220, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setShouldRender(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggleArrayValue = (key: 'types' | 'locs' | 'cities', value: string) => {
    setDraft(prev => {
      const current = prev[key];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const activeCount = countActiveEventFilters(draft);
  const filteredCities = cityOptions.filter(c => c.toLowerCase().includes(cityQuery.trim().toLowerCase()));

  const sortOptions: { value: EventSort; label: string }[] =
    activeTab === 'past'
      ? [
          { value: 'soon', label: 'Most recent first' },
          { value: 'late', label: 'Oldest first' },
          { value: 'az', label: 'Title A–Z' },
        ]
      : [
          { value: 'soon', label: 'Date · soonest' },
          { value: 'late', label: 'Date · latest' },
          { value: 'az', label: 'Title A–Z' },
        ];

  return (
    // `statusBarTranslucent` — see `EventDetailView.tsx`'s identical fix for why: without it, this
    // Modal's status-bar coordinate handling is inconsistent across Android devices/versions.
    <Modal visible={shouldRender} animationType="none" transparent statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.container, { backgroundColor: colors.pageBg, paddingTop: insets.top, transform: [{ translateX }] }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.eyebrowRow}>
                <View style={[styles.eyebrowDash, { backgroundColor: colors.gold }]} />
                <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark, letterSpacing: letterSpacing.wider }]}>
                  Refine your events
                </Text>
              </View>
              <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Filter events</Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => [
                styles.closeButton,
                { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.lg },
                pressed && styles.pressed,
              ]}
            >
              <Icon name="close" size={14} color={colors.ink2} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <FilterSection title="Event type" count={draft.types.length}>
            <ChipWrap>
              {EVENT_TYPES.map(type => (
                <Pill key={type} label={type} selected={draft.types.includes(type)} onPress={() => toggleArrayValue('types', type)} />
              ))}
            </ChipWrap>
          </FilterSection>

          <FilterSection title="Location type" count={draft.locs.length}>
            <ChipWrap>
              {LOCATION_TYPES.map(loc => (
                <Pill key={loc} label={loc} selected={draft.locs.includes(loc)} onPress={() => toggleArrayValue('locs', loc)} />
              ))}
            </ChipWrap>
          </FilterSection>

          <FilterSection title="Date range" count={draft.dateRange !== 'any' ? 1 : 0}>
            <ChipWrap>
              {DATE_OPTIONS.map(opt => (
                <Pill
                  key={opt.value}
                  label={opt.label}
                  selected={draft.dateRange === opt.value}
                  onPress={() => setDraft(prev => ({ ...prev, dateRange: opt.value }))}
                />
              ))}
            </ChipWrap>
            {draft.dateRange === 'custom' && (
              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[fonts.bold, styles.dateLabel, { color: colors.ink3 }]}>From</Text>
                  <TextInput
                    value={draft.dateFrom}
                    onChangeText={v => setDraft(prev => ({ ...prev, dateFrom: v }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.ink3}
                    style={[
                      fonts.semibold,
                      styles.dateInput,
                      { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink },
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[fonts.bold, styles.dateLabel, { color: colors.ink3 }]}>To</Text>
                  <TextInput
                    value={draft.dateTo}
                    onChangeText={v => setDraft(prev => ({ ...prev, dateTo: v }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.ink3}
                    style={[
                      fonts.semibold,
                      styles.dateInput,
                      { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink },
                    ]}
                  />
                </View>
              </View>
            )}
          </FilterSection>

          <FilterSection title="Chapter / city" count={draft.cities.length}>
            <View style={[styles.citySearch, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
              <Icon name="search" size={15} color={colors.ink3} />
              <TextInput
                value={cityQuery}
                onChangeText={setCityQuery}
                placeholder="Search city…"
                placeholderTextColor={colors.ink3}
                style={[styles.cityInput, { fontSize: fontSize.body, color: colors.ink }]}
              />
            </View>
            <View style={{ height: spacing.md }} />
            {filteredCities.length > 0 ? (
              <ChipWrap>
                {filteredCities.map(city => (
                  <Pill key={city} label={city} selected={draft.cities.includes(city)} onPress={() => toggleArrayValue('cities', city)} />
                ))}
              </ChipWrap>
            ) : (
              <Text style={[fonts.regular, { fontSize: fontSize.small, color: colors.ink3 }]}>No cities match “{cityQuery}”.</Text>
            )}
          </FilterSection>

          <FilterSection title="Sort by">
            {sortOptions.map((opt, index) => {
              const active = draft.sort === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setDraft(prev => ({ ...prev, sort: opt.value }))}
                  style={({ pressed }) => [
                    styles.sortRow,
                    index < sortOptions.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: borderWidth.hairline },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[fonts.semibold, styles.sortLabel, { color: colors.ink }]}>{opt.label}</Text>
                  <View
                    style={[
                      styles.radio,
                      { borderRadius: radius.pill },
                      active
                        ? { borderColor: colors.gold, borderWidth: 6, backgroundColor: colors.surface }
                        : { borderColor: colors.border, borderWidth: borderWidth.thick, backgroundColor: colors.surface },
                    ]}
                  />
                </Pressable>
              );
            })}
          </FilterSection>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin, paddingBottom: 16 + insets.bottom }]}>
          <Button label="Clear all" icon="close" variant="secondary" disabled={activeCount === 0} onPress={() => setDraft(EMPTY_EVENTS_FILTERS)} />
          <Button label="Apply filters" icon="checkmark" variant="primary" fullWidth onPress={() => onApply(draft)} />
        </View>
      </Animated.View>
    </Modal>
  );
}

function FilterSection({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  const { colors, fonts, radius } = useTheme();
  const hasBadge = count !== undefined;

  return (
    <View style={[styles.section, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <View style={styles.sectionHeader}>
        <Text style={[fonts.bold, styles.sectionTitle, { color: colors.ink }]}>{title}</Text>
        {hasBadge && (
          <View style={[styles.badge, { borderRadius: radius.lg, backgroundColor: count! > 0 ? colors.chip : colors.surfaceSunken }]}>
            <Text style={[fonts.bold, styles.badgeText, { color: count! > 0 ? colors.goldDark : colors.ink3 }]}>
              {count! > 0 ? `${count} selected` : 'Any'}
            </Text>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

function ChipWrap({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipWrap}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 18, paddingVertical: 15 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrowDash: { width: 16, height: 2, borderRadius: 2 },
  eyebrow: { fontSize: 11, textTransform: 'uppercase' },
  title: { fontSize: 27, marginTop: 8, lineHeight: 30 },
  closeButton: { width: 34, height: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 18, paddingBottom: 20 },
  section: { paddingVertical: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 13 },
  sectionTitle: { flex: 1, fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase' },
  badge: { paddingHorizontal: 11, paddingVertical: 4 },
  badgeText: { fontSize: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dateLabel: { fontSize: 10.5, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  dateInput: { height: 44, paddingHorizontal: 12, fontSize: 12.5 },
  citySearch: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 46, paddingHorizontal: 13 },
  cityInput: { flex: 1, padding: 0 },
  sortRow: { flexDirection: 'row', alignItems: 'center', height: 50 },
  sortLabel: { flex: 1, fontSize: 14 },
  radio: { width: 20, height: 20 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  pressed: { opacity: 0.65 },
});
