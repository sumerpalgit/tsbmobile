import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Star } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisSearchableChips } from '../ThesisSearchableChips';
import { ThesisField } from '../ThesisField';
import { updateInvestorThesis, InvestorThesis } from '../../../../api/roleThesis';
import { getIndustriesGrouped, getGeographiesGrouped } from '../../../../api/lookup';

const INVESTMENT_STAGES = ['Search capital (Back a Searcher)', 'Acquisition equity', 'Growth capital', 'Buyouts', 'Minority investments', 'Other (please specify)'];
const INVESTMENT_PREFERENCES = ['Majority', 'Significant minority', 'Minority', 'Flexible / deal-dependent'];
const PARTICIPATION_STYLES = ['Board seat', 'Active ops', 'Observer', 'Passive', 'Advisory only'];

/** "Investment Focus" edit sheet — matches web's real `InvestmentFocusCard`
 * (`InvestmentThesisTab.tsx:256-412`): Preferred Investment Stage (multi), Investment Preference
 * (single), Ownership Preference (plain text — free text despite the name, NOT a percent/pill
 * field), Participation Style (multi), then Industry Focus/Avoided Industries/Geography Focus as
 * searchable, search-gated multi-selects (same `ThesisSearchableChips` pattern as every other
 * role — web's own `AVOIDED_INDUSTRY_OPTIONS` fixed pill list and `AvoidedPills` import are
 * confirmed dead code; the real Avoided Industries field is a free `SearchableMultiSelect` sourced
 * from the same industries catalog as Industry Focus, replicated as such). */
export function InvestmentFocusSheet({
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
  const [stages, setStages] = useState<string[]>([]);
  const [preference, setPreference] = useState('');
  const [ownership, setOwnership] = useState('');
  const [participation, setParticipation] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [avoided, setAvoided] = useState<string[]>([]);
  const [geographies, setGeographies] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [geoOptions, setGeoOptions] = useState<string[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStages(thesis.investmentStage);
    setPreference(thesis.majorityPreference);
    setOwnership(thesis.ownershipPreference);
    setParticipation(thesis.participationStyle);
    setIndustries(thesis.industries);
    setAvoided(thesis.excludedIndustries);
    setGeographies(thesis.geographies);
    setOptionsLoading(true);
    Promise.all([getIndustriesGrouped(), getGeographiesGrouped()])
      .then(([industryGrouped, geoGrouped]) => {
        setIndustryOptions(Object.values(industryGrouped).flat());
        setGeoOptions(Object.values(geoGrouped).flat());
      })
      .finally(() => setOptionsLoading(false));
  }, [visible, thesis]);

  const toggle = (list: string[], setList: (v: string[]) => void, option: string) => {
    setList(list.includes(option) ? list.filter(o => o !== option) : [...list, option]);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<InvestorThesis> = {
      investmentStage: stages,
      majorityPreference: preference,
      ownershipPreference: ownership.trim(),
      participationStyle: participation,
      industries,
      excludedIndustries: avoided,
      geographies,
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
      icon={<Star size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Investment Focus"
      description="What you look for in a deal"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Preferred investment stage">
        <ThesisPillRow options={INVESTMENT_STAGES} selected={stages} onToggle={o => toggle(stages, setStages, o)} />
      </ThesisField>

      <ThesisField label="Investment preference">
        <ThesisPillRow options={INVESTMENT_PREFERENCES} selected={preference ? [preference] : []} onToggle={setPreference} />
      </ThesisField>

      <ThesisField label="Ownership preference">
        <TextInput
          value={ownership}
          onChangeText={setOwnership}
          placeholder="e.g. 51%+"
          placeholderTextColor={colors.ink3}
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <ThesisField label="Participation style">
        <ThesisPillRow options={PARTICIPATION_STYLES} selected={participation} onToggle={o => toggle(participation, setParticipation, o)} />
      </ThesisField>

      <ThesisField label="Industry focus">
        <ThesisSearchableChips
          selected={industries}
          onToggle={o => toggle(industries, setIndustries, o)}
          options={optionsLoading ? [] : industryOptions}
          placeholder="Search industries…"
        />
      </ThesisField>

      <ThesisField label="Avoided industries">
        <ThesisSearchableChips
          selected={avoided}
          onToggle={o => toggle(avoided, setAvoided, o)}
          options={optionsLoading ? [] : industryOptions}
          placeholder="Select industries you will not invest in"
          tone="danger"
        />
      </ThesisField>

      <ThesisField label="Geography focus">
        <ThesisSearchableChips
          selected={geographies}
          onToggle={o => toggle(geographies, setGeographies, o)}
          options={optionsLoading ? [] : geoOptions}
          placeholder="Search regions…"
        />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
});
