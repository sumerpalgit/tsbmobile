import React, { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateStudentThesis, StudentThesis } from '../../../../api/roleThesis';

const PREFERRED_MODE_OPTIONS = ['Remote / virtual', 'On-site / embedded', 'Hybrid', 'Flexible — open to options'];
const DURATION_OPTIONS = ['Ad hoc / one-off', 'Summer internship (10–12 wks)', 'Semester project', '6–12 months', 'Ongoing / open-ended'];
const COMPENSATION_OPTIONS = ['Paid internship / stipend', 'Unpaid (for credit / experience)', 'Project-based fee', 'Equity / carry', 'Open to discussion'];

/** "Engagement Preferences" edit sheet — matches web's real Card 3 (`StudentThesisTab.tsx:461-543`).
 * Web's own footer CTA here is unconditional (no `{!hasData &&}` guard) — see the main tab's
 * `alwaysShowCta` usage for this card. */
export function EngagementPreferencesSheet({
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
  const [preferredMode, setPreferredMode] = useState<string[]>([]);
  const [duration, setDuration] = useState('');
  const [compensation, setCompensation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPreferredMode(thesis.preferredMode);
    setDuration(thesis.duration);
    setCompensation(thesis.compensation);
  }, [visible, thesis]);

  const toggleMode = useCallback((option: string) => setPreferredMode(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<StudentThesis> = { preferredMode, duration, compensation };
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
      icon={<Plus size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Engagement preferences"
      description="How they prefer to work"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="How Do You Prefer to Engage?">
        <ThesisPillRow options={PREFERRED_MODE_OPTIONS} selected={preferredMode} onToggle={toggleMode} />
      </ThesisField>

      <ThesisField label="Preferred Engagement Duration" required>
        <ThesisPillRow options={DURATION_OPTIONS} selected={duration ? [duration] : []} onToggle={setDuration} />
      </ThesisField>

      <ThesisField label="Compensation Preference" required>
        <ThesisPillRow options={COMPENSATION_OPTIONS} selected={compensation ? [compensation] : []} onToggle={setCompensation} />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}
