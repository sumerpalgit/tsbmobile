import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisField } from '../ThesisField';
import { updateInvestorThesis, InvestorThesis } from '../../../../api/roleThesis';

/** "Track Record & Value Add" edit sheet — matches web's real `TrackRecordCard`
 * (`InvestmentThesisTab.tsx:707-853`): Total Capital Invested ($ input), Number of Investments
 * Made, Active Portfolio Companies, How You Support Portfolio Companies (multi-line textarea —
 * each newline becomes a separate bulleted read-mode line, matching web's own
 * `support.split("\n")`). All optional. */
export function TrackRecordValueAddSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: InvestorThesis;
  onClose: () => void;
  onSaved: (patch: Partial<InvestorThesis>) => void;
}) {
  const { colors, fonts } = useTheme();
  const [capital, setCapital] = useState('');
  const [investments, setInvestments] = useState('');
  const [activeCos, setActiveCos] = useState('');
  const [support, setSupport] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCapital(thesis.totalCapitalInvested);
    setInvestments(thesis.numberOfInvestmentsMade);
    setActiveCos(thesis.activePortfolioCompanies);
    setSupport(thesis.portfolioSupportCapabilities);
  }, [visible, thesis]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<InvestorThesis> = {
      totalCapitalInvested: capital.trim(),
      numberOfInvestmentsMade: investments.trim(),
      activePortfolioCompanies: activeCos.trim(),
      portfolioSupportCapabilities: support.trim(),
    };
    try {
      await updateInvestorThesis(patch);
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
      title="Track Record & Value Add"
      description="Capital deployed and how you help portfolio companies"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Total capital invested">
        <View style={[styles.dollarBox, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
          <Text style={[styles.dollar, { color: colors.ink3 }]}>$</Text>
          <TextInput
            value={capital}
            onChangeText={setCapital}
            placeholder="47,000,000"
            placeholderTextColor={colors.ink3}
            keyboardType="number-pad"
            style={[styles.dollarInput, { color: colors.ink }]}
          />
        </View>
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Cumulative USD deployed</Text>
      </ThesisField>

      <ThesisField label="Number of investments made">
        <TextInput
          value={investments}
          onChangeText={setInvestments}
          placeholder="11"
          placeholderTextColor={colors.ink3}
          keyboardType="number-pad"
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Total deals closed</Text>
      </ThesisField>

      <ThesisField label="Active portfolio companies">
        <TextInput
          value={activeCos}
          onChangeText={setActiveCos}
          placeholder="6"
          placeholderTextColor={colors.ink3}
          keyboardType="number-pad"
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Currently held</Text>
      </ThesisField>

      <ThesisField label="How you support portfolio companies">
        <TextInput
          value={support}
          onChangeText={setSupport}
          placeholder="e.g. Board participation from day one, 100-day operational playbook, access to fractional CFO network…"
          placeholderTextColor={colors.ink3}
          multiline
          textAlignVertical="top"
          style={[styles.textarea, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
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
  textarea: { height: 100, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 12.5, lineHeight: 18 },
});
