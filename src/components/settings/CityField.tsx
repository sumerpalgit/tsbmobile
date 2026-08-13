import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChevronDown, MapPin } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { CityResult, searchCities } from '../../api/location';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 5;

/** City autocomplete for Settings' Profile & Visibility "Location" field — same 300ms-debounced,
 * 2-char-min, plain-`TextInput`-plus-in-flow-list shape as `StepWhenWhere.tsx`'s `VenueField`, but
 * using this screen's own `colors.*` tokens rather than onboarding's `ob*`-prefixed ones (that
 * field is onboarding-only, see `CitySearchField.tsx`'s own doc comment). Selecting a suggestion
 * sets the field to just the city name (not `"City, Country"` like the venue field) — matches
 * web's own `handleSelect`: `setProfileForm((p) => ({ ...p, city: c.city }))`. */
export function CityField({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
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
    onChangeText(city.city);
    setResults([]);
    setLoading(false);
  };

  return (
    <View>
      <View style={{ position: 'relative' }}>
        <TextInput
          value={value}
          onChangeText={v => {
            onChangeText(v);
            runSearch(v);
          }}
          placeholder="Select your city"
          placeholderTextColor={colors.ink3}
          style={[
            fonts.regular,
            styles.input,
            { paddingRight: 36, backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body },
          ]}
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.ink3} style={styles.spinner} />
        ) : (
          <ChevronDown size={15} color={colors.ink3} strokeWidth={1.8} style={styles.spinner} />
        )}
      </View>
      {results.length > 0 && (
        <View style={[styles.suggestions, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
          {results.slice(0, MAX_SUGGESTIONS).map((c, index) => (
            <Pressable
              key={`${c.city}-${c.stateCode}-${c.countryCode}-${index}`}
              onPress={() => selectCity(c)}
              style={({ pressed }) => [
                styles.suggestionRow,
                index < results.length - 1 && index < MAX_SUGGESTIONS - 1 && { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.hairline },
                pressed && { backgroundColor: colors.surfaceSunken },
              ]}
            >
              <MapPin size={13} color={colors.ink3} strokeWidth={1.6} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[fonts.semibold, styles.suggestionCity, { color: colors.ink }]} numberOfLines={1}>{c.city}</Text>
                <Text style={[fonts.regular, styles.suggestionSub, { color: colors.ink3 }]} numberOfLines={1}>
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
  input: {
    height: 44,
    paddingHorizontal: 13,
  },
  spinner: {
    position: 'absolute',
    right: 12,
    top: 13,
  },
  suggestions: {
    marginTop: 6,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  suggestionCity: {
    fontSize: 13,
  },
  suggestionSub: {
    fontSize: 11,
    marginTop: 1,
  },
});
