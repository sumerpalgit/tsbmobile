import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisField } from '../ThesisField';
import { updateBusinessOwnerThesis, BusinessOwnerThesis } from '../../../../api/roleThesis';
import { PrivacyNote } from './PrivacyNote';

/** "Growth & Risks" edit sheet — matches web's real Card 5 (`IntermediaryThesisTab.tsx:877-955`),
 * including its 500-character limit (`.slice(0, 500)` on every keystroke) on both fields. */
export function GrowthRisksSheet({
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
  const { colors, fonts } = useTheme();
  const [keyGrowthOpportunities, setKeyGrowthOpportunities] = useState('');
  const [currentConstraintsChallenges, setCurrentConstraintsChallenges] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setKeyGrowthOpportunities(thesis.keyGrowthOpportunities);
    setCurrentConstraintsChallenges(thesis.currentConstraintsChallenges);
  }, [visible, thesis]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<BusinessOwnerThesis> = {
      keyGrowthOpportunities: keyGrowthOpportunities.trim(),
      currentConstraintsChallenges: currentConstraintsChallenges.trim(),
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
      icon={<TrendingUp size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Growth & risks"
      description="Opportunities and challenges for the business"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Key Growth Opportunities">
        <TextInput
          underlineColorAndroid="transparent"
          value={keyGrowthOpportunities}
          onChangeText={t => setKeyGrowthOpportunities(t.slice(0, 500))}
          placeholder="What are the main growth levers a new owner could pull? e.g. Geographic expansion, new service lines, under-invested marketing..."
          placeholderTextColor={colors.ink3}
          multiline
          textAlignVertical="top"
          style={[styles.textarea, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
        <Text style={[fonts.regular, styles.counter, { color: colors.ink3 }]}>{keyGrowthOpportunities.length} / 500</Text>
      </ThesisField>

      <ThesisField label="Current Constraints / Challenges">
        <TextInput
          underlineColorAndroid="transparent"
          value={currentConstraintsChallenges}
          onChangeText={t => setCurrentConstraintsChallenges(t.slice(0, 500))}
          placeholder="Be honest about what has held the business back or what risks a buyer should know about..."
          placeholderTextColor={colors.ink3}
          multiline
          textAlignVertical="top"
          style={[styles.textarea, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
        <Text style={[fonts.regular, styles.counter, { color: colors.ink3 }]}>{currentConstraintsChallenges.length} / 500</Text>
      </ThesisField>

      <PrivacyNote>
        This section is shown to matched buyers after NDA to help them assess fit before making first contact. Be candid — it builds trust.
      </PrivacyNote>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  textarea: { height: 110, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 12.5, lineHeight: 18 },
  counter: { fontSize: 10.5, marginTop: 4, textAlign: 'right' },
});
