import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { Pill } from '../Pill';
import { Button } from '../Button';
import { searchCities } from '../../api/location';
import { DateTimeField } from './CreateEventWizard/DateTimeField';

const CITY_SEARCH_DEBOUNCE_MS = 300;
const CITY_SEARCH_MIN_LENGTH = 2;

/** Only the day values web's own quick-pills + custom date input can ever produce
 * (`my-events/page.tsx`'s `filters.day`) — `today`/`tomorrow`/`next_week`/`weekend`/`soon` exist
 * in web's `applyDayFilter` switch but have no UI control that sets them on either platform, so
 * they're not modeled here. */
export type EventDay = 'any' | 'this_week' | 'this_month' | 'next_3m' | 'custom';

/**
 * Filter state — deliberately an exact functional match for web's real `filters` state
 * (`my-events/page.tsx:326`), not the richer/independent set this used to be (multi-select
 * type/location/city, a real custom date range, a Sort-by section). Web's `filters.format`,
 * `filters.rsvp_required`, and `filters.visibility` are excluded entirely — they exist in web's
 * state and its `displayedForGrid` filtering, but **no UI control on web ever sets them**, so
 * they're permanently-dead filters there; porting unreachable state would add nothing.
 */
export type EventsFilterState = {
  day: EventDay;
  customDate: string;
  /** '' | 'In-person' | 'Online' | 'Hybrid'. Web's "Event type" AND "Location type" sections
   * both write to the same `filters.event_type` field (`my-events/page.tsx` lines 990 & 1003) —
   * a real bug on web (picking a Location-type pill silently selects the same-index Event-type
   * pill, and vice versa). Deliberately NOT ported here — see `locationType` below — this is
   * one of the rare cases where a real web quirk is fixed rather than replicated, since the
   * "auto-selects the wrong section" behavior reads as broken rather than intentional. */
  eventType: string;
  /** Independent from `eventType` (unlike web) so picking a pill in one section never
   * visually selects a pill in the other. Both still filter the same real `event.event_type`
   * field on `MyEventsScreen.tsx`'s side, as two separately-choosable AND conditions — picking
   * a conflicting pair (e.g. Event type "Webinars" + Location type "In-Person") legitimately
   * yields zero matches, same as any other two-condition AND filter would. */
  locationType: string;
  /** Single selected/typed city — matches web's `filters.country` (a plain string, not a
   * multi-select array). Typing directly filters (substring match against `location`), same as
   * web; the suggestion list below is just a shortcut, not a separate "apply" step. */
  city: string;
};

export const EMPTY_EVENTS_FILTERS: EventsFilterState = {
  day: 'any',
  customDate: '',
  eventType: '',
  locationType: '',
  city: '',
};

export function countActiveEventFilters(f: EventsFilterState): number {
  return (
    (f.day !== 'any' ? 1 : 0) + (f.eventType ? 1 : 0) + (f.locationType ? 1 : 0) + (f.city ? 1 : 0)
  );
}

const EVENT_TYPE_OPTIONS = [
  { label: 'Chapter Events', value: 'In-person' },
  { label: 'Webinars', value: 'Online' },
  { label: 'Hybrid', value: 'Hybrid' },
];
const LOCATION_TYPE_OPTIONS = [
  { label: 'In-Person', value: 'In-person' },
  { label: 'Virtual', value: 'Online' },
  { label: 'Hybrid', value: 'Hybrid' },
];
const QUICK_DATE_OPTIONS: { value: EventDay; label: string }[] = [
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'next_3m', label: 'Next 3 months' },
];

/**
 * Full-screen filter page — chrome (Modal + manual slide-in, section grouping, Clear-all/Apply
 * footer) still modeled on `FilterPanel.tsx`, but every field inside now matches web's real
 * filter drawer exactly (`my-events/page.tsx` lines 971-1048): Event type / Location type (single
 * select, sharing one field per web's own bug) / Date range (3 quick pills + one custom date, no
 * true range) / Chapter-City (single select, live-search suggestions only, capped to 6). No
 * Sort-by section — web's filter drawer doesn't have one; the list's own default chronological
 * order is unchanged, just no longer user-selectable.
 *
 * Nests its own `SafeAreaProvider` inside the `Modal` rather than trusting the app-root one
 * (`App.tsx`) — `Modal` renders in a separate native window on Android, so insets measured
 * against the main window aren't guaranteed to apply there too. Same root cause/fix as
 * `DirectoryFiltersPanel.tsx`. The insets-consuming content (and every bit of state that only
 * matters to that content — filter draft, city search, the manual keyboard-scroll fix) is split
 * into `EventsFilterPageContent` because a component can't read a `Provider` it renders itself
 * later in the same return — `useSafeAreaInsets()` has to be called from *inside* the new nested
 * provider's subtree. The slide animation's `translateX` stays owned by this outer shell (it
 * drives `Modal`'s own `shouldRender` prop) and is passed down as a plain `Animated.Value` prop.
 */
export function EventsFilterPage({
  visible,
  initialFilters,
  onClose,
  onApply,
}: {
  visible: boolean;
  initialFilters: EventsFilterState;
  onClose: () => void;
  onApply: (filters: EventsFilterState) => void;
}) {
  const screenWidth = Dimensions.get('window').width;
  const [shouldRender, setShouldRender] = useState(visible);
  const translateX = useRef(new Animated.Value(visible ? 0 : screenWidth)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateX.setValue(screenWidth);
      Animated.timing(translateX, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateX, { toValue: screenWidth, duration: 220, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setShouldRender(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    // `statusBarTranslucent` — see `EventDetailView.tsx`'s identical fix for why: without it, this
    // Modal's status-bar coordinate handling is inconsistent across Android devices/versions.
    <Modal visible={shouldRender} animationType="none" transparent statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaProvider>
        <EventsFilterPageContent
          visible={visible}
          initialFilters={initialFilters}
          onClose={onClose}
          onApply={onApply}
          translateX={translateX}
        />
      </SafeAreaProvider>
    </Modal>
  );
}

function EventsFilterPageContent({
  visible,
  initialFilters,
  onClose,
  onApply,
  translateX,
}: {
  visible: boolean;
  initialFilters: EventsFilterState;
  onClose: () => void;
  onApply: (filters: EventsFilterState) => void;
  translateX: Animated.Value;
}) {
  const { colors, fonts, fontSize, spacing, radius, borderWidth, letterSpacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(initialFilters);
  const [liveCities, setLiveCities] = useState<string[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Same manual keyboard-scroll fix as `CreateChapterScreen.tsx` (see its doc comment for the
  // full root-cause writeup) rather than `KeyboardAvoidingView` — its Android resize behavior
  // doesn't reliably apply inside a `Modal`, which is exactly how the city search field ended up
  // hidden behind the keyboard here. Only one field in this screen can ever focus the keyboard
  // (the city search — `DateTimeField`'s date picker is its own native modal, not the soft
  // keyboard), so this measures `cityInputRef` directly rather than tracking a generic
  // "currently focused input" ref.
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const cityInputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (visible) setDraft(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      const kbHeight = e.endCoordinates?.height ?? 0;
      setKeyboardHeight(kbHeight);
      requestAnimationFrame(() => {
        cityInputRef.current?.measureInWindow((_x, y, _width, height) => {
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

  // Matches web's live `/api/location/cities` autocomplete exactly (`my-events/page.tsx:332-341`)
  // — suggestions come ONLY from this live call, no merge with a locally-known city list, and stay
  // empty below the 2-character minimum (no default/empty-state list either).
  useEffect(() => {
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    const trimmed = draft.city.trim();
    if (trimmed.length < CITY_SEARCH_MIN_LENGTH) {
      setLiveCities([]);
      setCityLoading(false);
      return;
    }
    setCityLoading(true);
    cityDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(trimmed);
        // The API can return duplicate city names (e.g. same city name in different
        // states/countries) — dedupe or `Pill key={city}` collides (React duplicate-key warning)
        // and the list shows the same suggestion twice.
        setLiveCities(Array.from(new Set(results.map(c => c.city))));
      } catch {
        setLiveCities([]);
      } finally {
        setCityLoading(false);
      }
    }, CITY_SEARCH_DEBOUNCE_MS);
    return () => {
      if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    };
  }, [draft.city]);

  const activeCount = countActiveEventFilters(draft);
  // Matches web's own `citySuggestions.slice(0, 6)` cap (`my-events/page.tsx:1034`).
  const cityStub = liveCities.slice(0, 6);

  return (
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

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.body, { paddingBottom: 20 + keyboardHeight }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={e => {
          scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <FilterSection title="Event type" count={draft.eventType ? 1 : 0}>
          <ChipWrap>
            {EVENT_TYPE_OPTIONS.map(opt => (
              <Pill
                key={opt.value}
                label={opt.label}
                selected={draft.eventType === opt.value}
                onPress={() => setDraft(prev => ({ ...prev, eventType: prev.eventType === opt.value ? '' : opt.value }))}
              />
            ))}
          </ChipWrap>
        </FilterSection>

        <FilterSection title="Location type" count={draft.locationType ? 1 : 0}>
          <ChipWrap>
            {LOCATION_TYPE_OPTIONS.map(opt => (
              <Pill
                key={opt.value}
                label={opt.label}
                selected={draft.locationType === opt.value}
                onPress={() => setDraft(prev => ({ ...prev, locationType: prev.locationType === opt.value ? '' : opt.value }))}
              />
            ))}
          </ChipWrap>
        </FilterSection>

        <FilterSection title="Date range" count={draft.day !== 'any' ? 1 : 0}>
          <DateTimeField
            value={draft.customDate}
            mode="date"
            placeholder="Select date"
            onChange={v => setDraft(prev => ({ ...prev, day: 'custom', customDate: v }))}
          />
          <View style={{ height: spacing.md }} />
          <ChipWrap>
            {QUICK_DATE_OPTIONS.map(opt => (
              <Pill
                key={opt.value}
                label={opt.label}
                selected={draft.day === opt.value}
                onPress={() => setDraft(prev => ({ ...prev, day: prev.day === opt.value ? 'any' : opt.value, customDate: '' }))}
              />
            ))}
          </ChipWrap>
        </FilterSection>

        <FilterSection title="Chapter / city" count={draft.city ? 1 : 0}>
          <View style={[styles.citySearch, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
            <Icon name="search" size={15} color={colors.ink3} />
            <TextInput
              ref={cityInputRef}
              value={draft.city}
              onChangeText={v => setDraft(prev => ({ ...prev, city: v }))}
              placeholder="Search city…"
              placeholderTextColor={colors.ink3}
              style={[styles.cityInput, { fontSize: fontSize.body, color: colors.ink }]}
            />
            {cityLoading && <ActivityIndicator size="small" color={colors.ink3} />}
          </View>
          {cityStub.length > 0 && (
            <>
              <View style={{ height: spacing.md }} />
              <ChipWrap>
                {cityStub.map(city => (
                  <Pill
                    key={city}
                    label={city}
                    selected={draft.city === city}
                    onPress={() => setDraft(prev => ({ ...prev, city: prev.city === city ? '' : city }))}
                  />
                ))}
              </ChipWrap>
            </>
          )}
        </FilterSection>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin, paddingBottom: 16 + insets.bottom }]}>
        <Button label="Clear all" icon="close" variant="secondary" disabled={activeCount === 0} onPress={() => setDraft(EMPTY_EVENTS_FILTERS)} />
        <Button label="Apply filters" icon="checkmark" variant="primary" fullWidth color="#182E43" onPress={() => onApply(draft)} />
      </View>
    </Animated.View>
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
  citySearch: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 46, paddingHorizontal: 13 },
  cityInput: { flex: 1, padding: 0 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  pressed: { opacity: 0.65 },
});
