import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Target } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisSearchableChips } from '../ThesisSearchableChips';
import { ThesisRangeInput } from '../ThesisRangeInput';
import { ThesisField } from '../ThesisField';
import { updateOperatorThesis, OperatorThesis } from '../../../../api/roleThesis';
import { getIndustriesGrouped, getGeographiesGrouped } from '../../../../api/lookup';

/** "Deal & Company Fit" edit sheet — matches web's real Card 4 (`OperatorThesisTab.tsx`). */
export function DealCompanyFitSheet({
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
  const [industries, setIndustries] = useState<string[]>([]);
  const [geographies, setGeographies] = useState<string[]>([]);
  const [revenueMin, setRevenueMin] = useState('');
  const [revenueMax, setRevenueMax] = useState('');
  const [employeeMin, setEmployeeMin] = useState('');
  const [employeeMax, setEmployeeMax] = useState('');
  const [saving, setSaving] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [geoOptions, setGeoOptions] = useState<string[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setIndustries(thesis.industryInterests);
    setGeographies(thesis.geographyFocus);
    setRevenueMin(thesis.revenueRangeMin);
    setRevenueMax(thesis.revenueRangeMax);
    setEmployeeMin(thesis.employeeCountMin);
    setEmployeeMax(thesis.employeeCountMax);
    setOptionsLoading(true);
    Promise.all([getIndustriesGrouped(), getGeographiesGrouped()])
      .then(([industryGrouped, geoGrouped]) => {
        setIndustryOptions(Object.values(industryGrouped).flat());
        setGeoOptions(Object.values(geoGrouped).flat());
      })
      .finally(() => setOptionsLoading(false));
  }, [visible, thesis]);

  const toggleIndustries = useCallback((option: string) => setIndustries(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleGeographies = useCallback((option: string) => setGeographies(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<OperatorThesis> = {
      industryInterests: industries,
      geographyFocus: geographies,
      revenueRangeMin: revenueMin.trim(),
      revenueRangeMax: revenueMax.trim(),
      employeeCountMin: employeeMin.trim(),
      employeeCountMax: employeeMax.trim(),
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
      icon={<Target size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Deal & company fit"
      description="Industries, geographies and company profiles you target"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Industry Focus">
        <ThesisSearchableChips
          selected={industries}
          onToggle={toggleIndustries}
          options={optionsLoading ? [] : industryOptions}
          placeholder="Search and select industries"
        />
      </ThesisField>

      <ThesisField label="Geography Focus">
        <ThesisSearchableChips
          selected={geographies}
          onToggle={toggleGeographies}
          options={optionsLoading ? [] : geoOptions}
          placeholder="Search and select regions"
        />
      </ThesisField>

      <ThesisField label="Revenue Range">
        <ThesisRangeInput minValue={revenueMin} maxValue={revenueMax} onMinChange={setRevenueMin} onMaxChange={setRevenueMax} minPlaceholder="2,000,000" maxPlaceholder="50,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Annual, USD</Text>
      </ThesisField>

      <ThesisField label="Employee Count">
        <ThesisRangeInput minValue={employeeMin} maxValue={employeeMax} onMinChange={setEmployeeMin} onMaxChange={setEmployeeMax} minPlaceholder="10" maxPlaceholder="200" prefix="" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Number of employees</Text>
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 10.5, marginTop: 6 },
});
