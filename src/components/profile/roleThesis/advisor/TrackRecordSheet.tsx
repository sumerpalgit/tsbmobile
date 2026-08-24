import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { types } from '@react-native-documents/picker';
import { Star } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { Switch } from '../../../Switch';
import { updateAdvisorThesis, AdvisorThesis } from '../../../../api/roleThesis';
import { uploadDocument } from '../../../../api/profile';
import { FileUploadButton, PickedFile } from '../../../FileUploadButton';

const KEY_STRENGTH_OPTIONS = [
  'ETA Specialist', 'Searcher Network', 'Fast Turnaround', 'Senior Attention', 'LMM Expertise',
  'SBA Deal Experience', 'Lender Relationships', 'Sector Depth', 'Cross-Border Deals',
  'Post-Close Support', 'Flexible Fees', 'Remote / Virtual',
];
const DOC_UPLOAD_TYPES = [types.pdf, types.doc, types.docx, types.ppt, types.pptx];
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const BIO_MAX_LENGTH = 500;

/** "Track Record & Differentiation" edit sheet — matches web's real `TrackRecordCard`
 * (`AdvisorThesisTab.tsx`, Card 5). "Make credentials publicly visible" is a genuine ON/OFF switch
 * on web (`role="switch"`), not a Yes/No toggle — reuses the shared `Switch` component
 * (`src/components/Switch.tsx`) with `onColor={colors.hero1}` to match web's navy "on" state
 * (`bg-[var(--tsb-accent-solid)]`), same navy-not-gold convention already established for
 * `ThesisBoolToggle` elsewhere in this feature. */
export function TrackRecordSheet({
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
  const [dealsCompleted, setDealsCompleted] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docFile, setDocFile] = useState<PickedFile | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [credLinkUrl, setCredLinkUrl] = useState('');
  const [sampleUrl, setSampleUrl] = useState('');
  const [sampleFile, setSampleFile] = useState<PickedFile | null>(null);
  const [sampleUploading, setSampleUploading] = useState(false);
  const [credPublic, setCredPublic] = useState(false);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDealsCompleted(thesis.dealsCompleted);
    setDocUrl(thesis.firmCredentialsUrl);
    setDocFile(thesis.firmCredentialsUrl ? { uri: thesis.firmCredentialsUrl, name: 'Credentials deck', size: null, mimeType: null } : null);
    setCredLinkUrl(thesis.credentialsLinkUrl);
    setSampleUrl(thesis.redactedWorkUrl);
    setSampleFile(thesis.redactedWorkUrl ? { uri: thesis.redactedWorkUrl, name: 'Sample work', size: null, mimeType: null } : null);
    setCredPublic(thesis.credentialsPublic);
    setStrengths(thesis.keyStrengths);
    setBio(thesis.differentiationBio);
  }, [visible, thesis]);

  const toggleStrengths = useCallback((option: string) => setStrengths(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  // Stable callback identity so `FileUploadButton`'s memoization actually takes effect — see its
  // own doc comment for why (this sheet has ~12 fields including 2 upload buttons; without this,
  // typing in any other field re-renders both file pickers too).
  const handleDocChange = useCallback(async (file: PickedFile | null) => {
    setDocFile(file);
    if (!file) {
      setDocUrl('');
      return;
    }
    setDocUploading(true);
    try {
      const { fileUrl } = await uploadDocument(file, 'advisor_credentials');
      setDocUrl(fileUrl);
    } catch {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Please try again.' });
      setDocFile(null);
    } finally {
      setDocUploading(false);
    }
  }, []);

  const handleSampleChange = useCallback(async (file: PickedFile | null) => {
    setSampleFile(file);
    if (!file) {
      setSampleUrl('');
      return;
    }
    setSampleUploading(true);
    try {
      const { fileUrl } = await uploadDocument(file, 'advisor_sample_work');
      setSampleUrl(fileUrl);
    } catch {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Please try again.' });
      setSampleFile(null);
    } finally {
      setSampleUploading(false);
    }
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<AdvisorThesis> = {
      dealsCompleted: dealsCompleted.trim(),
      firmCredentialsUrl: docUrl,
      credentialsLinkUrl: credLinkUrl.trim(),
      redactedWorkUrl: sampleUrl,
      credentialsPublic: credPublic,
      differentiationBio: bio.trim(),
      keyStrengths: strengths,
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
      icon={<Star size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Track Record & Differentiation"
      description="Your experience, credentials and what sets you apart"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Number of deals / projects worked on">
        <TextInput
          value={dealsCompleted}
          onChangeText={setDealsCompleted}
          placeholder="e.g. 42"
          placeholderTextColor={colors.ink3}
          keyboardType="number-pad"
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Total completed engagements</Text>
      </ThesisField>

      <ThesisField label="Credentials deck">
        <FileUploadButton
          value={docFile}
          onChange={handleDocChange}
          loading={docUploading}
          variant="dropzone"
          acceptedTypes={DOC_UPLOAD_TYPES}
          maxSizeBytes={MAX_UPLOAD_SIZE_BYTES}
          placeholder="PDF, Word or PowerPoint · Max 10MB"
          uploadedCaption="Tap to replace"
        />
      </ThesisField>

      <ThesisField label="Or add a link below">
        <TextInput
          value={credLinkUrl}
          onChangeText={setCredLinkUrl}
          placeholder="https://your-credentials-link.com"
          placeholderTextColor={colors.ink3}
          autoCapitalize="none"
          keyboardType="url"
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <ThesisField label="Redacted / sample work (optional)">
        <FileUploadButton
          value={sampleFile}
          onChange={handleSampleChange}
          loading={sampleUploading}
          variant="dropzone"
          acceptedTypes={DOC_UPLOAD_TYPES}
          maxSizeBytes={MAX_UPLOAD_SIZE_BYTES}
          placeholder="PDF, Word or PowerPoint · Max 10MB"
          uploadedCaption="Tap to replace"
        />
      </ThesisField>

      <View style={styles.switchRow}>
        <Text style={[fonts.semibold, styles.switchLabel, { color: colors.ink2 }]}>Make credentials publicly visible</Text>
        <Switch value={credPublic} onValueChange={setCredPublic} onColor={colors.hero1} />
      </View>

      <ThesisField label="Differentiation & value add — key strengths">
        <ThesisPillRow options={KEY_STRENGTH_OPTIONS} selected={strengths} onToggle={toggleStrengths} />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Select up to 5</Text>
      </ThesisField>

      <ThesisField label="Written summary of differentiation (optional)">
        <TextInput
          value={bio}
          onChangeText={t => t.length <= BIO_MAX_LENGTH && setBio(t)}
          placeholder="Describe what makes you different from other advisors in this space..."
          placeholderTextColor={colors.ink3}
          multiline
          textAlignVertical="top"
          style={[styles.textarea, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
        <Text style={[fonts.regular, styles.counter, { color: colors.ink3 }]}>{bio.length} / {BIO_MAX_LENGTH}</Text>
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
  textarea: { height: 100, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 12.5, lineHeight: 18 },
  hint: { fontSize: 10.5, marginTop: 6 },
  counter: { fontSize: 10.5, marginTop: 6, textAlign: 'right' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchLabel: { fontSize: 12.5, flex: 1, minWidth: 0 },
});
