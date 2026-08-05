import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { CityResult, searchCities } from '../../../api/location';
import { DateTimeField } from './DateTimeField';
import { FieldSelect } from './FieldSelect';
import { TIMEZONE_OPTIONS, WizardDraft } from './types';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 5;

/** Step 2 — start/end date+time, timezone, Venue (shown for In Person/Hybrid, with a live city
 * suggestion list — see `VenueField` below) or Event link (shown for Online/Hybrid, hidden for
 * private events since Step 1 already collects a Registration Link that reuses the same
 * `draft.link` field — matches web's `!isPrivate && format !== "In-person"` condition), Hosted by.
 * `onFieldFocus` (wired to Venue/Event link/Hosted by) drives `CreateEventWizard.tsx`'s manual
 * scroll-to-focused-input — see that file's doc comment on `handleFieldFocus` for why. */
export function StepWhenWhere({
  draft,
  onChange,
  onFieldFocus,
}: {
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
  onFieldFocus?: (ref: React.RefObject<TextInput | null>) => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const showVenue = draft.fmt !== 'Online';
  const showLink = draft.fmt !== 'In Person' && draft.vis !== 'private';
  const linkRef = useRef<TextInput>(null);
  const hostRef = useRef<TextInput>(null);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Field label="Start date" required>
          <DateTimeField value={draft.sdate} mode="date" placeholder="mm/dd/yyyy" onChange={v => onChange({ sdate: v })} />
        </Field>
        <Field label="End date">
          <DateTimeField value={draft.edate} mode="date" placeholder="mm/dd/yyyy" onChange={v => onChange({ edate: v })} />
        </Field>
      </View>

      <View style={styles.row}>
        <Field label="Start time" required>
          <DateTimeField value={draft.stime} mode="time" placeholder="--:-- --" onChange={v => onChange({ stime: v })} />
        </Field>
        <Field label="End time">
          <DateTimeField value={draft.etime} mode="time" placeholder="--:-- --" onChange={v => onChange({ etime: v })} />
        </Field>
      </View>

      <View>
        <Text style={[fonts.bold, styles.label, { color: colors.ink, marginBottom: 8 }]}>Timezone</Text>
        <FieldSelect value={draft.tz} placeholder="Select timezone" options={TIMEZONE_OPTIONS} onChange={v => onChange({ tz: v })} />
      </View>

      <View style={styles.sectionDivider}>
        <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>WHERE</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      {showVenue && (
        <View>
          <Text style={[fonts.bold, styles.label, { color: colors.ink, marginBottom: 8 }]}>Venue</Text>
          <VenueField
            value={draft.venue}
            onChangeText={v => onChange({ venue: v })}
            onFieldFocus={onFieldFocus}
          />
          <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Shown on the event page with a map link.</Text>
        </View>
      )}

      {showLink && (
        <View>
          <View style={styles.fieldGroupHeader}>
            <Text style={[fonts.bold, styles.label, { color: colors.ink }]}>Event link</Text>
            <View style={{ flex: 1 }} />
            <View style={[styles.optionalBadge, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.sm }]}>
              <Text style={[fonts.bold, styles.optionalText, { color: colors.ink3 }]}>OPTIONAL</Text>
            </View>
          </View>
          <TextInput
            ref={linkRef}
            value={draft.link}
            onChangeText={v => onChange({ link: v })}
            onFocus={() => onFieldFocus?.(linkRef)}
            placeholder="https://zoom.us/j/… or Google Meet, Teams"
            placeholderTextColor={colors.ink3}
            autoCapitalize="none"
            style={[
              fonts.regular,
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl, color: colors.ink, fontSize: fontSize.ui },
            ]}
          />
          <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Sent to registrants 24 hours before start.</Text>
        </View>
      )}

      <View>
        <Text style={[fonts.bold, styles.label, { color: colors.ink, marginBottom: 8 }]}>Hosted by</Text>
        <TextInput
          ref={hostRef}
          value={draft.host}
          onChangeText={v => onChange({ host: v })}
          onFocus={() => onFieldFocus?.(hostRef)}
          placeholder="James Whitfield"
          placeholderTextColor={colors.ink3}
          style={[
            fonts.regular,
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl, color: colors.ink, fontSize: fontSize.ui },
          ]}
        />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Defaults to your name. Add co-hosts separated by commas.</Text>
      </View>
    </View>
  );
}

/** Live venue search — debounced port of web's `LocationAutocomplete`
 * (`webSrc/src/components/LocationAutocomplete.tsx`: 300ms debounce, min 2 chars, `GET
 * /api/location/cities?search=`). Stays a free-text field (not a strict select) since physical
 * venues need street-address detail the city-only API can't provide; the suggestion list is a
 * plain in-flow list under the input, not a `Modal`/absolute overlay — `FieldSelect.tsx`'s doc
 * comment already documents the positioning bugs a Modal-based dropdown caused inside this same
 * wizard, so this avoids that pattern entirely. Tapping a suggestion sets the field to
 * `"City, Country"`, matching web's `handleSelect` format string exactly. */
function VenueField({
  value,
  onChangeText,
  onFieldFocus,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onFieldFocus?: (ref: React.RefObject<TextInput | null>) => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const venueRef = useRef<TextInput>(null);
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
    onChangeText(`${city.city}, ${city.countryName || city.countryCode}`);
    setResults([]);
    setLoading(false);
  };

  return (
    <View>
      <View style={{ position: 'relative' }}>
        <TextInput
          ref={venueRef}
          value={value}
          onChangeText={v => {
            onChangeText(v);
            runSearch(v);
          }}
          onFocus={() => onFieldFocus?.(venueRef)}
          placeholder="Name and street address"
          placeholderTextColor={colors.ink3}
          style={[
            fonts.regular,
            styles.input,
            { paddingRight: 38, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl, color: colors.ink, fontSize: fontSize.ui },
          ]}
        />
        {loading && <ActivityIndicator size="small" color={colors.ink3} style={styles.venueSpinner} />}
      </View>
      {results.length > 0 && (
        <View style={[styles.venueSuggestions, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
          {results.slice(0, MAX_SUGGESTIONS).map((c, index) => (
            <Pressable
              key={`${c.city}-${c.stateCode}-${c.countryCode}-${index}`}
              onPress={() => selectCity(c)}
              style={({ pressed }) => [
                styles.venueSuggestionRow,
                index < results.length - 1 && index < MAX_SUGGESTIONS - 1 && { borderBottomColor: colors.border, borderBottomWidth: borderWidth.hairline },
                pressed && { backgroundColor: colors.surfaceSunken },
              ]}
            >
              <MapPin size={13} color={colors.ink3} strokeWidth={1.6} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[fonts.semibold, styles.venueSuggestionCity, { color: colors.ink }]} numberOfLines={1}>{c.city}</Text>
                <Text style={[fonts.regular, styles.venueSuggestionSub, { color: colors.ink3 }]} numberOfLines={1}>
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={styles.fieldGroupHeader}>
        <Text style={[fonts.bold, styles.label, { color: colors.ink }]}>{label}</Text>
        {required && <Text style={[fonts.bold, { color: colors.danger, fontSize: fontSize.body }]}>*</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 18,
    paddingTop: 17,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
  },
  hint: {
    fontSize: 11.5,
    marginTop: 7,
    lineHeight: 16,
  },
  input: {
    height: 50,
    paddingHorizontal: 14,
  },
  venueSpinner: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  venueSuggestions: {
    marginTop: 8,
    overflow: 'hidden',
  },
  venueSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  venueSuggestionCity: {
    fontSize: 13,
  },
  venueSuggestionSub: {
    fontSize: 10.5,
    marginTop: 1,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionLabel: {
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  optionalText: {
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
});
