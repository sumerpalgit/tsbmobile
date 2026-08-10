import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { FieldSelect } from '../../events/CreateEventWizard/FieldSelect';
import { ADVERTISER_TYPES } from './types';
import type { CampaignDraft } from './types';

export function StepBrand({ draft, onChange }: { draft: CampaignDraft; onChange: (patch: Partial<CampaignDraft>) => void }) {
  const { colors, fonts, radius } = useTheme();

  return (
    <View style={styles.gap}>
      <Field label="Brand / Company name" required>
        <TextInput
          value={draft.brandName}
          onChangeText={t => onChange({ brandName: t })}
          placeholder="e.g. Strivedge"
          placeholderTextColor={colors.ink3}
          style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
        />
      </Field>

      <Field label="Advertiser type" required>
        <FieldSelect value={draft.advertiserType} placeholder="Select type…" options={ADVERTISER_TYPES} onChange={v => onChange({ advertiserType: v })} />
      </Field>

      <Field label="Primary contact email" required>
        <TextInput
          value={draft.contactEmail}
          onChangeText={t => onChange({ contactEmail: t })}
          placeholder="you@company.com"
          placeholderTextColor={colors.ink3}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
        />
      </Field>

      <Field label="Campaign name" required hint="Internal label only — won't appear in your ad.">
        <TextInput
          value={draft.campaignName}
          onChangeText={t => onChange({ campaignName: t })}
          placeholder="e.g. Q3 launch"
          placeholderTextColor={colors.ink3}
          style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
        />
      </Field>

      <Pressable
        onPress={() => onChange({ policyAgreed: !draft.policyAgreed })}
        style={[styles.agreeRow, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl }]}
      >
        <View style={[styles.checkbox, { borderRadius: radius.sm, backgroundColor: draft.policyAgreed ? colors.gold : colors.surface, borderColor: draft.policyAgreed ? colors.gold : colors.border }]}>
          {draft.policyAgreed && <Check size={10} color="#fff" strokeWidth={2.4} />}
        </View>
        <Text style={[fonts.regular, styles.agreeText, { color: colors.ink2 }]}>
          I agree to the TSB <Text style={[fonts.bold, { color: colors.goldDark }]}>Advertising Policies</Text> and confirm content is
          compliant with FTC, securities, and platform rules.
        </Text>
      </Pressable>
    </View>
  );
}

export function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>
        {label} {required && <Text style={{ color: colors.danger }}>*</Text>}
      </Text>
      {children}
      {hint && <Text style={[fonts.regular, { fontSize: 10.5, color: colors.ink3 }]}>{hint}</Text>}
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
