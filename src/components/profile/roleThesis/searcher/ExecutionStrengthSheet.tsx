import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Zap } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisBoolToggle } from '../ThesisBoolToggle';
import { ThesisField } from '../ThesisField';
import { updateSearcherThesis, SearcherThesis } from '../../../../api/roleThesis';

/** "Execution Strength & Deal Readiness" edit sheet — matches web's real `ExecutionStrengthCard`
 * (`SearcherThesisTab.tsx:856-1022`): 4 tri-state Yes/No questions (`BOOL_QUESTIONS`) plus
 * Operational Focus. Edit-mode labels here intentionally match `BOOL_QUESTIONS`' OWN labels (the
 * literal field names), NOT the read-mode card's mismatched display copy ("Investor Backing" for
 * `hasCommitteeDiscussed`, "Looking for Co-Searcher" for `hasPriorSearchExperience") — that
 * mismatch is real web behavior worth replicating in the READ view (see `SearcherThesisTab.tsx`'s
 * own doc comment), but there's no reason to carry a confusing mislabeled question into the EDIT
 * form itself, where the user needs to know what they're actually answering. */
export function ExecutionStrengthSheet({
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
  const [priorAcquisition, setPriorAcquisition] = useState<boolean | null>(null);
  const [advisoryBoard, setAdvisoryBoard] = useState<boolean | null>(null);
  const [committeeDiscussed, setCommitteeDiscussed] = useState<boolean | null>(null);
  const [priorSearchExperience, setPriorSearchExperience] = useState<boolean | null>(null);
  const [operationalFocus, setOperationalFocus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPriorAcquisition(thesis.hasPriorAcquisition);
    setAdvisoryBoard(thesis.hasAdvisoryBoard);
    setCommitteeDiscussed(thesis.hasCommitteeDiscussed);
    setPriorSearchExperience(thesis.hasPriorSearchExperience);
    setOperationalFocus(thesis.operationalFocus);
  }, [visible, thesis]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<SearcherThesis> = {
      hasPriorAcquisition: priorAcquisition,
      hasAdvisoryBoard: advisoryBoard,
      hasCommitteeDiscussed: committeeDiscussed,
      hasPriorSearchExperience: priorSearchExperience,
      operationalFocus: operationalFocus.trim(),
    };
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
      icon={<Zap size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Execution Strength & Deal Readiness"
      description="Your background, team and deal readiness"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Prior acquisition experience">
        <ThesisBoolToggle value={priorAcquisition} onChange={setPriorAcquisition} />
      </ThesisField>

      <ThesisField label="Advisory board in place">
        <ThesisBoolToggle value={advisoryBoard} onChange={setAdvisoryBoard} />
      </ThesisField>

      <ThesisField label="Investment committee discussed">
        <ThesisBoolToggle value={committeeDiscussed} onChange={setCommitteeDiscussed} />
      </ThesisField>

      <ThesisField label="Prior search experience">
        <ThesisBoolToggle value={priorSearchExperience} onChange={setPriorSearchExperience} />
      </ThesisField>

      <ThesisField label="Operational focus">
        <TextInput
          value={operationalFocus}
          onChangeText={setOperationalFocus}
          placeholder="e.g. Operations, Finance, Sales"
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
