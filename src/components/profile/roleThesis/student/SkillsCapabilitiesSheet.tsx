import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { AlignLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateStudentThesis, StudentThesis } from '../../../../api/roleThesis';

const CORE_SKILLS_OPTIONS = [
  'Financial modelling', 'Valuation (DCF / comps)', 'Business analysis', 'Market research',
  'Accounting', 'Data analysis', 'PowerPoint / deck building', 'Project management',
  'Writing & communications', 'Deal sourcing / outreach', 'Due diligence',
  'CRM / pipeline management', 'Operations & process',
];
const TOOLS_OPTIONS = [
  'Excel / Google Sheets', 'PowerPoint', 'Python / R', 'SQL', 'Tableau / Power BI',
  'Salesforce / HubSpot', 'QuickBooks', 'Pitchbook / CapIQ', 'Notion / Airtable', 'AI tools (ChatGPT etc.)',
];

/** "Skills & Capabilities" edit sheet — matches web's real Card 2 (`StudentThesisTab.tsx:334-458`). */
export function SkillsCapabilitiesSheet({
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
  const { colors, fonts } = useTheme();
  const [coreSkills, setCoreSkills] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [aboutYou, setAboutYou] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCoreSkills(thesis.coreSkills);
    setTools(thesis.tools);
    setExperienceLevel(thesis.experienceLevel);
    setAboutYou(thesis.aboutYou);
  }, [visible, thesis]);

  const toggleSkills = useCallback((option: string) => setCoreSkills(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleTools = useCallback((option: string) => setTools(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<StudentThesis> = {
      coreSkills,
      tools,
      experienceLevel: experienceLevel.trim(),
      aboutYou: aboutYou.trim(),
    };
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
      icon={<AlignLeft size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Skills & capabilities"
      description="What they can do and tools they know"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Core Skills" required>
        <ThesisPillRow options={CORE_SKILLS_OPTIONS} selected={coreSkills} onToggle={toggleSkills} />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Select all that apply</Text>
      </ThesisField>

      <ThesisField label="Tools Familiarity">
        <ThesisPillRow options={TOOLS_OPTIONS} selected={tools} onToggle={toggleTools} />
      </ThesisField>

      <ThesisField label="Current Experience Level">
        <TextInput
          underlineColorAndroid="transparent"
          value={experienceLevel}
          onChangeText={setExperienceLevel}
          placeholder="Your professional background before this academic programme"
          placeholderTextColor={colors.ink3}
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <ThesisField label="About You (Optional)">
        <TextInput
          underlineColorAndroid="transparent"
          value={aboutYou}
          onChangeText={t => setAboutYou(t.slice(0, 400))}
          placeholder="Briefly describe your background, why you are interested in ETA, and what you are hoping to contribute..."
          placeholderTextColor={colors.ink3}
          multiline
          textAlignVertical="top"
          style={[styles.textarea, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
        <Text style={[fonts.regular, styles.counter, { color: colors.ink3 }]}>{aboutYou.length} / 400</Text>
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
  textarea: { height: 110, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 12.5, lineHeight: 18 },
  hint: { fontSize: 10.5, marginTop: 6 },
  counter: { fontSize: 10.5, marginTop: 4, textAlign: 'right' },
});
