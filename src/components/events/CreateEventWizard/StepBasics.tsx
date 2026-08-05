import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme';
import { Icon } from '../../icons/Icon';
import { FieldSelect } from './FieldSelect';
import { EVENT_TYPES_IN_PERSON, EVENT_TYPES_ONLINE, VISIBILITY_OPTIONS, WizardDraft } from './types';

const TITLE_MAX = 80;
const DESC_MAX = 500;

const FORMATS: { value: WizardDraft['fmt']; icon: 'link' | 'pin' | 'grid' }[] = [
  { value: 'Online', icon: 'link' },
  { value: 'In Person', icon: 'pin' },
  { value: 'Hybrid', icon: 'grid' },
];

/** Step 1 — title, description, format (Online/In Person/Hybrid), format-scoped event type,
 * visibility (+ Registration Link for private events). No AI-rephrase button — web's `EventForm`
 * declares the same `handleRephraseEventDescription` prop but never renders a button for it either
 * (only the Question/Job post type's form does), so this stays out for parity. `onFieldFocus`
 * (wired to both text fields below) drives `CreateEventWizard.tsx`'s manual scroll-to-focused-input
 * — see that file's doc comment on `handleFieldFocus` for why. */
export function StepBasics({
  draft,
  onChange,
  onFieldFocus,
}: {
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
  onFieldFocus?: (ref: React.RefObject<TextInput | null>) => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const titleRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);
  const linkRef = useRef<TextInput>(null);

  const eventTypeList = draft.fmt === 'Online' ? EVENT_TYPES_ONLINE : EVENT_TYPES_IN_PERSON;
  const isPrivate = draft.vis === 'private';

  return (
    <View style={styles.wrap}>
      <FieldGroup label="Event title" required count={`${draft.title.length} / ${TITLE_MAX}`}>
        <TextInput
          ref={titleRef}
          value={draft.title}
          onChangeText={v => onChange({ title: v.slice(0, TITLE_MAX) })}
          onFocus={() => onFieldFocus?.(titleRef)}
          placeholder="e.g. SBA Lender Roundtable — Live Q&A"
          placeholderTextColor={colors.ink3}
          style={[
            fonts.regular,
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl, color: colors.ink, fontSize: fontSize.ui },
          ]}
        />
      </FieldGroup>

      <FieldGroup label="Description" required count={`${draft.desc.length} / ${DESC_MAX}`}>
        <TextInput
          ref={descRef}
          value={draft.desc}
          onChangeText={v => onChange({ desc: v.slice(0, DESC_MAX) })}
          onFocus={() => onFieldFocus?.(descRef)}
          placeholder="What's the format, who should come, what will they take away?"
          placeholderTextColor={colors.ink3}
          multiline
          textAlignVertical="top"
          style={[
            fonts.regular,
            styles.textarea,
            { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl, color: colors.ink, fontSize: fontSize.ui },
          ]}
        />
      </FieldGroup>

      <View>
        <Text style={[fonts.bold, styles.label, { color: colors.ink }]}>Format</Text>
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Choose how attendees will join.</Text>
        <View style={styles.formatRow}>
          {FORMATS.map(f => {
            const active = draft.fmt === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => onChange({ fmt: f.value })}
                style={({ pressed }) => [
                  styles.formatButton,
                  { borderRadius: radius.xl, borderWidth: borderWidth.thin },
                  active ? { backgroundColor: colors.accentSolid, borderColor: colors.accentSolid } : { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <Icon name={f.icon} size={13} color={active ? colors.onAccent : colors.ink2} />
                <Text style={[fonts.semibold, styles.formatLabel, { color: active ? colors.onAccent : colors.ink2 }]}>{f.value}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <Text style={[fonts.bold, styles.label, { color: colors.ink, marginBottom: 8 }]}>Event type</Text>
        <FieldSelect
          value={draft.etype}
          placeholder="Select event type"
          options={eventTypeList.map(t => ({ value: t, label: t }))}
          onChange={v => onChange({ etype: v })}
        />
      </View>

      <View>
        <Text style={[fonts.bold, styles.label, { color: colors.ink, marginBottom: 8 }]}>Visibility</Text>
        <FieldSelect
          value={draft.vis}
          placeholder="Select visibility"
          options={VISIBILITY_OPTIONS}
          onChange={v => onChange({ vis: v })}
        />
      </View>

      {isPrivate && (
        <FieldGroup label="Registration link" required>
          <TextInput
            ref={linkRef}
            value={draft.link}
            onChangeText={v => onChange({ link: v })}
            onFocus={() => onFieldFocus?.(linkRef)}
            placeholder="https://… link where invited guests can register"
            placeholderTextColor={colors.ink3}
            autoCapitalize="none"
            keyboardType="url"
            style={[
              fonts.regular,
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl, color: colors.ink, fontSize: fontSize.ui },
            ]}
          />
          <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>
            Only people with this link can register. Share it directly with your invited audience.
          </Text>
        </FieldGroup>
      )}
    </View>
  );
}

function FieldGroup({
  label,
  required,
  count,
  children,
}: {
  label: string;
  required?: boolean;
  count?: string;
  children: React.ReactNode;
}) {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View>
      <View style={styles.fieldGroupHeader}>
        <Text style={[fonts.bold, styles.label, { color: colors.ink }]}>{label}</Text>
        {required && <Text style={[fonts.bold, { color: colors.danger, fontSize: fontSize.body }]}>*</Text>}
        <View style={{ flex: 1 }} />
        {!!count && <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink3 }]}>{count}</Text>}
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
  fieldGroupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
  },
  hint: {
    fontSize: 11.5,
    marginTop: 4,
  },
  input: {
    height: 50,
    paddingHorizontal: 14,
  },
  textarea: {
    height: 112,
    paddingHorizontal: 14,
    paddingVertical: 13,
    lineHeight: 20,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  formatButton: {
    flex: 1,
    minWidth: 0,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  formatLabel: {
    fontSize: 12.5,
  },
  pressed: {
    opacity: 0.65,
  },
});
