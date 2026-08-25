import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Star } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateBusinessOwnerThesis, BusinessOwnerThesis } from '../../../../api/roleThesis';

const TRANSITION_TYPE_OPTIONS = ['Full Sale', 'Majority', 'Minority', 'Recapitalization', 'Management Buyout', 'ESOP', 'Merger'];
/** Same list the main tab's `TimelineBar` (read mode) iterates over — kept as an independent local
 * copy rather than a shared import to avoid a circular import between this sheet and
 * `BusinessOwnerThesisTab.tsx` (which itself imports this sheet). */
const TARGET_TIMELINE_OPTIONS = ['0–6 months', '6–12 months', '1–2 years', '2+ years', 'Open / Exploring'];

/** "Transaction Intent & Context" edit sheet — matches web's real Card 1
 * (`IntermediaryThesisTab.tsx:441-540`, the file that actually renders for `role_type === 'seller'`
 * per this role's own filename-swap quirk — see `BusinessOwnerThesis`'s doc comment). */
export function TransactionIntentSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: BusinessOwnerThesis;
  onClose: () => void;
  onSaved: (patch: Partial<BusinessOwnerThesis>) => void;
}) {
  const { colors } = useTheme();
  const [reasonForTransaction, setReasonForTransaction] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');
  const [typesOfTransitionOpenTo, setTypesOfTransitionOpenTo] = useState<string[]>([]);
  const [targetTimeline, setTargetTimeline] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setReasonForTransaction(thesis.reasonForTransaction);
    setCurrentSituation(thesis.currentSituation);
    setTypesOfTransitionOpenTo(thesis.typesOfTransitionOpenTo);
    setTargetTimeline(thesis.targetTimeline);
  }, [visible, thesis]);

  const toggleTypes = useCallback((option: string) => setTypesOfTransitionOpenTo(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<BusinessOwnerThesis> = {
      reasonForTransaction: reasonForTransaction.trim(),
      currentSituation: currentSituation.trim(),
      typesOfTransitionOpenTo,
      targetTimeline,
    };
    try {
      await updateBusinessOwnerThesis(patch);
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
      icon={<Star size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Transaction intent & context"
      description="Why you are looking to transact and what you are open to"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Primary Reason for Transaction">
        <TextInput
          underlineColorAndroid="transparent"
          value={reasonForTransaction}
          onChangeText={setReasonForTransaction}
          placeholder="Describe why you are considering a transaction..."
          placeholderTextColor={colors.ink3}
          multiline
          textAlignVertical="top"
          style={[styles.textarea, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <ThesisField label="Your Current Situation">
        <TextInput
          underlineColorAndroid="transparent"
          value={currentSituation}
          onChangeText={setCurrentSituation}
          placeholder="Describe your current business situation..."
          placeholderTextColor={colors.ink3}
          multiline
          textAlignVertical="top"
          style={[styles.textarea, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <ThesisField label="Type of Transition Open To">
        <ThesisPillRow options={TRANSITION_TYPE_OPTIONS} selected={typesOfTransitionOpenTo} onToggle={toggleTypes} />
      </ThesisField>

      <ThesisField label="Target Timeline to Transact">
        <ThesisPillRow options={TARGET_TIMELINE_OPTIONS} selected={targetTimeline ? [targetTimeline] : []} onToggle={setTargetTimeline} />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  textarea: { height: 90, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 12.5, lineHeight: 18 },
});
