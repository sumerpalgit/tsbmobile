import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { types } from '@react-native-documents/picker';
import { FileText } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisField } from '../ThesisField';
import { updateStudentThesis, StudentThesis } from '../../../../api/roleThesis';
import { uploadDocument } from '../../../../api/profile';
import { FileUploadButton, PickedFile } from '../../../FileUploadButton';
import type { Profile } from '../../../../types/directory';

const DOC_UPLOAD_TYPES = [types.pdf, types.doc, types.docx];
/** Web's own helper text says "Max 5MB" for this role — smaller than Operator's 10MB and Business
 * Owner's 20MB, don't copy either. */
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

/** "Supporting Materials" edit sheet — matches web's real Card 6 (`StudentThesisTab.tsx:720-968`).
 * Unlike Operator, `linkedinUrl` IS part of `StudentThesis` itself (not a cross-cutting general
 * profile field), so no separate `updateProfile` call is needed here — a single `updateStudentThesis`
 * covers all three fields. The FIELD'S INITIAL VALUE still needs `profile.linkedin_url` as a
 * fallback though — matches web's real `useState(data.linkedinUrl || profile?.linkedin_url || "")`
 * exactly (`StudentThesisTab.tsx:747`), so a user who already set their general LinkedIn URL sees it
 * pre-filled here instead of an empty field, even though it was never explicitly saved through this
 * sheet before. */
export function SupportingMaterialsSheet({
  visible,
  thesis,
  profile,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: StudentThesis;
  profile: Profile;
  onClose: () => void;
  onSaved: (patch: Partial<StudentThesis>) => void;
}) {
  const { colors, fonts } = useTheme();
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<PickedFile | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [coverLetterUrl, setCoverLetterUrl] = useState('');
  const [coverLetterFile, setCoverLetterFile] = useState<PickedFile | null>(null);
  const [coverLetterUploading, setCoverLetterUploading] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setResumeUrl(thesis.resumeUrl);
    setResumeFile(thesis.resumeUrl ? { uri: thesis.resumeUrl, name: 'Resume', size: null, mimeType: null } : null);
    setCoverLetterUrl(thesis.coverLetterUrl);
    setCoverLetterFile(thesis.coverLetterUrl ? { uri: thesis.coverLetterUrl, name: 'Cover letter', size: null, mimeType: null } : null);
    setLinkedinUrl(thesis.linkedinUrl || profile.linkedin_url || '');
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
    const patch: Partial<StudentThesis> = {
      resumeUrl,
      coverLetterUrl,
      linkedinUrl: linkedinUrl.trim(),
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
      icon={<FileText size={17} strokeWidth={1.6} />}
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Supporting materials"
      description="Resume, cover letter and links"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Resume / CV" required>
        <FileUploadButton
          value={resumeFile}
          onChange={handleResumeChange}
          loading={resumeUploading}
          variant="dropzone"
          acceptedTypes={DOC_UPLOAD_TYPES}
          maxSizeBytes={MAX_UPLOAD_SIZE_BYTES}
          placeholder="PDF or Word · Max 5MB"
          uploadedCaption="Tap to replace"
        />
      </ThesisField>

      <View style={styles.linkedinGroup}>
        <Text style={[fonts.regular, styles.hint, { color: colors.ink2 }]}>Or add your LinkedIn / portfolio link below</Text>
        <TextInput
          underlineColorAndroid="transparent"
          value={linkedinUrl}
          onChangeText={setLinkedinUrl}
          placeholder="https://linkedin.com/in/yourprofile"
          placeholderTextColor={colors.ink3}
          autoCapitalize="none"
          keyboardType="url"
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </View>

      <ThesisField label="Cover Letter / Personal Statement (Optional)">
        <FileUploadButton
          value={coverLetterFile}
          onChange={handleCoverLetterChange}
          loading={coverLetterUploading}
          variant="dropzone"
          acceptedTypes={DOC_UPLOAD_TYPES}
          maxSizeBytes={MAX_UPLOAD_SIZE_BYTES}
          placeholder="PDF or Word · Max 5MB"
          uploadedCaption="Tap to replace"
        />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
  linkedinGroup: { gap: 8 },
  hint: { fontSize: 12 },
});
