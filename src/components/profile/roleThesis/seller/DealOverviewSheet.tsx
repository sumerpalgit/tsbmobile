import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AlignLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisRangeInput } from '../ThesisRangeInput';
import { ThesisField } from '../ThesisField';
import { updateBusinessOwnerThesis, BusinessOwnerThesis } from '../../../../api/roleThesis';

const OWNERSHIP_STAKE_OPTIONS = ['100%', 'Majority >50%', 'Minority <50%', 'Flexible'];
const PREFERRED_BUYER_TYPE_OPTIONS = ['Searcher', 'PE Fund', 'Family Office', 'Strategic', 'Individual', 'Any'];
const OPERATOR_INVOLVEMENT_OPTIONS = ['Owner-operated', 'Absentee', 'Semi-absentee', 'Management team in place'];

/** "Deal Overview" edit sheet — matches web's real Card 3 (`IntermediaryThesisTab.tsx:671-766`). */
export function DealOverviewSheet({
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
  const [valuationMin, setValuationMin] = useState('');
  const [valuationMax, setValuationMax] = useState('');
  const [ownershipStake, setOwnershipStake] = useState('');
  const [preferredBuyerType, setPreferredBuyerType] = useState<string[]>([]);
  const [operatorInvolvement, setOperatorInvolvement] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setValuationMin(thesis.valuationMin);
    setValuationMax(thesis.valuationMax);
    setOwnershipStake(thesis.ownershipStake);
    setPreferredBuyerType(thesis.preferredBuyerType);
    setOperatorInvolvement(thesis.operatorInvolvement);
  }, [visible, thesis]);

  const toggleBuyerType = useCallback((option: string) => setPreferredBuyerType(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<BusinessOwnerThesis> = {
      valuationMin,
      valuationMax,
      ownershipStake,
      preferredBuyerType,
      operatorInvolvement,
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
      icon={<AlignLeft size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Deal overview"
      description="What you are looking for from a transaction"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Valuation Expectation">
        <ThesisRangeInput minValue={valuationMin} maxValue={valuationMax} onMinChange={setValuationMin} onMaxChange={setValuationMax} minPlaceholder="3,000,000" maxPlaceholder="7,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Broad range preferred — exact price shared with matched buyers only</Text>
      </ThesisField>

      <ThesisField label="Ownership Stake Available">
        <ThesisPillRow options={OWNERSHIP_STAKE_OPTIONS} selected={ownershipStake ? [ownershipStake] : []} onToggle={setOwnershipStake} />
      </ThesisField>

      <ThesisField label="Preferred Buyer / Investor Type">
        <ThesisPillRow options={PREFERRED_BUYER_TYPE_OPTIONS} selected={preferredBuyerType} onToggle={toggleBuyerType} />
      </ThesisField>

      <ThesisField label="Operator Involvement Preference">
        <ThesisPillRow options={OPERATOR_INVOLVEMENT_OPTIONS} selected={operatorInvolvement ? [operatorInvolvement] : []} onToggle={setOperatorInvolvement} />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 10.5, marginTop: 6 },
});
