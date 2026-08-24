import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Target } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisSearchableChips } from '../ThesisSearchableChips';
import { ThesisRangeInput } from '../ThesisRangeInput';
import { ThesisField } from '../ThesisField';
import { updateAdvisorThesis, AdvisorThesis } from '../../../../api/roleThesis';
import { getIndustriesGrouped, getGeographiesGrouped } from '../../../../api/lookup';

/** "Coverage & Deal Fit" edit sheet — matches web's real `CoverageDealFitCard`
 * (`AdvisorThesisTab.tsx`, Card 3). */
export function CoverageDealFitSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: AdvisorThesis;
  onClose: () => void;
  onSaved: (patch: Partial<AdvisorThesis>) => void;
}) {
  const { colors, fonts } = useTheme();
  const [industries, setIndustries] = useState<string[]>([]);
  const [geographies, setGeographies] = useState<string[]>([]);
  const [dealSizeMin, setDealSizeMin] = useState('');
  const [dealSizeMax, setDealSizeMax] = useState('');
  const [saving, setSaving] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [geoOptions, setGeoOptions] = useState<string[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setIndustries(thesis.primaryIndustries);
    setGeographies(thesis.geographies);
    setDealSizeMin(thesis.dealSizeMin);
    setDealSizeMax(thesis.dealSizeMax);
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
    const patch: Partial<AdvisorThesis> = {
      primaryIndustries: industries,
      geographies,
      dealSizeMin: dealSizeMin.trim(),
      dealSizeMax: dealSizeMax.trim(),
    };
    try {
      await updateAdvisorThesis(patch);
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
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Coverage & Deal Fit"
      description="Industries, geographies and deal size you cover"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Industry focus">
        <ThesisSearchableChips
          selected={industries}
          onToggle={toggleIndustries}
          options={optionsLoading ? [] : industryOptions}
          placeholder="Search and select industries"
        />
      </ThesisField>

      <ThesisField label="Geography focus">
        <ThesisSearchableChips
          selected={geographies}
          onToggle={toggleGeographies}
          options={optionsLoading ? [] : geoOptions}
          placeholder="Search and select regions"
        />
      </ThesisField>

      <ThesisField label="Deal size range">
        <ThesisRangeInput minValue={dealSizeMin} maxValue={dealSizeMax} onMinChange={setDealSizeMin} onMaxChange={setDealSizeMax} minPlaceholder="2,000,000" maxPlaceholder="50,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Enterprise value, in USD</Text>
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 10.5, marginTop: 6 },
});
