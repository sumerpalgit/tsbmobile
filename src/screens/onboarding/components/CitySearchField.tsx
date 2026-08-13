import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { CityResult, searchCities } from '../../../api/location';
import { Measurable } from '../constants';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 6;

export type CitySelection = {
  city: string;
  stateCode: string;
  countryCode: string;
  /** Not needed for `complete-profile`'s payload (that only wants the code) — carried through so
   * Step 2 can match it against chapter names/descriptions, same as web's proximity sort. */
  countryName: string;
};

/**
 * Live city search — plain `TextInput` + an in-flow suggestion list below it, matching this
 * app's established city-search pattern (`EventsFilterPage.tsx`/`DirectoryFiltersPanel.tsx`/
 * `StepWhenWhere.tsx`'s `VenueField`), not the `react-native-element-dropdown`-based popup this
 * used to be built on. That same library was already ripped out of `FieldSelect.tsx` after
 * "three rounds of positioning bugs" — its popup computes position from its own internal
 * measurement inside its own separately-mounted `Modal`, which drifts once there's more than one
 * `Modal`/keyboard-avoiding layer in the tree. Onboarding sits under exactly that combination
 * (`KeyboardAvoidingView` + `KeyboardAwareScrollView`), so it was exposed to the same risk —
 * confirmed live on-device (dropdown popup misbehaving alongside the keyboard on Step 1).
 * Debounce/min-length/endpoint unchanged (300ms, 2 chars, `GET /api/location/cities?search=`).
 *
 * A strict single-select despite the free-editable `TextInput`: typing only ever updates the
 * local search query, never calls `onSelect` — that only fires when a suggestion is actually
 * tapped, so `OnboardingScreen.tsx`'s `citySelection` state (and its "Select your city." Continue
 * guard) can't be satisfied by typed-but-unpicked text, same as the other city fields above.
 */
export function CitySearchField({
  placeholder,
  onSelect,
  onFieldFocus,
}: {
  placeholder: string;
  onSelect: (city: CitySelection) => void;
  /** See `Step1Fields.tsx`'s own doc comment on this same prop name — called on this field's own
   * focus, and again (pointed at the suggestion list instead) once results actually arrive, so
   * the caller can scroll far enough to reveal the first result or two, not just the input. */
  onFieldFocus?: (ref: React.RefObject<Measurable | null>) => void;
}) {
  const { colors, fonts, fontSize } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<View>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = text.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        setResults(await searchCities(trimmed));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const selectCity = (city: CityResult) => {
    setQuery(`${city.city}, ${city.stateCode}`);
    setResults([]);
    setLoading(false);
    inputRef.current?.blur();
    onSelect({ city: city.city, stateCode: city.stateCode, countryCode: city.countryCode, countryName: city.countryName });
  };

  const shown = results.slice(0, MAX_SUGGESTIONS);

  // Re-point the parent's scroll-clear-the-keyboard fix at the suggestion list itself once it
  // actually has rows to show — waits a frame so `listRef` reflects the just-rendered list's real
  // height/position, not the previous (empty) layout.
  useEffect(() => {
    if (shown.length === 0) return;
    requestAnimationFrame(() => onFieldFocus?.(listRef));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown.length]);

  return (
    <View>
      <View style={{ position: 'relative' }}>
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={v => {
            setQuery(v);
            runSearch(v);
          }}
          onFocus={() => onFieldFocus?.(inputRef)}
          placeholder={placeholder}
          placeholderTextColor={colors.obInk3}
          style={[
            fonts.regular,
            styles.field,
            { paddingRight: 34, backgroundColor: colors.obSurface2, borderColor: colors.obLine2, color: colors.obInk, fontSize: fontSize.ui },
          ]}
        />
        {loading && <ActivityIndicator size="small" color={colors.obInk3} style={styles.spinner} />}
      </View>
      {shown.length > 0 && (
        <View ref={listRef} style={[styles.suggestions, { backgroundColor: colors.surface, borderColor: colors.obLine2 }]}>
          {shown.map((c, index) => (
            <Pressable
              key={`${c.city}-${c.stateCode}-${c.countryCode}-${index}`}
              onPress={() => selectCity(c)}
              style={({ pressed }) => [
                styles.suggestionRow,
                index < shown.length - 1 && { borderBottomColor: colors.obLine2, borderBottomWidth: StyleSheet.hairlineWidth },
                pressed && { backgroundColor: colors.obChip },
              ]}
            >
              <MapPin size={13} color={colors.obInk3} strokeWidth={1.6} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[fonts.semibold, styles.suggestionCity, { color: colors.obInk }]} numberOfLines={1}>
                  {c.city}
                </Text>
                <Text style={[fonts.regular, styles.suggestionSub, { color: colors.obInk3 }]} numberOfLines={1}>
                  {c.stateName || c.stateCode}, {c.countryName || c.countryCode}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 46,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
  },
  spinner: {
    position: 'absolute',
    right: 13,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  suggestions: {
    marginTop: 8,
    borderRadius: 13,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionCity: {
    fontSize: 13,
  },
  suggestionSub: {
    fontSize: 10.5,
    marginTop: 1,
  },
});
