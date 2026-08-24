import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Briefcase, Check, Info } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateSearcherThesis, SearcherThesis } from '../../../../api/roleThesis';

const LOAN_TYPES = ['SBA 7(a)', 'SBA 504', 'Conventional', 'Seller Financing', 'Mezzanine', 'Bridge Loan', 'USDA', 'Other'];

/** "Capital & Funding Readiness" edit sheet — matches web's real `CapitalFundingCard` exactly
 * (`SearcherThesisTab.tsx:488-617`), including its two visually distinct grouped panels (per
 * explicit user direction after the first pass showed every field flat with no grouping): an
 * "Equity Capital" panel (`bg-[var(--tsb-border)]` → `colors.border`, exact hex match confirmed)
 * with an Info-icon caption "How much equity have you raised or committed?", the two $ inputs +
 * checkbox, then a divider + Equity status; and a "Debt Financing" panel, same style, caption
 * "What debt financing are you targeting?", Min/Max debt SIDE BY SIDE (a 2-col grid on web, not
 * stacked) + Loan types. External Capital Requirement / Investor Type Preference stay OUTSIDE
 * both panels (web has them in their own 2-col row below), and Investor Type Preference is a
 * plain comma-separated text input on web (NOT a pill picker, despite an `INVESTOR_TYPE_OPTIONS`
 * constant existing unused nearby), replicated as such rather than "fixed" into a picker. */
export function CapitalFundingSheet({
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
  const { colors, fonts } = useTheme();
  const [amountRaised, setAmountRaised] = useState('');
  const [targetTotal, setTargetTotal] = useState('');
  const [notRaised, setNotRaised] = useState(false);
  const [capitalType, setCapitalType] = useState('');
  const [debtMin, setDebtMin] = useState('');
  const [debtMax, setDebtMax] = useState('');
  const [loanTypes, setLoanTypes] = useState<string[]>([]);
  const [externalCapital, setExternalCapital] = useState('');
  const [investorTypeText, setInvestorTypeText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAmountRaised(thesis.equityAmountRaised);
    setTargetTotal(thesis.equityTargetTotal);
    setNotRaised(thesis.equityNotRaised);
    setCapitalType(thesis.equityCapitalType);
    setDebtMin(thesis.debtAmountMin);
    setDebtMax(thesis.debtAmountMax);
    setLoanTypes(thesis.debtLoanTypes);
    setExternalCapital(thesis.externalCapitalRequirements);
    setInvestorTypeText(thesis.investorTypePreferences.join(', '));
  }, [visible, thesis]);

  const toggleLoanType = (option: string) => {
    setLoanTypes(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<SearcherThesis> = {
      equityAmountRaised: amountRaised.trim(),
      equityTargetTotal: targetTotal.trim(),
      equityNotRaised: notRaised,
      equityCapitalType: capitalType.trim(),
      debtAmountMin: debtMin.trim(),
      debtAmountMax: debtMax.trim(),
      debtLoanTypes: loanTypes,
      externalCapitalRequirements: externalCapital.trim(),
      investorTypePreferences: investorTypeText.split(',').map(s => s.trim()).filter(Boolean),
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
      icon={<Briefcase size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Capital & Funding Readiness"
      description="Your equity raised, debt secured and investor position"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Equity Capital">
        <View style={[styles.panel, { backgroundColor: colors.border }]}>
          <View style={styles.panelCaption}>
            <Info size={14} color={colors.ink3} strokeWidth={1.8} />
            <Text style={[fonts.bold, styles.panelCaptionText, { color: colors.ink3 }]}>How much equity have you raised or committed?</Text>
          </View>

          <View style={styles.panelField}>
            <Text style={[fonts.regular, styles.panelFieldLabel, { color: colors.ink2 }]}>Amount raised / committed</Text>
            <View style={[styles.dollarBox, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, opacity: notRaised ? 0.5 : 1 }]}>
              <Text style={[styles.dollar, { color: colors.ink3 }]}>$</Text>
              <TextInput
                value={amountRaised}
                onChangeText={setAmountRaised}
                placeholder="250,000"
                placeholderTextColor={colors.ink3}
                keyboardType="number-pad"
                editable={!notRaised}
                style={[styles.dollarInput, { color: colors.ink }]}
              />
            </View>
          </View>

          <View style={styles.panelField}>
            <Text style={[fonts.regular, styles.panelFieldLabel, { color: colors.ink2 }]}>Total equity target</Text>
            <View style={[styles.dollarBox, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, opacity: notRaised ? 0.5 : 1 }]}>
              <Text style={[styles.dollar, { color: colors.ink3 }]}>$</Text>
              <TextInput
                value={targetTotal}
                onChangeText={setTargetTotal}
                placeholder="500,000"
                placeholderTextColor={colors.ink3}
                keyboardType="number-pad"
                editable={!notRaised}
                style={[styles.dollarInput, { color: colors.ink }]}
              />
            </View>
          </View>

          <Pressable onPress={() => setNotRaised(v => !v)} style={styles.checkboxRow}>
            <View style={[styles.checkbox, { borderColor: notRaised ? colors.gold : colors.authFieldBorder }, notRaised && { backgroundColor: colors.gold }]}>
              {notRaised && <Check size={13} color="#fff" strokeWidth={2.4} />}
            </View>
            <Text style={[fonts.regular, styles.checkboxLabel, { color: colors.ink2 }]}>I have not raised any equity yet</Text>
          </Pressable>

          <View style={[styles.panelDivider, { borderTopColor: colors.borderSoft }]}>
            <Text style={[fonts.regular, styles.panelFieldLabel, { color: colors.ink2 }]}>Equity status</Text>
            <TextInput
              value={capitalType}
              onChangeText={setCapitalType}
              placeholderTextColor={colors.ink3}
              style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
            />
          </View>
        </View>
      </ThesisField>

      <ThesisField label="Debt Financing">
        <View style={[styles.panel, { backgroundColor: colors.border }]}>
          <View style={styles.panelCaption}>
            <Info size={14} color={colors.ink3} strokeWidth={1.8} />
            <Text style={[fonts.bold, styles.panelCaptionText, { color: colors.ink3 }]}>What debt financing are you targeting?</Text>
          </View>

          <View style={styles.debtRow}>
            <View style={[styles.dollarBox, styles.debtCol, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
              <Text style={[styles.dollar, { color: colors.ink3 }]}>$</Text>
              <TextInput
                value={debtMin}
                onChangeText={setDebtMin}
                placeholder="Min debt"
                placeholderTextColor={colors.ink3}
                keyboardType="number-pad"
                style={[styles.dollarInput, { color: colors.ink }]}
              />
            </View>
            <View style={[styles.dollarBox, styles.debtCol, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
              <Text style={[styles.dollar, { color: colors.ink3 }]}>$</Text>
              <TextInput
                value={debtMax}
                onChangeText={setDebtMax}
                placeholder="Max debt"
                placeholderTextColor={colors.ink3}
                keyboardType="number-pad"
                style={[styles.dollarInput, { color: colors.ink }]}
              />
            </View>
          </View>

          <View style={styles.panelField}>
            <Text style={[fonts.regular, styles.panelFieldLabel, { color: colors.ink2 }]}>Loan types</Text>
            <ThesisPillRow options={LOAN_TYPES} selected={loanTypes} onToggle={toggleLoanType} />
          </View>
        </View>
      </ThesisField>

      <View style={styles.bottomRow}>
        <View style={styles.bottomCol}>
          <ThesisField label="External capital requirement">
            <TextInput
              value={externalCapital}
              onChangeText={setExternalCapital}
              placeholderTextColor={colors.ink3}
              style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
            />
          </ThesisField>
        </View>
        <View style={styles.bottomCol}>
          <ThesisField label="Investor type preference">
            <TextInput
              value={investorTypeText}
              onChangeText={setInvestorTypeText}
              placeholder="e.g. Family Office, Angel"
              placeholderTextColor={colors.ink3}
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
  dollarBox: { flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12 },
  dollar: { fontSize: 13, marginRight: 4 },
  dollarInput: { flex: 1, minWidth: 0, fontSize: 13, padding: 0 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.6, alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { fontSize: 12.5 },
  panel: { borderRadius: 10, padding: 14, gap: 12 },
  panelCaption: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  panelCaptionText: { flex: 1, minWidth: 0, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  panelField: { gap: 6 },
  panelFieldLabel: { fontSize: 12.5 },
  panelDivider: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 6 },
  debtRow: { flexDirection: 'row', gap: 10 },
  debtCol: { flex: 1, minWidth: 0 },
  // `alignItems: 'flex-end'` — when the two labels above these inputs wrap to a different number
  // of lines ("External capital requirement" vs "Investor type preference"), this keeps both
  // TextInputs aligned on the same row instead of the shorter-label column sitting higher.
  bottomRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-end' },
  bottomCol: { flex: 1, minWidth: 0 },
});
