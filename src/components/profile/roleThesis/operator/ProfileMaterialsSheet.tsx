import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { types } from '@react-native-documents/picker';
import { FileText } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisField } from '../ThesisField';
import { updateOperatorThesis, OperatorThesis } from '../../../../api/roleThesis';
import { updateProfile, uploadDocument } from '../../../../api/profile';
import { FileUploadButton, PickedFile } from '../../../FileUploadButton';
import type { Profile } from '../../../../types/directory';

const DOC_UPLOAD_TYPES = [types.pdf, types.doc, types.docx];
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

/** "Profile & Supporting Materials" edit sheet — matches web's real Card 6 (`OperatorThesisTab.tsx`).
 *
 * LinkedIn URL is a genuine cross-cutting quirk: it isn't part of `OperatorThesis` at all — it
 * lives on the general profile record (`profile.linkedin_url`). On Save this fires
 * `updateOperatorThesis` (the 3 real Operator fields) and, only if the LinkedIn value actually
 * changed, `updateProfile({ linkedin_url })` (the same endpoint Settings' Profile tab uses) in
 * parallel via `Promise.all` — see `OperatorThesis`'s own doc comment (`api/roleThesis.ts`) for why
 * it's kept out of that type entirely. `onSaved` only reports the `OperatorThesis`-shaped patch;
 * the parent's `profile.linkedin_url` goes stale until the next natural refresh (pull-to-refresh),
 * matching this app's "don't over-engineer a cross-cutting refetch" convention for this one field. */
export function ProfileMaterialsSheet({
  visible,
  thesis,
  profile,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: OperatorThesis;
  profile: Profile;
  onClose: () => void;
  onSaved: (patch: Partial<OperatorThesis>) => void;
}) {
  const { colors } = useTheme();
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<PickedFile | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [coverLetterUrl, setCoverLetterUrl] = useState('');
  const [coverLetterFile, setCoverLetterFile] = useState<PickedFile | null>(null);
  const [coverLetterUploading, setCoverLetterUploading] = useState(false);
  const [statement, setStatement] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setResumeUrl(thesis.resumeUrl);
    setResumeFile(thesis.resumeUrl ? { uri: thesis.resumeUrl, name: 'Resume', size: null, mimeType: null } : null);
    setCoverLetterUrl(thesis.coverLetterUrl);
    setCoverLetterFile(thesis.coverLetterUrl ? { uri: thesis.coverLetterUrl, name: 'Cover letter', size: null, mimeType: null } : null);
    setStatement(thesis.professionalStatement);
    setLinkedinUrl(profile.linkedin_url ?? '');
  }, [visible, thesis, profile.linkedin_url]);

  const handleResumeChange = useCallback(async (file: PickedFile | null) => {
    setResumeFile(file);
    if (!file) {
      setResumeUrl('');
      return;
    }
    setResumeUploading(true);
    try {
      const { fileUrl } = await uploadDocument(file, 'resume');
      setResumeUrl(fileUrl);
    } catch {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Please try again.' });
      setResumeFile(null);
    } finally {
      setResumeUploading(false);
    }
  }, []);

  const handleCoverLetterChange = useCallback(async (file: PickedFile | null) => {
    setCoverLetterFile(file);
    if (!file) {
      setCoverLetterUrl('');
      return;
    }
    setCoverLetterUploading(true);
    try {
      const { fileUrl } = await uploadDocument(file, 'cover_letter');
      setCoverLetterUrl(fileUrl);
    } catch {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Please try again.' });
      setCoverLetterFile(null);
    } finally {
      setCoverLetterUploading(false);
    }
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<OperatorThesis> = {
      resumeUrl,
      coverLetterUrl,
      professionalStatement: statement.trim(),
    };
    const trimmedLinkedin = linkedinUrl.trim();
    const linkedinChanged = trimmedLinkedin !== (profile.linkedin_url ?? '');
    try {
      await Promise.all([
        updateOperatorThesis(patch),
        linkedinChanged ? updateProfile({ linkedin_url: trimmedLinkedin }) : Promise.resolve(),
      ]);
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
      icon={<FileText size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Profile & Supporting Materials"
      description="Documents and links that support your profile"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Resume / CV">
        <FileUploadButton
          value={resumeFile}
          onChange={handleResumeChange}
          loading={resumeUploading}
          variant="dropzone"
          acceptedTypes={DOC_UPLOAD_TYPES}
          maxSizeBytes={MAX_UPLOAD_SIZE_BYTES}
          placeholder="PDF or Word · Max 10MB"
          uploadedCaption="Tap to replace"
        />
      </ThesisField>

      <ThesisField label="Cover Letter (optional)">
        <FileUploadButton
          value={coverLetterFile}
          onChange={handleCoverLetterChange}
          loading={coverLetterUploading}
          variant="dropzone"
          acceptedTypes={DOC_UPLOAD_TYPES}
          maxSizeBytes={MAX_UPLOAD_SIZE_BYTES}
          placeholder="PDF or Word · Max 10MB"
          uploadedCaption="Tap to replace"
        />
      </ThesisField>

      <ThesisField label="LinkedIn URL">
        <TextInput
          value={linkedinUrl}
          onChangeText={setLinkedinUrl}
          placeholder="https://linkedin.com/in/..."
          placeholderTextColor={colors.ink3}
          autoCapitalize="none"
          keyboardType="url"
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <ThesisField label="Professional Statement">
        <TextInput
          value={statement}
          onChangeText={setStatement}
          placeholder="A short statement introducing yourself as an operator..."
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
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
  textarea: { height: 90, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 12.5, lineHeight: 18 },
});
