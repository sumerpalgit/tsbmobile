import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Clock } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateStudentThesis, StudentThesis } from '../../../../api/roleThesis';

const TIME_COMMITMENT_OPTIONS = [
  'Less than 5 hours per week',
  '5 – 10 hours per week',
  '10 – 20 hours per week',
  '20 – 30 hours per week',
  'Full-time (40+ hours per week)',
];

/** "Availability & Logistics" edit sheet — matches web's real Card 4 (`StudentThesisTab.tsx:546-618`).
 * Web's own footer CTA here is unconditional (no `{!hasData &&}` guard) — see the main tab's
 * `alwaysShowCta` usage for this card. */
export function AvailabilityLogisticsSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: StudentThesis;
  onClose: () => void;
  onSaved: (patch: Partial<StudentThesis>) => void;
}) {
  const { colors } = useTheme();
  const [timeCommitment, setTimeCommitment] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTimeCommitment(thesis.timeCommitment);
    setStartDate(thesis.startDate);
  }, [visible, thesis]);

  const toggleCommitment = useCallback((option: string) => setTimeCommitment(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<StudentThesis> = { timeCommitment, startDate: startDate.trim() };
    try {
      await updateStudentThesis(patch);
      onSaved(patch);
      onClose();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not save', text2: 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleThesisEditSheet
      visible={visible}
      onClose={onClose}
      icon={<Clock size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Availability & logistics"
      description="Time commitment and start date"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Time Commitment" required>
        <ThesisPillRow options={TIME_COMMITMENT_OPTIONS} selected={timeCommitment} onToggle={toggleCommitment} />
      </ThesisField>

      <ThesisField label="Start Date Preference">
        <TextInput
          underlineColorAndroid="transparent"
          value={startDate}
          onChangeText={setStartDate}
          placeholder="e.g. May 2025 or Immediately"
          placeholderTextColor={colors.ink3}
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
});
