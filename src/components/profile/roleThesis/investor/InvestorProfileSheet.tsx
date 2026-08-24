import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { User } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisDropdown } from '../ThesisDropdown';
import { ThesisField } from '../ThesisField';
import { updateInvestorThesis, InvestorThesis } from '../../../../api/roleThesis';

const FIRM_TYPES = ['Family Office', 'Angel Investor', 'Investment Groups', 'Private Equity Firm', 'Venture Capital Firm', 'Search Fund Investor', 'Corporate Investor', 'Other (please specify)'];

/** "Investor Profile" edit sheet — matches web's real `InvestorProfileCard` field set
 * (`InvestmentThesisTab.tsx:141-253`): Investor Type is a `<select>` dropdown on web (built as
 * `ThesisDropdown` here, matching this tab's own established dropdown-not-pills convention for
 * genuine `<select>` fields), Investment Firm Name, Website, Years of Investment Experience — all
 * optional, no required fields on this card at all. Persists `educationalInstitution` (web's real,
 * misnamed wire field for "Investor Type" — see `InvestorThesis`'s own doc comment), plus
 * `organizationName`/`organizationWebsite`/`yearsOfInvestmentExperience`. */
export function InvestorProfileSheet({
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
  const [firmType, setFirmType] = useState('');
  const [firmName, setFirmName] = useState('');
  const [website, setWebsite] = useState('');
  const [experience, setExperience] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFirmType(thesis.educationalInstitution);
    setFirmName(thesis.organizationName);
    setWebsite(thesis.organizationWebsite);
    setExperience(thesis.yearsOfInvestmentExperience);
  }, [visible, thesis]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<InvestorThesis> = {
      educationalInstitution: firmType,
      organizationName: firmName.trim(),
      organizationWebsite: website.trim(),
      yearsOfInvestmentExperience: experience.trim(),
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
      icon={<User size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Investor Profile"
      description="Your core identity on the platform"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Investor type">
        <ThesisDropdown options={FIRM_TYPES} value={firmType} onChange={setFirmType} placeholder="Select investor type" />
      </ThesisField>

      <ThesisField label="Investment firm name">
        <View style={[styles.inputBox, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
          <TextInput
            value={firmName}
            onChangeText={setFirmName}
            placeholder="e.g. Mercer Capital Partners"
            placeholderTextColor={colors.ink3}
            underlineColorAndroid="transparent"
            style={[styles.input, { color: colors.ink }]}
          />
        </View>
      </ThesisField>

      <ThesisField label="Website">
        <View style={[styles.inputBox, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
          <TextInput
            value={website}
            onChangeText={setWebsite}
            placeholder="https://mercercapital.com"
            placeholderTextColor={colors.ink3}
            autoCapitalize="none"
            keyboardType="url"
            underlineColorAndroid="transparent"
            style={[styles.input, { color: colors.ink }]}
          />
        </View>
      </ThesisField>

      <ThesisField label="Years of investment experience">
        <View style={[styles.inputBox, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
          <TextInput
            value={experience}
            onChangeText={setExperience}
            placeholder="e.g. 14"
            placeholderTextColor={colors.ink3}
            underlineColorAndroid="transparent"
            style={[styles.input, { color: colors.ink }]}
          />
        </View>
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  inputBox: {
    height: 44,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
  },
  input: {
    padding: 0,
    fontSize: 13,
  },
});
