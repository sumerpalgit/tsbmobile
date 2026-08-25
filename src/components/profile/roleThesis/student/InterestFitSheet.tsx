import React, { useCallback, useEffect, useState } from 'react';
import { Circle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisSearchableChips } from '../ThesisSearchableChips';
import { ThesisField } from '../ThesisField';
import { updateStudentThesis, StudentThesis } from '../../../../api/roleThesis';
import { getIndustriesGrouped, getGeographiesGrouped } from '../../../../api/lookup';

/** "Interest & Fit" edit sheet — matches web's real Card 5 (`StudentThesisTab.tsx:620-718`).
 * `avoidedIndustries` is editable here but genuinely never shown in read mode (confirmed from web's
 * own source — no display block for it anywhere in the card's read-mode JSX). Web's own footer CTA
 * here is unconditional (no `{!hasData &&}` guard) — see the main tab's `alwaysShowCta` usage. */
export function InterestFitSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: StudentThesis;
  onClose: () => void;
  onSaved: (patch: Partial<StudentThesis>) => void;
}) {
  const { colors } = useTheme();
  const [industryFocus, setIndustryFocus] = useState<string[]>([]);
  const [avoidedIndustries, setAvoidedIndustries] = useState<string[]>([]);
  const [geographyFocus, setGeographyFocus] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [geoOptions, setGeoOptions] = useState<string[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setIndustryFocus(thesis.industryFocus);
    setAvoidedIndustries(thesis.avoidedIndustries);
    setGeographyFocus(thesis.geographyFocus);
    setOptionsLoading(true);
    Promise.all([getIndustriesGrouped(), getGeographiesGrouped()])
      .then(([industryGrouped, geoGrouped]) => {
        setIndustryOptions(Object.values(industryGrouped).flat());
        setGeoOptions(Object.values(geoGrouped).flat());
      })
      .finally(() => setOptionsLoading(false));
  }, [visible, thesis]);

  const toggleIndustry = useCallback((option: string) => setIndustryFocus(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleAvoided = useCallback((option: string) => setAvoidedIndustries(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleGeography = useCallback((option: string) => setGeographyFocus(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<StudentThesis> = { industryFocus, avoidedIndustries, geographyFocus };
    try {
      await updateStudentThesis(patch);
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
      icon={<Circle size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Interest & fit"
      description="Industries and geographies"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Industry Focus">
        <ThesisSearchableChips
          selected={industryFocus}
          onToggle={toggleIndustry}
          options={optionsLoading ? [] : industryOptions}
          placeholder="Search and select industries"
        />
      </ThesisField>

      <ThesisField label="Avoided Industries">
        <ThesisSearchableChips
          selected={avoidedIndustries}
          onToggle={toggleAvoided}
          options={optionsLoading ? [] : industryOptions}
          placeholder="Search industries to avoid"
          tone="danger"
        />
      </ThesisField>

      <ThesisField label="Geography Focus">
        <ThesisSearchableChips
          selected={geographyFocus}
          onToggle={toggleGeography}
          options={optionsLoading ? [] : geoOptions}
          placeholder="Search and select regions"
        />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}
