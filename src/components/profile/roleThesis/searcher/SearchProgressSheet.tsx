import React, { useEffect, useState } from 'react';
import { Target } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateSearcherThesis, SearcherThesis } from '../../../../api/roleThesis';

const SEARCH_STAGES = ['Preparing', 'Actively sourcing', 'LOI stage', 'Under DD', 'Closed'];
const TIME_COMMITMENTS = ['Full-time', 'Part-time'];

/** "Search Progress & Commitment" edit sheet — matches web's real `SearchProgressCard`
 * (`SearcherThesisTab.tsx:723-822`): Stage of Search (`SinglePills`) and Time Commitment (a
 * 2-button toggle where tapping the active option again deselects it back to empty — reused here
 * via `ThesisPillRow`'s own selected-array shape with a custom toggle handler, same as the Deal
 * Flow sheet's single-selects). */
export function SearchProgressSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: SearcherThesis;
  onClose: () => void;
  onSaved: (patch: Partial<SearcherThesis>) => void;
}) {
  const { colors } = useTheme();
  const [stage, setStage] = useState('');
  const [commitment, setCommitment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStage(thesis.stageOfSearch);
    setCommitment(thesis.timeCommitment);
  }, [visible, thesis]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<SearcherThesis> = { stageOfSearch: stage, timeCommitment: commitment };
    try {
      await updateSearcherThesis(patch);
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
      icon={<Target size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Search Progress & Commitment"
      description="Where you are in your search journey"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Stage of search">
        <ThesisPillRow options={SEARCH_STAGES} selected={stage ? [stage] : []} onToggle={setStage} />
      </ThesisField>

      <ThesisField label="Time commitment">
        <ThesisPillRow
          options={TIME_COMMITMENTS}
          selected={commitment ? [commitment] : []}
          onToggle={option => setCommitment(prev => (prev === option ? '' : option))}
        />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}
