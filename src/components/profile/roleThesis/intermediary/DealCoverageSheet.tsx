import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { Target } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisSearchableChips } from '../ThesisSearchableChips';
import { ThesisRangeInput } from '../ThesisRangeInput';
import { ThesisField } from '../ThesisField';
import { updateIntermediaryThesis, IntermediaryThesis } from '../../../../api/roleThesis';
import { getIndustriesGrouped, getGeographiesGrouped } from '../../../../api/lookup';

/** "Deal coverage & fit" edit sheet — matches the mockup's Deal Coverage & Fit sheet exactly
 * (decoded `profilelast_decoded_role.html:3133-3224`): 3 searchable multi-select groups + 3
 * $min–$max ranges + a description textarea. Industry/Geography option lists come from the same
 * real lookups Onboarding Step 4 already uses (`getIndustriesGrouped`/`getGeographiesGrouped`,
 * `src/api/lookup.ts`), flattened — the mockup's own grouped-by-category UX isn't replicated
 * (its Deal Coverage sheet itself uses a flat chip wall, not grouped sections, unlike Step 4's
 * `SearchableMultiSelect`). Persists `businessIndustries`/`avoidedIndustries`/`businessLocation`/
 * `annualRevenueMin(Max)`/`annualEbitdaMin(Max)`/`askingPriceMin(Max)`/`businessOverview`, matching
 * web's real `SellerData` field names. */
export function DealCoverageSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: IntermediaryThesis;
  onClose: () => void;
  onSaved: (patch: Partial<IntermediaryThesis>) => void;
}) {
  const { colors, fonts } = useTheme();
  const [industries, setIndustries] = useState<string[]>([]);
  const [avoided, setAvoided] = useState<string[]>([]);
  const [geos, setGeos] = useState<string[]>([]);
  const [revMin, setRevMin] = useState('');
  const [revMax, setRevMax] = useState('');
  const [ebitdaMin, setEbitdaMin] = useState('');
  const [ebitdaMax, setEbitdaMax] = useState('');
  const [dealMin, setDealMin] = useState('');
  const [dealMax, setDealMax] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [geoOptions, setGeoOptions] = useState<string[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setIndustries(thesis.businessIndustries);
    setAvoided(thesis.avoidedIndustries);
    setGeos(thesis.businessLocation);
    setRevMin(thesis.annualRevenueMin);
    setRevMax(thesis.annualRevenueMax);
    setEbitdaMin(thesis.annualEbitdaMin);
    setEbitdaMax(thesis.annualEbitdaMax);
    setDealMin(thesis.askingPriceMin);
    setDealMax(thesis.askingPriceMax);
    setDescription(thesis.businessOverview);
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

  const valid = industries.length > 0 && geos.length > 0;

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const patch: Partial<IntermediaryThesis> = {
      businessIndustries: industries,
      avoidedIndustries: avoided,
      businessLocation: geos,
      annualRevenueMin: revMin.trim(),
      annualRevenueMax: revMax.trim(),
      annualEbitdaMin: ebitdaMin.trim(),
      annualEbitdaMax: ebitdaMax.trim(),
      askingPriceMin: dealMin.trim(),
      askingPriceMax: dealMax.trim(),
      businessOverview: description.trim(),
    };
    try {
      await updateIntermediaryThesis(patch);
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
      title="Deal coverage & fit"
      description="Industries, geographies and deal parameters"
      saving={saving}
      onSave={handleSave}
      saveDisabled={!valid}
    >
      <ThesisField label="Industry focus" required>
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
          placeholder="Search avoided industries…"
          tone="danger"
        />
      </ThesisField>

      <ThesisField label="Geography focus" required>
        <ThesisSearchableChips
          selected={geos}
          onToggle={o => toggle(geos, setGeos, o)}
          options={optionsLoading ? [] : geoOptions}
          placeholder="Search regions…"
        />
      </ThesisField>

      <ThesisField label="Business preferred revenue">
        <ThesisRangeInput minValue={revMin} maxValue={revMax} onMinChange={setRevMin} onMaxChange={setRevMax} minPlaceholder="500,000" maxPlaceholder="30,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Annual revenue, USD</Text>
      </ThesisField>

      <ThesisField label="Business preferred EBITDA">
        <ThesisRangeInput minValue={ebitdaMin} maxValue={ebitdaMax} onMinChange={setEbitdaMin} onMaxChange={setEbitdaMax} minPlaceholder="100,000" maxPlaceholder="3,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Normalised EBITDA, USD</Text>
      </ThesisField>

      <ThesisField label="Typical deal size">
        <ThesisRangeInput minValue={dealMin} maxValue={dealMax} onMinChange={setDealMin} onMaxChange={setDealMax} minPlaceholder="1,000,000" maxPlaceholder="25,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Enterprise value, USD</Text>
      </ThesisField>

      <ThesisField label="Business description">
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Briefly describe your business — what it does, how long it has operated, and any key differentiators."
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
  hint: { fontSize: 10.5, marginTop: 6 },
  textarea: { height: 90, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 12.5, lineHeight: 18 },
});
