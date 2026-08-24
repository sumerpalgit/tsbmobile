import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { User } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateIntermediaryThesis, IntermediaryThesis } from '../../../../api/roleThesis';

const STRUCTURES = ['Sole Proprietorship', 'Partnership', 'LLC / LLP', 'S-Corp / C-Corp', 'Family Business', 'Trust-held', 'Other'];
const ROLES = ['Founder / Owner', 'CEO', 'Co-Founder', 'President / MD', 'Partner', 'Family Successor', 'Investor-Operator', 'Other'];

/** "Seller profile" edit sheet — matches the mockup's Seller profile sheet exactly (decoded
 * `profilelast_decoded_role.html:3352-3401`). Persists `organizationName`/`yearsInOperation`/
 * `businessStructure`/`sellerRole`/`ownershipStake`, matching web's real `SellerData` field names
 * (`SellerThesisTab.tsx`'s `SellerProfileCard`). */
export function SellerProfileSheet({
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
  const { colors } = useTheme();
  const [org, setOrg] = useState('');
  const [years, setYears] = useState('');
  const [structure, setStructure] = useState('');
  const [role, setRole] = useState('');
  const [stake, setStake] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setOrg(thesis.organizationName);
    setYears(thesis.yearsInOperation);
    setStructure(thesis.businessStructure);
    setRole(thesis.sellerRole);
    setStake(thesis.ownershipStake);
  }, [visible, thesis]);

  const valid = !!org.trim() && !!structure && !!role;

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const patch: Partial<IntermediaryThesis> = {
      organizationName: org.trim(),
      yearsInOperation: years.trim(),
      businessStructure: structure,
      sellerRole: role,
      ownershipStake: stake.trim(),
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
      icon={<User size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Seller profile"
      description="Who you are and your role in the transaction"
      saving={saving}
      onSave={handleSave}
      saveDisabled={!valid}
    >
      <View style={styles.row}>
        <ThesisField label="Organization name" required style={styles.flexField}>
          <TextInput
            value={org}
            onChangeText={setOrg}
            placeholder="e.g. Acme Corp"
            placeholderTextColor={colors.ink3}
            style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
          />
        </ThesisField>
        <ThesisField label="Years in operation" style={styles.flexField}>
          <TextInput
            value={years}
            onChangeText={setYears}
            placeholder="e.g. 12"
            placeholderTextColor={colors.ink3}
            style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
          />
        </ThesisField>
      </View>

      <ThesisField label="Organisation structure" required>
        <ThesisPillRow options={STRUCTURES} selected={structure ? [structure] : []} onToggle={setStructure} />
      </ThesisField>

      <ThesisField label="Your role in the transaction" required>
        <ThesisPillRow options={ROLES} selected={role ? [role] : []} onToggle={setRole} />
      </ThesisField>

      <ThesisField label="Ownership stake">
        <TextInput
          value={stake}
          onChangeText={setStake}
          placeholder="e.g. 100%"
          placeholderTextColor={colors.ink3}
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  // `alignItems: 'flex-end'` — when the two labels above these inputs wrap to a different number
  // of lines, this keeps both TextInputs aligned on the same row (bottom-anchored) instead of the
  // shorter-label column's input sitting higher than the other's.
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  flexField: { flex: 1, minWidth: 0 },
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
});
