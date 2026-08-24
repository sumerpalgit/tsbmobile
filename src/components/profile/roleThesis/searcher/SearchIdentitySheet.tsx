import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { User } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisDropdown } from '../ThesisDropdown';
import { ThesisField } from '../ThesisField';
import { updateSearcherThesis, SearcherThesis } from '../../../../api/roleThesis';

const SEARCH_TYPES = ['Self Funded Searcher', 'Traditional Searcher', 'Prospective Searcher', 'Independent Sponsor'];
const EXPERIENCE_RANGES = ['< 2 years', '2-5 years', '5-10 years', '10+ years'];

/** "Search Identity" edit sheet — matches web's real `SearchIdentityCard` field set
 * (`SearcherThesisTab.tsx:84-210`): Search Type (`<select>` on web, built as `ThesisPillRow` here
 * matching this tab's own established single-select house style), Search Fund Name/Website,
 * Incorporation Year, Years of Experience. Persists `searchType`/`searchFirmName`/
 * `searchFirmWebsite`/`incorporatedYear`/`yearsOfExperience`. */
export function SearchIdentitySheet({
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
  const { colors } = useTheme();
  const [searchType, setSearchType] = useState('');
  const [firmName, setFirmName] = useState('');
  const [firmWebsite, setFirmWebsite] = useState('');
  const [incorporatedYear, setIncorporatedYear] = useState('');
  const [experience, setExperience] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSearchType(thesis.searchType);
    setFirmName(thesis.searchFirmName);
    setFirmWebsite(thesis.searchFirmWebsite);
    setIncorporatedYear(thesis.incorporatedYear);
    setExperience(thesis.yearsOfExperience);
  }, [visible, thesis]);

  const valid = !!searchType && !!firmName.trim();

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const patch: Partial<SearcherThesis> = {
      searchType,
      searchFirmName: firmName.trim(),
      searchFirmWebsite: firmWebsite.trim(),
      incorporatedYear: incorporatedYear.trim(),
      yearsOfExperience: experience,
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
      icon={<User size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Search Identity"
      description="Your role and focus"
      saving={saving}
      onSave={handleSave}
      saveDisabled={!valid}
    >
      <ThesisField label="Search type" required>
        <ThesisDropdown options={SEARCH_TYPES} value={searchType} onChange={setSearchType} placeholder="Select search type" />
      </ThesisField>

      <ThesisField label="Search fund name" required>
        <TextInput
          value={firmName}
          onChangeText={setFirmName}
          placeholder="Carter Acquisition Partners"
          placeholderTextColor={colors.ink3}
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <ThesisField label="Search fund website">
        <TextInput
          value={firmWebsite}
          onChangeText={setFirmWebsite}
          placeholder="https://carteracquisition.com"
          placeholderTextColor={colors.ink3}
          autoCapitalize="none"
          keyboardType="url"
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <ThesisField label="Incorporation year">
        <TextInput
          value={incorporatedYear}
          onChangeText={setIncorporatedYear}
          placeholder="e.g. 2024"
          placeholderTextColor={colors.ink3}
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <ThesisField label="Years of experience">
        <ThesisPillRow options={EXPERIENCE_RANGES} selected={experience ? [experience] : []} onToggle={setExperience} />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
});
