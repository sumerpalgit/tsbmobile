import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateAdvisorThesis, AdvisorThesis } from '../../../../api/roleThesis';

const ENGAGEMENT_STAGE_OPTIONS = [
  'Pre-search (planning, structuring, readiness)',
  'Active search phase (deal sourcing, screening)',
  'At LOI / Term sheet stage',
  'Due diligence phase',
  'Closing / Transaction execution',
  'Post-close / Integration and operations',
  'Ongoing / Multiple stages',
  'Flexible / Depends on the engagement',
];
const SIDE_OPTIONS = ['Buy-side only', 'Sell-side only', 'Both sides (different engagements)'];
const ENGAGE_TYPE_OPTIONS = [
  'Project basis (defined scope)', 'Retainer (ongoing relationship)', 'Success fee / Transaction close',
  'Hourly / As needed', 'Hybrid (retainer + success fee)', 'Platform or productized service', 'Other (please specify)',
];

/** "Engagement Model" edit sheet — matches web's real `EngagementModelCard`
 * (`AdvisorThesisTab.tsx`, Card 2). */
export function EngagementModelSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: AdvisorThesis;
  onClose: () => void;
  onSaved: (patch: Partial<AdvisorThesis>) => void;
}) {
  const { colors, fonts } = useTheme();
  const [stages, setStages] = useState<string[]>([]);
  const [side, setSide] = useState('');
  const [engageTypes, setEngageTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStages(thesis.engagementStages);
    setSide(thesis.primaryRepresentation);
    setEngageTypes(thesis.engagementModelTypes);
  }, [visible, thesis]);

  const toggleStages = useCallback((option: string) => setStages(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleEngageTypes = useCallback((option: string) => setEngageTypes(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<AdvisorThesis> = {
      engagementStages: stages,
      primaryRepresentation: side,
      engagementModelTypes: engageTypes,
    };
    try {
      await updateAdvisorThesis(patch);
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
      title="Engagement Model"
      description="When and how you engage with clients"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="When do you typically get involved?">
        <ThesisPillRow options={ENGAGEMENT_STAGE_OPTIONS} selected={stages} onToggle={toggleStages} />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Select all that apply</Text>
      </ThesisField>

      <ThesisField label="Which side do you primarily represent?">
        <ThesisPillRow options={SIDE_OPTIONS} selected={side ? [side] : []} onToggle={setSide} />
      </ThesisField>

      <ThesisField label="How do you typically engage?">
        <ThesisPillRow options={ENGAGE_TYPE_OPTIONS} selected={engageTypes} onToggle={toggleEngageTypes} />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Select all that apply</Text>
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 10.5, marginTop: 6 },
});
