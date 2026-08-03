import React, { useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Keyboard, StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme';
import { CityResult, searchCities } from '../../../api/location';

const DEFAULT_MAX_HEIGHT = 260;
const MIN_HEIGHT = 140;
/** See `FieldDropdown` — same fixed-footer-clamping reasoning applies here. */
const FOOTER_RESERVE = 73;
const SAFETY_MARGIN = 12;
const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export type CitySelection = {
  city: string;
  stateCode: string;
  countryCode: string;
  /** Not needed for `complete-profile`'s payload (that only wants the code) — carried through so
   * Step 2 can match it against chapter names/descriptions, same as web's proximity sort. */
  countryName: string;
};

const cityKey = (c: CityResult) => `${c.city}|${c.stateCode}|${c.countryCode}`;

/**
 * Live city search — mirrors webSrc's `complete-profile` city autocomplete (debounced 300ms,
 * min 2 characters, `GET /api/location/cities?search=`), replacing Step 1's old static 5-city
 * list. Reuses `react-native-element-dropdown`'s `Dropdown` in search mode rather than
 * `FieldDropdown`'s fixed local list — `data` here is populated from live results, and
 * `searchQuery` is disabled (`() => true`) since the backend already filtered by `search`.
 *
 * Keeps the currently-selected city in `data` even after search results clear (falls back to
 * `[selected]`), so the library — which resolves its displayed label by looking `value` up in
 * `data` — still shows the picked city instead of reverting to the placeholder.
 */
export function CitySearchField({
  placeholder,
  onSelect,
}: {
  placeholder: string;
  onSelect: (city: CitySelection) => void;
}) {
  const { colors, fonts, fontSize } = useTheme();
  const insets = useSafeAreaInsets();
  const wrapRef = useRef<View>(null);
  const [maxHeight, setMaxHeight] = useState(DEFAULT_MAX_HEIGHT);
  const [results, setResults] = useState<CityResult[]>([]);
  const [selected, setSelected] = useState<CityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measureAvailableHeight = () => {
    wrapRef.current?.measureInWindow((_x, y, _width, height) => {
      const windowHeight = Dimensions.get('window').height;
      const reserved = FOOTER_RESERVE + insets.bottom + SAFETY_MARGIN;
      const available = windowHeight - (y + height) - reserved;
      setMaxHeight(Math.min(DEFAULT_MAX_HEIGHT, Math.max(MIN_HEIGHT, available)));
    });
  };

  const onChangeSearchText = (query: string) => {
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

  const shownList = results.length > 0 ? results : selected ? [selected] : [];
  const data = shownList.map(c => ({ value: cityKey(c), label: `${c.city}, ${c.stateCode}` }));

  return (
    <View ref={wrapRef} collapsable={false}>
      <Dropdown
        style={[styles.field, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2 }]}
        containerStyle={[styles.list, { backgroundColor: colors.surface, borderColor: colors.obLine2 }]}
        itemContainerStyle={styles.item}
        activeColor={colors.obChip}
        placeholderStyle={[fonts.regular, { color: colors.obInk3, fontSize: fontSize.ui }]}
        selectedTextStyle={[fonts.regular, { color: colors.obInk, fontSize: fontSize.ui }]}
        itemTextStyle={[fonts.medium, { color: colors.obInk, fontSize: fontSize.ui }]}
        inputSearchStyle={[fonts.regular, styles.searchInput, { color: colors.obInk, fontSize: fontSize.ui }]}
        data={data}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={selected ? cityKey(selected) : null}
        search
        searchPlaceholder="Search for a city…"
        searchQuery={() => true}
        onChangeText={onChangeSearchText}
        onChange={item => {
          const match = shownList.find(c => cityKey(c) === item.value);
          if (!match) return;
          setSelected(match);
          setResults([]);
          // The library closes its search popup on select but doesn't reliably blur its
          // internal search `TextInput` first, so the keyboard can flash back open as the
          // popup animates away — force it down explicitly instead of relying on that.
          Keyboard.dismiss();
          onSelect({
            city: match.city,
            stateCode: match.stateCode,
            countryCode: match.countryCode,
            countryName: match.countryName,
          });
        }}
        onFocus={measureAvailableHeight}
        renderRightIcon={() =>
          loading ? (
            <ActivityIndicator size="small" color={colors.obInk3} />
          ) : (
            <ChevronDown size={14} color={colors.obInk3} strokeWidth={1.6} />
          )
        }
        maxHeight={maxHeight}
      />
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
  list: {
    borderRadius: 13,
    borderWidth: 1,
    paddingVertical: 4,
  },
  item: {
    paddingHorizontal: 10,
    borderRadius: 9,
  },
  searchInput: {
    borderRadius: 10,
  },
});
