import React, { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme';
import { DateTimeField } from './DateTimeField';
import { FieldSelect } from './FieldSelect';
import { TIMEZONE_OPTIONS, WizardDraft } from './types';

/** Step 2 — start/end date+time, timezone, Venue (shown for In Person/Hybrid) or Event link
 * (shown for Online/Hybrid — both show for Hybrid), Hosted by. `onFieldFocus` (wired to Venue/
 * Event link/Hosted by) drives `CreateEventWizard.tsx`'s manual scroll-to-focused-input — see
 * that file's doc comment on `handleFieldFocus` for why. */
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
  const showLink = draft.fmt !== 'In Person';
  const venueRef = useRef<TextInput>(null);
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
          <TextInput
            ref={venueRef}
            value={draft.venue}
            onChangeText={v => onChange({ venue: v })}
            onFocus={() => onFieldFocus?.(venueRef)}
            placeholder="Name and street address"
            placeholderTextColor={colors.ink3}
            style={[
              fonts.regular,
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl, color: colors.ink, fontSize: fontSize.ui },
            ]}
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
