import React, { useCallback, useEffect, useState } from 'react';
import { Calendar } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateOperatorThesis, OperatorThesis } from '../../../../api/roleThesis';

const START_DATE_OPTIONS = ['Immediately available', 'Within 30 days', '1–3 months', '3–6 months', '6+ months', 'Open to discussion'];
const RELOCATION_OPTIONS = [
  'Open to relocation (domestic)',
  'Open to relocation (international)',
  'Not open to relocation',
  'Remote-first / No relocation needed',
];
const EQUITY_APPETITE_OPTIONS = [
  'No equity — salary only',
  'Small equity (< 5%)',
  'Meaningful equity (5–20%)',
  'Majority equity (> 20%)',
  'Open to discussion',
];
const TIME_COMMITMENT_OPTIONS = ['Full-time', 'Part-time'];
const COMPENSATION_PREF_OPTIONS = ['Base salary', 'Performance bonus', 'Day rate', 'Monthly retainer', 'Success fee'];

/** "Availability & Commercial" edit sheet — matches web's real Card 5 (`OperatorThesisTab.tsx`). */
export function AvailabilityCommercialSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: OperatorThesis;
  onClose: () => void;
  onSaved: (patch: Partial<OperatorThesis>) => void;
}) {
  const { colors } = useTheme();
  const [timeCommitment, setTimeCommitment] = useState('');
  const [compensation, setCompensation] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [relocation, setRelocation] = useState<string[]>([]);
  const [equityAppetite, setEquityAppetite] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTimeCommitment(thesis.timeCommitment);
    setCompensation(thesis.compensationPreference);
    setStartDate(thesis.startDatePreference);
    setRelocation(thesis.relocationPreference);
    setEquityAppetite(thesis.equityAppetite);
  }, [visible, thesis]);

  const toggleCompensation = useCallback((option: string) => setCompensation(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleRelocation = useCallback((option: string) => setRelocation(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleEquityAppetite = useCallback((option: string) => setEquityAppetite(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<OperatorThesis> = {
      timeCommitment,
      compensationPreference: compensation,
      startDatePreference: startDate,
      relocationPreference: relocation,
      equityAppetite,
    };
    try {
      await updateOperatorThesis(patch);
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
      icon={<Calendar size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Availability & commercial preferences"
      description="Time, location and compensation"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Time Commitment">
        <ThesisPillRow options={TIME_COMMITMENT_OPTIONS} selected={timeCommitment ? [timeCommitment] : []} onToggle={setTimeCommitment} />
      </ThesisField>

      <ThesisField label="Compensation Preferences">
        <ThesisPillRow options={COMPENSATION_PREF_OPTIONS} selected={compensation} onToggle={toggleCompensation} />
      </ThesisField>

      <ThesisField label="Start Date Preference">
        <ThesisPillRow options={START_DATE_OPTIONS} selected={startDate ? [startDate] : []} onToggle={setStartDate} />
      </ThesisField>

      <ThesisField label="Relocation Preference">
        <ThesisPillRow options={RELOCATION_OPTIONS} selected={relocation} onToggle={toggleRelocation} />
      </ThesisField>

      <ThesisField label="Equity Appetite">
        <ThesisPillRow options={EQUITY_APPETITE_OPTIONS} selected={equityAppetite} onToggle={toggleEquityAppetite} />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}
