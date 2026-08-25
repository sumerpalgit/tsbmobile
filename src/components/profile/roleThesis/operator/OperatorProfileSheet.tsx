import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { User } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisDropdown } from '../ThesisDropdown';
import { ThesisField } from '../ThesisField';
import { updateOperatorThesis, OperatorThesis } from '../../../../api/roleThesis';

const DESIGNATION_OPTIONS = [
  'CXO / Senior Executive (CEO, COO, CFO, etc)',
  'Business unit / Functional head',
  'Independent Operator',
  'Recently exited Executive',
  'Semi-retired / Portfolio professional',
  'Other',
];
const EXPERIENCE_RANGES = ['< 2 years', '2–5 years', '5–10 years', '10–15 years', '15–20 years', '20+ years'];
const FUNCTIONAL_STRENGTHS = [
  'Finance & Accounting (CFO / Controller)',
  'Operations & Process Improvement (COO / Ops Director)',
  'Sales & Revenue Growth',
  'Marketing & Brand',
  'Human Resources & People Operations',
  'Technology & Systems (CTO / IT)',
  'Supply Chain & Logistics',
  'Customer Success & Retention',
  'Legal & Compliance',
  'General Management / CEO-level',
  'Other (please specify)',
];

/** "Operator Profile" edit sheet — matches web's real Card 1 (`OperatorThesisTab.tsx`). */
export function OperatorProfileSheet({
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
  const [designation, setDesignation] = useState('');
  const [experience, setExperience] = useState('');
  const [strengths, setStrengths] = useState<string[]>([]);
  const [revenueManaged, setRevenueManaged] = useState('');
  const [teamSizeManaged, setTeamSizeManaged] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDesignation(thesis.currentDesignation);
    setExperience(thesis.totalExperience);
    setStrengths(thesis.functionalStrengths);
    setRevenueManaged(thesis.revenueManaged);
    setTeamSizeManaged(thesis.teamSizeManaged);
  }, [visible, thesis]);

  const toggleStrengths = useCallback((option: string) => setStrengths(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<OperatorThesis> = {
      currentDesignation: designation.trim(),
      totalExperience: experience,
      functionalStrengths: strengths,
      revenueManaged: revenueManaged.trim(),
      teamSizeManaged: teamSizeManaged.trim(),
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
      icon={<User size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Operator profile"
      description="Your operating role and areas of expertise"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Current Designation">
        <ThesisDropdown options={DESIGNATION_OPTIONS} value={designation} onChange={setDesignation} placeholder="Select your role" />
      </ThesisField>

      <ThesisField label="Years of Experience">
        <ThesisPillRow options={EXPERIENCE_RANGES} selected={experience ? [experience] : []} onToggle={setExperience} />
      </ThesisField>

      <ThesisField label="Functional Strengths">
        <ThesisPillRow options={FUNCTIONAL_STRENGTHS} selected={strengths} onToggle={toggleStrengths} />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Select all that apply</Text>
      </ThesisField>

      <View style={styles.row}>
        <View style={styles.col}>
          <ThesisField label="Revenue Managed ($)" labelLines={2}>
            <View style={[styles.dollarBox, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
              <Text style={[styles.dollar, { color: colors.ink3 }]}>$</Text>
              <TextInput
                value={revenueManaged}
                onChangeText={setRevenueManaged}
                placeholder="e.g. 5,000,000"
                placeholderTextColor={colors.ink3}
                keyboardType="number-pad"
                style={[styles.dollarInput, { color: colors.ink }]}
              />
            </View>
          </ThesisField>
        </View>
        <View style={styles.col}>
          <ThesisField label="Team Size Managed" labelLines={2}>
            <TextInput
              value={teamSizeManaged}
              onChangeText={setTeamSizeManaged}
              placeholder="e.g. 25"
              placeholderTextColor={colors.ink3}
              keyboardType="number-pad"
              style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
            />
          </ThesisField>
        </View>
      </View>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
  hint: { fontSize: 10.5, marginTop: 6 },
  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1, minWidth: 0 },
  dollarBox: { flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12 },
  dollar: { fontSize: 13, marginRight: 4 },
  dollarInput: { flex: 1, minWidth: 0, fontSize: 13, padding: 0 },
});
