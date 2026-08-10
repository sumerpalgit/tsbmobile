import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { FieldSelect } from '../../events/CreateEventWizard/FieldSelect';
import { ADVERTISER_TYPES } from './types';
import type { CampaignDraft } from './types';

export function StepBrand({
  draft,
  onChange,
  errors,
  clearError,
}: {
  draft: CampaignDraft;
  onChange: (patch: Partial<CampaignDraft>) => void;
  errors: Record<string, string>;
  clearError: (key: string) => void;
}) {
  const { colors, fonts, radius, borderWidth } = useTheme();

  return (
    <View style={styles.gap}>
      <Field label="Brand / Company name" required error={errors.brandName}>
        <TextInput
          value={draft.brandName}
          onChangeText={t => {
            onChange({ brandName: t });
            clearError('brandName');
          }}
          placeholder="e.g. Strivedge"
          placeholderTextColor={colors.ink3}
          style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
        />
      </Field>

      <Field label="Advertiser type" required error={errors.advertiserType}>
        <FieldSelect
          value={draft.advertiserType}
          placeholder="Select type…"
          options={ADVERTISER_TYPES}
          onChange={v => {
            onChange({ advertiserType: v });
            clearError('advertiserType');
          }}
        />
      </Field>

      <Field label="Primary contact email" required error={errors.contactEmail}>
        <TextInput
          value={draft.contactEmail}
          onChangeText={t => {
            onChange({ contactEmail: t });
            clearError('contactEmail');
          }}
          placeholder="you@company.com"
          placeholderTextColor={colors.ink3}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
        />
      </Field>

      <Field label="Campaign name" required hint="Internal label only — won't appear in your ad." error={errors.campaignName}>
        <TextInput
          value={draft.campaignName}
          onChangeText={t => {
            onChange({ campaignName: t });
            clearError('campaignName');
          }}
          placeholder="e.g. Q3 launch"
          placeholderTextColor={colors.ink3}
          style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
        />
      </Field>

      <Pressable
        onPress={() => {
          onChange({ policyAgreed: !draft.policyAgreed });
          clearError('policyAgreed');
        }}
        style={[
          styles.agreeRow,
          { backgroundColor: colors.surface, borderColor: errors.policyAgreed ? colors.danger : colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin },
        ]}
      >
        <View style={[styles.checkbox, { borderRadius: radius.sm, backgroundColor: draft.policyAgreed ? colors.gold : colors.surface, borderColor: draft.policyAgreed ? colors.gold : colors.border }]}>
          {draft.policyAgreed && <Check size={10} color="#fff" strokeWidth={2.4} />}
        </View>
        <Text style={[fonts.regular, styles.agreeText, { color: colors.ink2 }]}>
          I agree to the TSB <Text style={[fonts.bold, { color: colors.goldDark }]}>Advertising Policies</Text> and confirm content is
          compliant with FTC, securities, and platform rules.
        </Text>
      </Pressable>
      {!!errors.policyAgreed && <Text style={[fonts.semibold, { fontSize: 10.5, color: colors.danger }]}>{errors.policyAgreed}</Text>}
    </View>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  /** Matches web's per-field `errors` record (`CreateCampaignModal.tsx:303`) — a red outline +
   * inline message under the field, shown instead of relying on a toast alone (a toast fired
   * from behind this full-screen `Modal` is easy to miss entirely). */
  error?: string;
  children: React.ReactNode;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>
        {label} {required && <Text style={{ color: colors.danger }}>*</Text>}
      </Text>
      <View style={error ? { borderColor: colors.danger, borderWidth: borderWidth.thin, borderRadius: radius.lg, padding: 2 } : undefined}>
        {children}
      </View>
      {error ? (
        <Text style={[fonts.semibold, { fontSize: 10.5, color: colors.danger }]}>{error}</Text>
      ) : (
        hint && <Text style={[fonts.regular, { fontSize: 10.5, color: colors.ink3 }]}>{hint}</Text>
      )}
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
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 12,
    borderWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  agreeText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11.5,
    lineHeight: 17,
  },
});
