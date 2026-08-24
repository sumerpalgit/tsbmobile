import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { DollarSign } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisRangeInput } from '../ThesisRangeInput';
import { ThesisField } from '../ThesisField';
import { updateAdvisorThesis, AdvisorThesis } from '../../../../api/roleThesis';

/** "Commercials" edit sheet — matches web's real `CommercialsCard` (`AdvisorThesisTab.tsx`,
 * Card 4): 3 `$min–$max` range pairs, a single "$"-prefixed flat-fee input, and a 3-row textarea
 * note. */
export function CommercialsSheet({
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
  const [projMin, setProjMin] = useState('');
  const [projMax, setProjMax] = useState('');
  const [retMin, setRetMin] = useState('');
  const [retMax, setRetMax] = useState('');
  const [hrMin, setHrMin] = useState('');
  const [hrMax, setHrMax] = useState('');
  const [sfValue, setSfValue] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setProjMin(thesis.projectFeeMin);
    setProjMax(thesis.projectFeeMax);
    setRetMin(thesis.monthlyRetainerMin);
    setRetMax(thesis.monthlyRetainerMax);
    setHrMin(thesis.hourlyRateMin);
    setHrMax(thesis.hourlyRateMax);
    setSfValue(thesis.successDealFee);
    setNote(thesis.commercialsNote);
  }, [visible, thesis]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<AdvisorThesis> = {
      projectFeeMin: projMin.trim(),
      projectFeeMax: projMax.trim(),
      monthlyRetainerMin: retMin.trim(),
      monthlyRetainerMax: retMax.trim(),
      hourlyRateMin: hrMin.trim(),
      hourlyRateMax: hrMax.trim(),
      successDealFee: sfValue.trim(),
      commercialsNote: note.trim(),
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
      icon={<DollarSign size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Commercials"
      description="Your fee structure and pricing"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Project fee">
        <ThesisRangeInput minValue={projMin} maxValue={projMax} onMinChange={setProjMin} onMaxChange={setProjMax} minPlaceholder="5,000" maxPlaceholder="50,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>One-off project fee, in USD</Text>
      </ThesisField>

      <ThesisField label="Monthly retainer">
        <ThesisRangeInput minValue={retMin} maxValue={retMax} onMinChange={setRetMin} onMaxChange={setRetMax} minPlaceholder="1,000" maxPlaceholder="5,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Monthly retainer, in USD</Text>
      </ThesisField>

      <ThesisField label="Hourly rate">
        <ThesisRangeInput minValue={hrMin} maxValue={hrMax} onMinChange={setHrMin} onMaxChange={setHrMax} minPlaceholder="150" maxPlaceholder="500" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Hourly rate, in USD</Text>
      </ThesisField>

      <ThesisField label="Success / deal fee">
        <View style={[styles.dollarBox, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
          <Text style={[styles.dollar, { color: colors.ink3 }]}>$</Text>
          <TextInput
            value={sfValue}
            onChangeText={setSfValue}
            placeholder="e.g. 10,000"
            placeholderTextColor={colors.ink3}
            keyboardType="number-pad"
            style={[styles.dollarInput, { color: colors.ink }]}
          />
        </View>
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Flat deal success fee, in USD</Text>
      </ThesisField>

      <ThesisField label="Additional note">
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Any additional notes about your pricing..."
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
  dollarBox: { flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12 },
  dollar: { fontSize: 13, marginRight: 4 },
  dollarInput: { flex: 1, minWidth: 0, fontSize: 13, padding: 0 },
  textarea: { height: 76, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 12.5, lineHeight: 18 },
  hint: { fontSize: 10.5, marginTop: 6 },
});
