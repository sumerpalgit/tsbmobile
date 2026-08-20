import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { BottomSheet } from '../../BottomSheet';
import { FieldDropdown } from '../../../screens/onboarding/components/FieldDropdown';
import {
  addWorkExperience,
  updateWorkExperience,
  WorkExperienceEntry,
  WorkExperiencePayload,
} from '../../../api/profile-overview';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1970 + 1 }, (_, i) => String(CURRENT_YEAR - i));
const MONTH_OPTIONS = MONTHS.map(m => ({ value: m, label: m }));
const YEAR_OPTIONS = YEARS.map(y => ({ value: y, label: y }));

function extractErrorMessage(err: unknown): string {
  return axios.isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error ?? err.message : 'Please try again.';
}

const EMPTY: WorkExperiencePayload = {
  organization_name: '',
  job_title: '',
  is_current: false,
  start_month: '',
  start_year: '',
  end_month: '',
  end_year: '',
  description: '',
};

/**
 * Add/Edit Experience — matches `webSrc/app/dashboard/my-profile/page.tsx:2231-2536` exactly:
 * **Add is a 3-step wizard** (Organization+Job title → Start/End month+year → review), **Edit is
 * single-step** (all fields on one screen) — confirmed intentional on web itself, not a
 * mockup-only inconsistency, so this asymmetry is kept rather than "fixed" to be consistent.
 * `is_current` is never exposed as a toggle in either mode — web's own Add call always sends
 * `is_current: false` literally, Edit's payload doesn't touch it either; the field exists on the
 * type only for read-shape parity with `GET .../my`. No blocking validation on save, matching
 * web's real (lax) behavior — unlike `EducationSheet`.
 */
export function ExperienceSheet({
  visible,
  mode,
  initial,
  onClose,
  onSaved,
}: {
  visible: boolean;
  mode: 'add' | 'edit';
  initial?: WorkExperienceEntry | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { colors, fonts } = useTheme();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<WorkExperiencePayload>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStep(1);
    setForm(
      initial
        ? {
            organization_name: initial.organization_name,
            job_title: initial.job_title,
            is_current: initial.is_current,
            start_month: initial.start_month,
            start_year: initial.start_year,
            end_month: initial.end_month,
            end_year: initial.end_year,
            description: initial.description,
          }
        : EMPTY,
    );
  }, [visible, initial]);

  const set = <K extends keyof WorkExperiencePayload>(key: K, value: WorkExperiencePayload[K]) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === 'edit' && initial) {
        await updateWorkExperience(initial.id, form);
        Toast.show({ type: 'success', text1: 'Experience updated' });
      } else {
        await addWorkExperience(form);
        Toast.show({ type: 'success', text1: 'Experience added' });
      }
      onSaved();
      onClose();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not save', text2: extractErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const title = mode === 'edit' ? 'Edit Experience' : 'Add Experience';

  const fieldsBody = (
    <>
      <View style={styles.fieldGroup}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>Organization</Text>
        <TextInput
          value={form.organization_name}
          onChangeText={v => set('organization_name', v)}
          placeholder="e.g. Strivedge Capital"
          placeholderTextColor={colors.ink3}
          style={[styles.input, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>Job title</Text>
        <TextInput
          value={form.job_title}
          onChangeText={v => set('job_title', v)}
          placeholder="e.g. Managing Partner"
          placeholderTextColor={colors.ink3}
          style={[styles.input, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
        />
      </View>
    </>
  );

  const datesBody = (
    <>
      <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>Start date</Text>
      <View style={styles.row}>
        <View style={styles.half}>
          <FieldDropdown value={form.start_month} placeholder="Month" options={MONTH_OPTIONS} onChange={v => set('start_month', v)} />
        </View>
        <View style={styles.half}>
          <FieldDropdown value={form.start_year} placeholder="Year" options={YEAR_OPTIONS} onChange={v => set('start_year', v)} />
        </View>
      </View>
      <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2, marginTop: 4 }]}>End date</Text>
      <View style={styles.row}>
        <View style={styles.half}>
          <FieldDropdown value={form.end_month} placeholder="Month" options={MONTH_OPTIONS} onChange={v => set('end_month', v)} />
        </View>
        <View style={styles.half}>
          <FieldDropdown value={form.end_year} placeholder="Year" options={YEAR_OPTIONS} onChange={v => set('end_year', v)} />
        </View>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>Description (optional)</Text>
        <TextInput
          value={form.description}
          onChangeText={v => set('description', v)}
          multiline
          numberOfLines={3}
          placeholder="What did you work on?"
          placeholderTextColor={colors.ink3}
          style={[styles.textarea, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
        />
      </View>
    </>
  );

  const reviewRow = (label: string, value: string) =>
    value ? (
      <View style={styles.reviewRow} key={label}>
        <Text style={[fonts.regular, styles.reviewLabel, { color: colors.ink3 }]}>{label}</Text>
        <Text style={[fonts.semibold, styles.reviewValue, { color: colors.ink }]}>{value}</Text>
      </View>
    ) : null;

  const reviewBody = (
    <View style={[styles.reviewCard, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
      {reviewRow('Organization', form.organization_name)}
      {reviewRow('Job title', form.job_title)}
      {reviewRow('Start', [form.start_month, form.start_year].filter(Boolean).join(' '))}
      {reviewRow('End', [form.end_month, form.end_year].filter(Boolean).join(' ') || 'Present')}
      {reviewRow('Description', form.description)}
    </View>
  );

  const isWizard = mode === 'add';
  const nextLabel = step === 1 ? 'Next' : step === 2 ? 'Review' : 'Add Experience';

  const handlePrimary = () => {
    if (!isWizard) return handleSave();
    if (step === 3) return handleSave();
    setStep(prev => (prev === 1 ? 2 : 3));
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissable={!saving}>
      <View style={styles.header}>
        {isWizard && step > 1 ? (
          <Pressable onPress={() => setStep(prev => (prev === 3 ? 2 : 1))} hitSlop={8} style={styles.backButton}>
            <ChevronLeft size={18} color={colors.ink} strokeWidth={1.8} />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        <Text style={[fonts.display, styles.title, { color: colors.ink }]}>{title}</Text>
        <View style={styles.backButton} />
      </View>

      {isWizard && (
        <View style={styles.dots}>
          {[1, 2, 3].map(n => (
            <View key={n} style={[styles.dot, { backgroundColor: n <= step ? colors.gold : colors.border }]} />
          ))}
        </View>
      )}

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {!isWizard ? (
          <>
            {fieldsBody}
            {datesBody}
          </>
        ) : step === 1 ? (
          fieldsBody
        ) : step === 2 ? (
          datesBody
        ) : (
          reviewBody
        )}
      </ScrollView>

      <View style={styles.footerRow}>
        {isWizard && step > 1 && (
          <Pressable
            onPress={() => setStep(prev => (prev === 3 ? 2 : 1))}
            style={[styles.footerButton, styles.secondaryButton, { borderColor: colors.border }]}
          >
            <Text style={[fonts.bold, styles.footerButtonText, { color: colors.ink }]}>Back</Text>
          </Pressable>
        )}
        <Pressable
          onPress={handlePrimary}
          disabled={saving}
          style={[styles.footerButton, styles.primaryButton, { backgroundColor: '#182E43', opacity: saving ? 0.6 : 1 }]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[fonts.bold, styles.footerButtonText, { color: '#fff' }]}>{isWizard ? nextLabel : 'Save'}</Text>
          )}
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, flex: 1, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 20, height: 4, borderRadius: 2 },
  body: { marginTop: 16 },
  fieldGroup: { gap: 6, marginBottom: 14 },
  fieldLabel: { fontSize: 11.5 },
  row: { flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 4 },
  half: { flex: 1 },
  input: { height: 44, paddingHorizontal: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, fontSize: 13.5 },
  textarea: { height: 76, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, fontSize: 13.5, textAlignVertical: 'top' },
  reviewCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 10, marginBottom: 16 },
  reviewRow: { gap: 2 },
  reviewLabel: { fontSize: 10.5, letterSpacing: 0.3 },
  reviewValue: { fontSize: 13.5, lineHeight: 18 },
  footerRow: { flexDirection: 'row', gap: 10, marginTop: 6, paddingTop: 10 },
  footerButton: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButton: {},
  secondaryButton: { borderWidth: StyleSheet.hairlineWidth },
  footerButtonText: { fontSize: 13.5 },
});
