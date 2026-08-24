import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { User } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisDropdown } from '../ThesisDropdown';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateAdvisorThesis, AdvisorThesis } from '../../../../api/roleThesis';

const ADVISOR_ROLES = ['Partner / Founder', 'Managing Director', 'Director / Principal', 'Manager / Lead', 'Independent advisor / Consultant', 'Other'];
const EXPERIENCE_RANGES = ['< 2 years', '2-5 years', '5-10 years', '10-20 years', '20+ years'];
const CORE_SERVICES = [
  'SBA Advisory', 'Financial Due Diligence', 'Buy Side Advisory', 'Sell Side Advisory',
  'Transaction Advisory', 'Legal Advisory', 'Operations Advisory', 'HR Advisory',
  'Tax Advisory', 'IT Advisory', 'Quality of Earnings', 'Commercial DD', 'Management Assessment',
];
const CLIENT_TYPES = [
  'Searchers / First-time acquirers', 'Independent sponsors', 'Search fund investors',
  'PE / VC funds', 'Business owners / Sellers', 'Corporates', 'Private equity backed operators',
  'Lenders / Capital providers', 'All of the above', 'Other (please specify)',
];
const OTHER_CLIENT_OPTION = 'Other (please specify)';

/** "Advisor Profile" edit sheet — matches web's real `AdvisorProfileCard` (`AdvisorThesisTab.tsx`,
 * Card 1). "Who You Work With" has a quirk: selecting the literal "Other (please specify)" pill
 * reveals a free-text input, and on save that literal option is swapped out of the array for the
 * typed value (`finalClients`), matching web's own `hasOtherClient`/`clientOther` handling exactly —
 * not appended alongside it. */
export function AdvisorProfileSheet({
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
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [clientOther, setClientOther] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setRole(thesis.advisorRole);
    setExperience(thesis.yearsExperience);
    setServices(thesis.coreServices);
    const known = new Set(CLIENT_TYPES);
    const otherValue = thesis.clientTypes.find(c => !known.has(c));
    setClients(otherValue ? [...thesis.clientTypes.filter(c => c !== otherValue), OTHER_CLIENT_OPTION] : thesis.clientTypes);
    setClientOther(otherValue ?? '');
  }, [visible, thesis]);

  const toggleServices = useCallback((option: string) => setServices(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleClients = useCallback((option: string) => setClients(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const hasOtherClient = clients.includes(OTHER_CLIENT_OPTION);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const finalClients =
      hasOtherClient && clientOther.trim()
        ? [...clients.filter(c => c !== OTHER_CLIENT_OPTION), clientOther.trim()]
        : clients;
    const patch: Partial<AdvisorThesis> = {
      advisorRole: role,
      yearsExperience: experience,
      coreServices: services,
      clientTypes: finalClients,
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
      icon={<User size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Advisor Profile"
      description="Your core identity on the platform"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Advisor role / title">
        <ThesisDropdown options={ADVISOR_ROLES} value={role} onChange={setRole} placeholder="Select role" />
      </ThesisField>

      <ThesisField label="Years of experience">
        <ThesisPillRow options={EXPERIENCE_RANGES} selected={experience ? [experience] : []} onToggle={setExperience} />
      </ThesisField>

      <ThesisField label="Core services">
        <ThesisPillRow options={CORE_SERVICES} selected={services} onToggle={toggleServices} />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Select all that apply</Text>
      </ThesisField>

      <ThesisField label="Who you work with">
        <ThesisPillRow options={CLIENT_TYPES} selected={clients} onToggle={toggleClients} />
        {hasOtherClient && (
          <TextInput
            value={clientOther}
            onChangeText={setClientOther}
            placeholder="Please specify…"
            placeholderTextColor={colors.ink3}
            style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink, marginTop: 8 }]}
          />
        )}
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
  hint: { fontSize: 10.5, marginTop: 6 },
});
