import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateBusinessOwnerThesis, BusinessOwnerThesis } from '../../../../api/roleThesis';

const DAY_TO_DAY_OPTIONS = ['Full-time', 'Part-time', 'Minimal', 'None'];
const ADVISOR_SUPPORT_OPTIONS = ['Has advisor', 'Seeking advisor', 'No advisor needed'];
const POST_TRANSACTION_OPTIONS = ['Willing to stay 3–6mo', '6–12mo', '12mo+', 'No involvement', 'Flexible'];

/** "Operations & Transition" edit sheet — matches web's real Card 4
 * (`IntermediaryThesisTab.tsx:769-874`). */
export function OperationsTransitionSheet({
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
  const { colors } = useTheme();
  const [currentRole, setCurrentRole] = useState('');
  const [dayToDayInvolvement, setDayToDayInvolvement] = useState('');
  const [managementTeam, setManagementTeam] = useState('');
  const [advisorSupport, setAdvisorSupport] = useState('');
  const [postTransactionInvolvement, setPostTransactionInvolvement] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCurrentRole(thesis.currentRole);
    setDayToDayInvolvement(thesis.dayToDayInvolvement);
    setManagementTeam(thesis.managementTeam);
    setAdvisorSupport(thesis.advisorSupport);
    setPostTransactionInvolvement(thesis.postTransactionInvolvement);
  }, [visible, thesis]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<BusinessOwnerThesis> = {
      currentRole: currentRole.trim(),
      dayToDayInvolvement,
      managementTeam: managementTeam.trim(),
      advisorSupport,
      postTransactionInvolvement,
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
      icon={<Plus size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Operations & transition"
      description="Current role and post-transaction plans"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Your Current Role">
        <TextInput
          underlineColorAndroid="transparent"
          value={currentRole}
          onChangeText={setCurrentRole}
          placeholder="e.g. Owner & operator (hands-on)"
          placeholderTextColor={colors.ink3}
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <ThesisField label="Day-to-Day Involvement">
        <ThesisPillRow options={DAY_TO_DAY_OPTIONS} selected={dayToDayInvolvement ? [dayToDayInvolvement] : []} onToggle={setDayToDayInvolvement} />
      </ThesisField>

      <ThesisField label="Management Team">
        <TextInput
          underlineColorAndroid="transparent"
          value={managementTeam}
          onChangeText={setManagementTeam}
          placeholder="Describe your management team and their ability to operate independently..."
          placeholderTextColor={colors.ink3}
          multiline
          textAlignVertical="top"
          style={[styles.textarea, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <View style={styles.row}>
        <View style={styles.col}>
          <ThesisField label="Advisor Support">
            <ThesisPillRow options={ADVISOR_SUPPORT_OPTIONS} selected={advisorSupport ? [advisorSupport] : []} onToggle={setAdvisorSupport} />
          </ThesisField>
        </View>
        <View style={styles.col}>
          <ThesisField label="Post-Transaction Involvement">
            <ThesisPillRow options={POST_TRANSACTION_OPTIONS} selected={postTransactionInvolvement ? [postTransactionInvolvement] : []} onToggle={setPostTransactionInvolvement} />
          </ThesisField>
        </View>
      </View>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
  textarea: { height: 90, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 12.5, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1, minWidth: 0 },
});
