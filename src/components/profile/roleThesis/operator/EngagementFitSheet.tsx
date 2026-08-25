import React, { useCallback, useEffect, useState } from 'react';
import { Briefcase } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateOperatorThesis, OperatorThesis } from '../../../../api/roleThesis';

const ENGAGEMENT_TYPE_OPTIONS = [
  'Full-time employee',
  'Fractional executive (part-time, ongoing)',
  'Interim / Bridge role (short-term, defined period)',
  'Project-based engagement',
  'Advisory board member',
  'Operating partner (equity-involved)',
  'Open to multiple arrangements',
];
const WORK_MODE_OPTIONS = [
  'On-site / In-person',
  'Fully remote',
  'Hybrid (remote with periodic on-site)',
  'Flexible / Open to any arrangement',
];
const DEAL_STAGE_OPTIONS = [
  'Pre-acquisition (due diligence support, operational assessment)',
  'Day 1 to 90 days (transition & stabilization)',
  '90 days to 1 year (early growth & systems building)',
  '1 to 3 years (scaling & optimization)',
  'Turnaround / Distressed situations',
  'Ongoing operations (steady state)',
  'Multiple stages / Flexible',
];
const START_ROLE_OPTIONS = [
  'Day 1 (immediate start)',
  'Within 30 days',
  '30–60 days',
  '60–90 days',
  '90+ days',
  'Flexible / Project dependent',
];

/** "Engagement Fit" edit sheet — matches web's real Card 3 (`OperatorThesisTab.tsx`). */
export function EngagementFitSheet({
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
  const [engagementType, setEngagementType] = useState<string[]>([]);
  const [workMode, setWorkMode] = useState<string[]>([]);
  const [dealStage, setDealStage] = useState<string[]>([]);
  const [startRoleWith, setStartRoleWith] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setEngagementType(thesis.engagementType);
    setWorkMode(thesis.workMode);
    setDealStage(thesis.dealStagePreference);
    setStartRoleWith(thesis.startRoleWith);
  }, [visible, thesis]);

  const toggleEngagementType = useCallback((option: string) => setEngagementType(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleWorkMode = useCallback((option: string) => setWorkMode(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleDealStage = useCallback((option: string) => setDealStage(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleStartRoleWith = useCallback((option: string) => setStartRoleWith(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<OperatorThesis> = {
      engagementType,
      workMode,
      dealStagePreference: dealStage,
      startRoleWith,
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
      icon={<Briefcase size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Engagement fit"
      description="How and when you prefer to work"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Type of Role">
        <ThesisPillRow options={ENGAGEMENT_TYPE_OPTIONS} selected={engagementType} onToggle={toggleEngagementType} />
      </ThesisField>

      <ThesisField label="Engagement Preference">
        <ThesisPillRow options={WORK_MODE_OPTIONS} selected={workMode} onToggle={toggleWorkMode} />
      </ThesisField>

      <ThesisField label="Stage Value-Add">
        <ThesisPillRow options={DEAL_STAGE_OPTIONS} selected={dealStage} onToggle={toggleDealStage} />
      </ThesisField>

      <ThesisField label="Duration Preference">
        <ThesisPillRow options={START_ROLE_OPTIONS} selected={startRoleWith} onToggle={toggleStartRoleWith} />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}
