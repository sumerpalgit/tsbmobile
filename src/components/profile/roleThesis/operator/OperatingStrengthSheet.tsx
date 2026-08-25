import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateOperatorThesis, OperatorThesis } from '../../../../api/roleThesis';

const TRANSACTION_EXPERIENCE = [
  'M&A / Buy-side acquisition',
  'Post-acquisition integration',
  'Bolt-on acquisition',
  'Carve-out / Divestiture',
  'Management buyout (MBO)',
  'Recapitalization',
  'ESOP transaction',
  'Distressed / Turnaround',
  'No prior transaction experience',
];
const LEADERSHIP_EXPERIENCE = [
  'P&L ownership ($1M–$5M)',
  'P&L ownership ($5M–$25M)',
  'P&L ownership ($25M+)',
  'Team of 1–10',
  'Team of 10–50',
  'Team of 50–200',
  'Team of 200+',
  'Cross-functional leadership',
  'Board-level reporting',
  'C-suite experience',
];

/** "Operating Strength" edit sheet — matches web's real Card 2 (`OperatorThesisTab.tsx`). */
export function OperatingStrengthSheet({
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
  const { colors, fonts } = useTheme();
  const [outcomes, setOutcomes] = useState('');
  const [transactions, setTransactions] = useState<string[]>([]);
  const [leadership, setLeadership] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setOutcomes(thesis.keyOutcomesDelivered);
    setTransactions(thesis.transactionExperience);
    setLeadership(thesis.leadershipExperience);
    setBio(thesis.operatingBio);
  }, [visible, thesis]);

  const toggleTransactions = useCallback((option: string) => setTransactions(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleLeadership = useCallback((option: string) => setLeadership(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<OperatorThesis> = {
      keyOutcomesDelivered: outcomes.trim(),
      transactionExperience: transactions,
      leadershipExperience: leadership,
      operatingBio: bio.trim(),
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
      icon={<TrendingUp size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Operating strength & experience"
      description="Outcomes, transactions and ownership background"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Key Outcomes Delivered">
        <TextInput
          value={outcomes}
          onChangeText={setOutcomes}
          placeholder="e.g. Grew revenue from $5M to $18M, reduced COGS by 22%, built team of 40 from scratch..."
          placeholderTextColor={colors.ink3}
          multiline
          textAlignVertical="top"
          style={[styles.textareaShort, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <ThesisField label="Transaction Experience">
        <ThesisPillRow options={TRANSACTION_EXPERIENCE} selected={transactions} onToggle={toggleTransactions} />
      </ThesisField>

      <ThesisField label="Ownership Experience">
        <ThesisPillRow options={LEADERSHIP_EXPERIENCE} selected={leadership} onToggle={toggleLeadership} />
      </ThesisField>

      <ThesisField label="Operating Bio">
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Describe your operating background — the businesses you've run, the results you've delivered..."
          placeholderTextColor={colors.ink3}
          multiline
          textAlignVertical="top"
          style={[styles.textarea, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>{bio.length} / 600 characters</Text>
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  textareaShort: { height: 80, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 12.5, lineHeight: 18 },
  textarea: { height: 130, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 12.5, lineHeight: 18 },
  hint: { fontSize: 10.5, marginTop: 6 },
});
