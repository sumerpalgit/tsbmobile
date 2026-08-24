import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisDropdown } from '../ThesisDropdown';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateLenderThesis, LenderThesis } from '../../../../api/roleThesis';

const LENDING_EXPERIENCE_OPTIONS = ['< 2 years', '2-5 years', '5-10 years', '10-15 years', '15-20 years', '20+ years'];
const VALUE_ADD_OPTIONS = ['Fast Approval', 'ETA Specialist', 'SBA Expertise', 'Flexible Terms', 'Low Fees', 'Nationwide Reach', 'Dedicated Relationship Mgr', 'Searcher Community', 'Post-Close Support', 'Repeat Borrower Rates'];

/** "Track Record & Value Add" edit sheet — matches web's real `TrackRecordCard`
 * (`LenderThesisTab.tsx`, Card 5). */
export function TrackRecordSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: LenderThesis;
  onClose: () => void;
  onSaved: (patch: Partial<LenderThesis>) => void;
}) {
  const { colors, fonts } = useTheme();
  const [experience, setExperience] = useState('');
  const [dealsFunded, setDealsFunded] = useState('');
  const [capitalDeployed, setCapitalDeployed] = useState('');
  const [valueAdd, setValueAdd] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setExperience(thesis.yearsOfLendingExperience);
    setDealsFunded(thesis.numberOfDealsFunded);
    setCapitalDeployed(thesis.totalCapitalDeployed);
    setValueAdd(thesis.valueAddDifferentiation);
  }, [visible, thesis]);

  // Stable callback identity (functional `setState`) so `ThesisPillRow`'s memoization actually
  // takes effect — see its own doc comment for why.
  const toggleValueAdd = useCallback((option: string) => setValueAdd(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<LenderThesis> = {
      yearsOfLendingExperience: experience,
      numberOfDealsFunded: dealsFunded.trim(),
      totalCapitalDeployed: capitalDeployed.trim(),
      valueAddDifferentiation: valueAdd,
    };
    try {
      await updateLenderThesis(patch);
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
      title="Track Record & Value Add"
      description="Your experience and what sets you apart"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Years of lending experience">
        <ThesisDropdown options={LENDING_EXPERIENCE_OPTIONS} value={experience} onChange={setExperience} placeholder="Select years" />
      </ThesisField>

      <ThesisField label="Number of deals funded">
        <TextInput
          value={dealsFunded}
          onChangeText={setDealsFunded}
          placeholder="85"
          placeholderTextColor={colors.ink3}
          keyboardType="number-pad"
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <ThesisField label="Total capital deployed">
        <View style={[styles.dollarBox, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
          <Text style={[styles.dollar, { color: colors.ink3 }]}>$</Text>
          <TextInput
            value={capitalDeployed}
            onChangeText={setCapitalDeployed}
            placeholder="320,000,000"
            placeholderTextColor={colors.ink3}
            keyboardType="number-pad"
            style={[styles.dollarInput, { color: colors.ink }]}
          />
        </View>
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Cumulative USD</Text>
      </ThesisField>

      <ThesisField label="Value-add & differentiation">
        <ThesisPillRow options={VALUE_ADD_OPTIONS} selected={valueAdd} onToggle={toggleValueAdd} />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
  dollarBox: { flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12 },
  dollar: { fontSize: 13, marginRight: 4 },
  dollarInput: { flex: 1, minWidth: 0, fontSize: 13, padding: 0 },
  hint: { fontSize: 10.5, marginTop: 6 },
});
