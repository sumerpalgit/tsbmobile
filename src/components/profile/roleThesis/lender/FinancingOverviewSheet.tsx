import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Building2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisDropdown } from '../ThesisDropdown';
import { ThesisRangeInput } from '../ThesisRangeInput';
import { ThesisField } from '../ThesisField';
import { updateLenderThesis, LenderThesis } from '../../../../api/roleThesis';

const FINANCING_TYPES = [
  'Term Loan', 'Revolving Credit Facility', 'Cash Flow Based Lending',
  'Asset Based Lending (ABL)', 'Acquisition Financing', 'Bridge financing',
  'Refinancing / Recapitalisation', 'Equipment Financing', 'Real Estate Financing',
  'Working capital facilities', 'Mezzanine / Subordinated debt', 'Others',
];
const FINANCING_PRODUCTS = ['Acquisition Finance', 'Working Capital', 'Equipment Finance', 'Real Estate', 'Capex Loans', 'Refinancing', 'Line of Credit', 'ESOP Financing'];
const DEAL_STAGE_OPTIONS = ['Pre-LOI (early conversations)', 'At LOI / Term sheet stage', 'In due diligence', 'Closing / Near close', 'Post-close / Add-on financing', 'Flexible / Any stage'];
const SBA_OPTIONS = ['Yes. SBA-approved lender', 'No. Non-SBA lending only', 'Both', 'Not applicable (outside the US)'];

/** "Financing Overview" edit sheet — matches web's real `FinancingOverviewCard`
 * (`LenderThesisTab.tsx`, Card 1). */
export function FinancingOverviewSheet({
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
  const [types, setTypes] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [dealStages, setDealStages] = useState<string[]>([]);
  const [sbaStatus, setSbaStatus] = useState('');
  const [loanMin, setLoanMin] = useState('');
  const [loanMax, setLoanMax] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTypes(thesis.typeOfFinancing);
    setProducts(thesis.financingProducts);
    setDealStages(thesis.dealStagePreference);
    setSbaStatus(thesis.sbaStatus);
    setLoanMin(thesis.typicalLoanSizeMin);
    setLoanMax(thesis.typicalLoanSizeMax);
  }, [visible, thesis]);

  // Stable callback identity (functional `setState`, no closed-over `list`) so `ThesisPillRow`'s
  // memoization actually takes effect — see `ThesisPillRow`'s own doc comment for why.
  const toggleTypes = useCallback((option: string) => setTypes(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleProducts = useCallback((option: string) => setProducts(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleDealStages = useCallback((option: string) => setDealStages(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<LenderThesis> = {
      typeOfFinancing: types,
      financingProducts: products,
      dealStagePreference: dealStages,
      sbaStatus,
      typicalLoanSizeMin: loanMin.trim(),
      typicalLoanSizeMax: loanMax.trim(),
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
      icon={<Building2 size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Financing Overview"
      description="What you offer and how you lend"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Type of financing">
        <ThesisPillRow options={FINANCING_TYPES} selected={types} onToggle={toggleTypes} />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Select all that apply</Text>
      </ThesisField>

      <ThesisField label="Financing products offered">
        <ThesisPillRow options={FINANCING_PRODUCTS} selected={products} onToggle={toggleProducts} />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Select all that apply</Text>
      </ThesisField>

      <ThesisField label="Deal stage preference">
        <ThesisPillRow options={DEAL_STAGE_OPTIONS} selected={dealStages} onToggle={toggleDealStages} />
      </ThesisField>

      <ThesisField label="SBA-backed financing">
        <ThesisDropdown options={SBA_OPTIONS} value={sbaStatus} onChange={setSbaStatus} placeholder="Select SBA status" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Do you offer SBA-guaranteed loans?</Text>
      </ThesisField>

      <ThesisField label="Typical loan size">
        <ThesisRangeInput minValue={loanMin} maxValue={loanMax} onMinChange={setLoanMin} onMaxChange={setLoanMax} minPlaceholder="500,000" maxPlaceholder="5,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Per transaction, in USD</Text>
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 10.5, marginTop: 6 },
});
