import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisDropdown } from '../ThesisDropdown';
import { ThesisRangeInput } from '../ThesisRangeInput';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateLenderThesis, LenderThesis } from '../../../../api/roleThesis';

const EQUITY_CONTRIBUTION_OPTIONS = ['5%', '10%', '15%', '20%', '25%', '30%', '35%', '40%', '45%', '50%'];
const LOAN_DURATION_OPTIONS = ['1 year', '2 years', '3 years', '5 years', '7 years', '10 years', '15 years', '20 years', '25 years', '30 years'];
const REPAYMENT_TYPES = ['Fully Amortising', 'Interest Only', 'Bullet', 'PIK'];
const COLLATERAL_OPTIONS = ['Personal Guarantee', 'Business Assets', 'Real Estate', 'SBA Lien', 'Equipment', 'AR / Inventory', 'Unsecured (rare)'];

/** "Deal Terms & Structure" edit sheet — matches web's real `DealTermsCard`
 * (`LenderThesisTab.tsx`, Card 3). Repayment Type is a multi-select pill UI on web but only its
 * first selected value is ever persisted (`amortizationType = repaymentTypes[0]`) — that quirk is
 * handled entirely in `updateLenderThesis`, this sheet just sends the array it has like every other
 * multi-pill field. */
export function DealTermsSheet({
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
  const [minEquity, setMinEquity] = useState('');
  const [rateMin, setRateMin] = useState('');
  const [rateMax, setRateMax] = useState('');
  const [loanDuration, setLoanDuration] = useState('');
  const [repaymentTypes, setRepaymentTypes] = useState<string[]>([]);
  const [collateral, setCollateral] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setMinEquity(thesis.minEquityContribution);
    setRateMin(thesis.interestRateMin);
    setRateMax(thesis.interestRateMax);
    setLoanDuration(thesis.typicalLoanDuration);
    setRepaymentTypes(thesis.repaymentTypes);
    setCollateral(thesis.collateralRequirements);
  }, [visible, thesis]);

  // Stable callback identity (functional `setState`) so `ThesisPillRow`'s memoization actually
  // takes effect — see its own doc comment for why.
  const toggleRepaymentTypes = useCallback((option: string) => setRepaymentTypes(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleCollateral = useCallback((option: string) => setCollateral(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<LenderThesis> = {
      minEquityContribution: minEquity,
      interestRateMin: rateMin.trim(),
      interestRateMax: rateMax.trim(),
      typicalLoanDuration: loanDuration,
      repaymentTypes,
      collateralRequirements: collateral,
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
      icon={<CreditCard size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Deal Terms & Structure"
      description="How you structure your loans"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Min equity contribution required">
        <ThesisDropdown options={EQUITY_CONTRIBUTION_OPTIONS} value={minEquity} onChange={setMinEquity} placeholder="Select %" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Required borrower equity injection</Text>
      </ThesisField>

      <ThesisField label="Interest rate range">
        <ThesisRangeInput minValue={rateMin} maxValue={rateMax} onMinChange={setRateMin} onMaxChange={setRateMax} minPlaceholder="8.5" maxPlaceholder="12.0" prefix="" suffix="%" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Annual rate (%)</Text>
      </ThesisField>

      <ThesisField label="Typical loan duration">
        <ThesisDropdown options={LOAN_DURATION_OPTIONS} value={loanDuration} onChange={setLoanDuration} placeholder="Select duration" />
      </ThesisField>

      <ThesisField label="Repayment type">
        <ThesisPillRow options={REPAYMENT_TYPES} selected={repaymentTypes} onToggle={toggleRepaymentTypes} />
      </ThesisField>

      <ThesisField label="Security / collateral requirements">
        <ThesisPillRow options={COLLATERAL_OPTIONS} selected={collateral} onToggle={toggleCollateral} />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 10.5, marginTop: 6 },
});
