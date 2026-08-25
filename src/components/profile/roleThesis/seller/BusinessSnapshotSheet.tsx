import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { BarChart2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisRangeInput } from '../ThesisRangeInput';
import { ThesisField } from '../ThesisField';
import { updateBusinessOwnerThesis, BusinessOwnerThesis } from '../../../../api/roleThesis';
import { PrivacyNote } from './PrivacyNote';

const YEARS_IN_OPERATION_OPTIONS = ['< 2 yrs', '2–5 yrs', '5–10 yrs', '10–20 yrs', '20+ yrs'];

/** "Business Snapshot" edit sheet — matches web's real Card 2 (`IntermediaryThesisTab.tsx:543-668`,
 * the file that actually renders for `role_type === 'seller'`). */
export function BusinessSnapshotSheet({
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
  const [businessIndustry, setBusinessIndustry] = useState('');
  const [businessModel, setBusinessModel] = useState('');
  const [businessLocation, setBusinessLocation] = useState('');
  const [yearsInOperation, setYearsInOperation] = useState('');
  const [businessRevenueMin, setBusinessRevenueMin] = useState('');
  const [businessRevenueMax, setBusinessRevenueMax] = useState('');
  const [businessEbitdaMin, setBusinessEbitdaMin] = useState('');
  const [businessEbitdaMax, setBusinessEbitdaMax] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setBusinessIndustry(thesis.businessIndustry);
    setBusinessModel(thesis.businessModel);
    setBusinessLocation(thesis.businessLocation);
    setYearsInOperation(thesis.yearsInOperation);
    setBusinessRevenueMin(thesis.businessRevenueMin);
    setBusinessRevenueMax(thesis.businessRevenueMax);
    setBusinessEbitdaMin(thesis.businessEbitdaMin);
    setBusinessEbitdaMax(thesis.businessEbitdaMax);
  }, [visible, thesis]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<BusinessOwnerThesis> = {
      businessIndustry: businessIndustry.trim(),
      businessModel: businessModel.trim(),
      businessLocation: businessLocation.trim(),
      yearsInOperation,
      businessRevenueMin,
      businessRevenueMax,
      businessEbitdaMin,
      businessEbitdaMax,
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
      icon={<BarChart2 size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Business snapshot"
      description="High-level overview of your business — kept confidential"
      saving={saving}
      onSave={handleSave}
    >
      <PrivacyNote>
        Financial details and location are only shown to verified buyers who have been matched and accepted your connection. Broad ranges are fine here.
      </PrivacyNote>

      <View style={styles.row}>
        <View style={styles.col}>
          <ThesisField label="Business Industry">
            <TextInput
              underlineColorAndroid="transparent"
              value={businessIndustry}
              onChangeText={setBusinessIndustry}
              placeholder="e.g. Home Services"
              placeholderTextColor={colors.ink3}
              style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
            />
          </ThesisField>
        </View>
        <View style={styles.col}>
          <ThesisField label="Business Model">
            <TextInput
              underlineColorAndroid="transparent"
              value={businessModel}
              onChangeText={setBusinessModel}
              placeholder="e.g. Services, SaaS, Product"
              placeholderTextColor={colors.ink3}
              style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
            />
          </ThesisField>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <ThesisField label="Location (General Area)">
            <TextInput
              underlineColorAndroid="transparent"
              value={businessLocation}
              onChangeText={setBusinessLocation}
              placeholder="e.g. Southwest US — Arizona"
              placeholderTextColor={colors.ink3}
              style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
            />
            <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>State / region only — no specific address required</Text>
          </ThesisField>
        </View>
        <View style={styles.col}>
          <ThesisField label="Years in Operation">
            <ThesisPillRow options={YEARS_IN_OPERATION_OPTIONS} selected={yearsInOperation ? [yearsInOperation] : []} onToggle={setYearsInOperation} />
          </ThesisField>
        </View>
      </View>

      <ThesisField label="Revenue (Approximate Range)">
        <ThesisRangeInput minValue={businessRevenueMin} maxValue={businessRevenueMax} onMinChange={setBusinessRevenueMin} onMaxChange={setBusinessRevenueMax} minPlaceholder="2,000,000" maxPlaceholder="6,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Annual revenue, USD — broad range is fine</Text>
      </ThesisField>

      <ThesisField label="EBITDA (Approximate Range)">
        <ThesisRangeInput minValue={businessEbitdaMin} maxValue={businessEbitdaMax} onMinChange={setBusinessEbitdaMin} onMaxChange={setBusinessEbitdaMax} minPlaceholder="500,000" maxPlaceholder="1,500,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Normalised EBITDA, USD</Text>
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
  hint: { fontSize: 10.5, marginTop: 6 },
  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1, minWidth: 0 },
});
