import React, { useEffect, useState } from 'react';
import { Briefcase } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisRangeInput } from '../ThesisRangeInput';
import { ThesisField } from '../ThesisField';
import { updateInvestorThesis, InvestorThesis } from '../../../../api/roleThesis';

/** "Deal Criteria" edit sheet — matches web's real `DealCriteriaCard`
 * (`InvestmentThesisTab.tsx:415-533`): 4 `RangeInput` fields, none required. */
export function DealCriteriaSheet({
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
  const { colors } = useTheme();
  const [equityMin, setEquityMin] = useState('');
  const [equityMax, setEquityMax] = useState('');
  const [evMin, setEvMin] = useState('');
  const [evMax, setEvMax] = useState('');
  const [revMin, setRevMin] = useState('');
  const [revMax, setRevMax] = useState('');
  const [ebitdaMin, setEbitdaMin] = useState('');
  const [ebitdaMax, setEbitdaMax] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setEquityMin(thesis.minEquity);
    setEquityMax(thesis.maxEquity);
    setEvMin(thesis.minEV);
    setEvMax(thesis.maxEV);
    setRevMin(thesis.minRevenue);
    setRevMax(thesis.maxRevenue);
    setEbitdaMin(thesis.minEBITDA);
    setEbitdaMax(thesis.maxEBITDA);
  }, [visible, thesis]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<InvestorThesis> = {
      minEquity: equityMin.trim(),
      maxEquity: equityMax.trim(),
      minEV: evMin.trim(),
      maxEV: evMax.trim(),
      minRevenue: revMin.trim(),
      maxRevenue: revMax.trim(),
      minEBITDA: ebitdaMin.trim(),
      maxEBITDA: ebitdaMax.trim(),
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
      icon={<Briefcase size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Deal Criteria"
      description="Target transaction parameters"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Investment ticket size">
        <ThesisRangeInput minValue={equityMin} maxValue={equityMax} onMinChange={setEquityMin} onMaxChange={setEquityMax} minPlaceholder="2,000,000" maxPlaceholder="8,000,000" />
      </ThesisField>

      <ThesisField label="Preferred deal size">
        <ThesisRangeInput minValue={evMin} maxValue={evMax} onMinChange={setEvMin} onMaxChange={setEvMax} minPlaceholder="5,000,000" maxPlaceholder="25,000,000" />
      </ThesisField>

      <ThesisField label="Business preferred revenue">
        <ThesisRangeInput minValue={revMin} maxValue={revMax} onMinChange={setRevMin} onMaxChange={setRevMax} minPlaceholder="3,000,000" maxPlaceholder="20,000,000" />
      </ThesisField>

      <ThesisField label="Business preferred EBITDA">
        <ThesisRangeInput minValue={ebitdaMin} maxValue={ebitdaMax} onMinChange={setEbitdaMin} onMaxChange={setEbitdaMax} minPlaceholder="750,000" maxPlaceholder="4,000,000" />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}
