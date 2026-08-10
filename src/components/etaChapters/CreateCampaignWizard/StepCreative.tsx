import React from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { types } from '@react-native-documents/picker';
import { useTheme } from '../../../theme';
import { FileUploadButton } from '../../FileUploadButton';
import { Field } from './StepBrand';
import { CTA_PRESETS } from './types';
import type { CampaignDraft, DestType } from './types';

const DEST_OPTS: { value: DestType; title: string; sub: string }[] = [
  { value: 'url', title: 'External Website', sub: 'Send users to your homepage or landing page' },
  { value: 'calendar', title: 'Calendar Booking Link', sub: 'Calendly, HubSpot Meetings, etc.' },
  { value: 'mailto', title: 'Email CTA (mailto)', sub: "Open user's email client with prefilled subject" },
  { value: 'custom', title: 'Custom URL', sub: 'UTM-tagged, app deep link, etc.' },
];

const HEADLINE_MAX = 80;
const BODY_MAX = 160;

export function StepCreative({ draft, onChange }: { draft: CampaignDraft; onChange: (patch: Partial<CampaignDraft>) => void }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const ctaLabel = draft.ctaLabel || 'Learn More';

  return (
    <View style={styles.gap}>
      <Field label="Ad banner" required>
        <FileUploadButton
          value={draft.bannerFile}
          onChange={f => onChange({ bannerFile: f })}
          acceptedTypes={[types.images]}
          placeholder="Upload a 260×200 banner image (JPG or PNG)"
        />
      </Field>

      <Field label="Headline" required>
        <TextInput
          value={draft.headline}
          onChangeText={t => onChange({ headline: t.slice(0, HEADLINE_MAX) })}
          placeholder="Shown in bold on your ad"
          placeholderTextColor={colors.ink3}
          style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
        />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>{HEADLINE_MAX - draft.headline.length} characters left</Text>
      </Field>

      <Field label="Body copy" hint="One or two short sentences describing your offer.">
        <TextInput
          value={draft.body}
          onChangeText={t => onChange({ body: t.slice(0, BODY_MAX) })}
          multiline
          placeholderTextColor={colors.ink3}
          style={[fonts.regular, styles.textarea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
        />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>{BODY_MAX - draft.body.length} characters left</Text>
      </Field>

      <Field label="Call-to-action label">
        <TextInput
          value={draft.ctaLabel}
          onChangeText={t => onChange({ ctaLabel: t.slice(0, 24) })}
          placeholder="Learn More"
          placeholderTextColor={colors.ink3}
          style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
        />
        <View style={styles.chipRow}>
          {CTA_PRESETS.map(label => {
            const active = draft.ctaLabel === label;
            return (
              <Pressable
                key={label}
                onPress={() => onChange({ ctaLabel: label })}
                style={[
                  styles.presetPill,
                  active ? { borderColor: colors.goldLight, backgroundColor: colors.chip } : { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
              >
                <Text style={[fonts.semibold, { fontSize: fontSize.small, color: active ? colors.goldDark : colors.ink2 }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Live preview">
        <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
          {draft.bannerFile && <Image source={{ uri: draft.bannerFile.uri }} style={[styles.previewImage, { borderRadius: radius.lg }]} resizeMode="cover" />}
          <Text style={[fonts.bold, styles.previewSponsored, { color: colors.ink3 }]}>SPONSORED · {draft.brandName || 'Your brand'}</Text>
          <Text style={[fonts.bold, styles.previewHeadline, { color: colors.ink }]} numberOfLines={2}>
            {draft.headline || 'Your headline goes here'}
          </Text>
          <View style={[styles.previewCtaButton, { backgroundColor: colors.feedFill, borderRadius: radius.lg }]}>
            <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.feedOnFill }]}>{ctaLabel} →</Text>
          </View>
        </View>
      </Field>

      <Field label="Click destination" required>
        <View style={{ gap: 7 }}>
          {DEST_OPTS.map(d => {
            const active = draft.destType === d.value;
            return (
              <Pressable
                key={d.value}
                onPress={() => onChange({ destType: d.value })}
                style={[styles.radioRow, { borderColor: active ? colors.goldLight : colors.border, backgroundColor: active ? colors.chip : colors.surface, borderRadius: radius.xl }]}
              >
                <View style={[styles.dot, { borderColor: active ? colors.gold : colors.border, borderWidth: active ? 5 : 1.5 }]} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink }]}>{d.title}</Text>
                  <Text style={[fonts.regular, styles.radioSub, { color: colors.ink3 }]}>{d.sub}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Destination URL" required>
        <TextInput
          value={draft.destUrl}
          onChangeText={t => onChange({ destUrl: t })}
          placeholder="https://yourcompany.com/searchers"
          placeholderTextColor={colors.ink3}
          autoCapitalize="none"
          keyboardType="url"
          style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
        />
      </Field>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: {
    gap: 13,
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 13.5,
  },
  textarea: {
    height: 72,
    padding: 11,
    borderWidth: 1,
    fontSize: 13,
    lineHeight: 19,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 10.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetPill: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 11,
  },
  previewCard: {
    padding: 12,
  },
  previewImage: {
    width: '100%',
    height: 100,
    marginBottom: 9,
  },
  previewSponsored: {
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  previewHeadline: {
    fontSize: 14,
    marginTop: 6,
  },
  previewCtaButton: {
    height: 34,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 9,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
    borderWidth: 1,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  radioSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
