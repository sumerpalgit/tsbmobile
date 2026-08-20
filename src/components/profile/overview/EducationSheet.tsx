import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { BottomSheet } from '../../BottomSheet';
import { FieldDropdown } from '../../../screens/onboarding/components/FieldDropdown';
import { addEducation, updateEducation, EducationEntry, EducationPayload } from '../../../api/profile-overview';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1970 + 1 }, (_, i) => String(CURRENT_YEAR - i));
const YEAR_OPTIONS = YEARS.map(y => ({ value: y, label: y }));

function extractErrorMessage(err: unknown): string {
  return axios.isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error ?? err.message : 'Please try again.';
}

const EMPTY: EducationPayload = {
  institution_name: '',
  degree: '',
  field_of_study: '',
  start_year: '',
  end_year: '',
  is_current: false,
};

/**
 * Add/Edit Education — matches `webSrc/app/dashboard/my-profile/page.tsx:717-1123` exactly:
 * single-step for BOTH Add and Edit (unlike `ExperienceSheet`'s Add-is-a-wizard asymmetry), and
 * this is the one Overview CRUD section with real client-side validation on web — "School and
 * Degree are required." blocks save, mirrored below. `field_of_study` is always sent as `''`:
 * web's own UI never collects it despite the type having the field, matched here rather than
 * second-guessing it by adding a field web itself doesn't have.
 */
export function EducationSheet({
  visible,
  mode,
  initial,
  onClose,
  onSaved,
}: {
  visible: boolean;
  mode: 'add' | 'edit';
  initial?: EducationEntry | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { colors, fonts } = useTheme();
  const [form, setForm] = useState<EducationPayload>(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setError('');
    setForm(
      initial
        ? {
            institution_name: initial.institution_name,
            degree: initial.degree,
            field_of_study: initial.field_of_study,
            start_year: initial.start_year,
            end_year: initial.end_year,
            is_current: initial.is_current,
          }
        : EMPTY,
    );
  }, [visible, initial]);

  const set = <K extends keyof EducationPayload>(key: K, value: EducationPayload[K]) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.institution_name.trim() || !form.degree.trim()) {
      setError('School and Degree are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload: EducationPayload = { ...form, field_of_study: '', end_year: form.is_current ? '' : form.end_year };
      if (mode === 'edit' && initial) {
        await updateEducation(initial.id, payload);
        Toast.show({ type: 'success', text1: 'Education updated' });
      } else {
        await addEducation(payload);
        Toast.show({ type: 'success', text1: 'Education added' });
      }
      onSaved();
      onClose();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not save', text2: extractErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissable={!saving}>
      <Text style={[fonts.display, styles.title, { color: colors.ink }]}>{mode === 'edit' ? 'Edit Education' : 'Add Education'}</Text>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.fieldGroup}>
          <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>
            School <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TextInput
            value={form.institution_name}
            onChangeText={v => set('institution_name', v)}
            placeholder="e.g. Harvard University"
            placeholderTextColor={colors.ink3}
            style={[styles.input, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>
            Degree <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TextInput
            value={form.degree}
            onChangeText={v => set('degree', v)}
            placeholder="e.g. MBA"
            placeholderTextColor={colors.ink3}
            style={[styles.input, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>Start Year</Text>
            <FieldDropdown value={form.start_year} placeholder="Year" options={YEAR_OPTIONS} onChange={v => set('start_year', v)} />
          </View>
          <View style={styles.half}>
            <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>End Year</Text>
            <FieldDropdown
              value={form.end_year}
              placeholder="Year"
              options={YEAR_OPTIONS}
              onChange={v => set('end_year', v)}
              disabled={form.is_current}
            />
          </View>
        </View>

        <Pressable style={styles.checkboxRow} onPress={() => set('is_current', !form.is_current)}>
          <View
            style={[
              styles.checkbox,
              { borderColor: form.is_current ? colors.gold : colors.border, backgroundColor: form.is_current ? colors.gold : 'transparent' },
            ]}
          >
            {form.is_current && <Check size={12} color={colors.onGold} strokeWidth={2.4} />}
          </View>
          <Text style={[fonts.regular, styles.checkboxLabel, { color: colors.ink2 }]}>I am currently studying here</Text>
        </Pressable>

        {!!error && <Text style={[fonts.regular, styles.error, { color: colors.danger }]}>{error}</Text>}
      </ScrollView>

      <View style={styles.footerRow}>
        <Pressable onPress={onClose} disabled={saving} style={[styles.footerButton, styles.secondaryButton, { borderColor: colors.border }]}>
          <Text style={[fonts.bold, styles.footerButtonText, { color: colors.ink }]}>Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSave} disabled={saving} style={[styles.footerButton, { backgroundColor: colors.gold, opacity: saving ? 0.6 : 1 }]}>
          {saving ? <ActivityIndicator size="small" color={colors.onGold} /> : <Text style={[fonts.bold, styles.footerButtonText, { color: colors.onGold }]}>Save</Text>}
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, textAlign: 'center' },
  body: { marginTop: 16 },
  fieldGroup: { gap: 6, marginBottom: 14 },
  fieldLabel: { fontSize: 11.5 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  half: { flex: 1, gap: 6 },
  input: { height: 44, paddingHorizontal: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, fontSize: 13.5 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 6 },
  checkbox: { width: 19, height: 19, borderRadius: 5, borderWidth: 1.4, alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { fontSize: 13 },
  error: { fontSize: 12, marginTop: 8 },
  footerRow: { flexDirection: 'row', gap: 10, marginTop: 6, paddingTop: 10 },
  footerButton: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { borderWidth: StyleSheet.hairlineWidth },
  footerButtonText: { fontSize: 13.5 },
});
