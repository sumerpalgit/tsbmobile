import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { types } from '@react-native-documents/picker';
import { useTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { FileUploadButton, PickedFile } from '../FileUploadButton';
import { uploadDocument } from '../../api/profile';

/**
 * Job Apply form — resume upload + cover letter + per-job screening questions, matching web's
 * `JobApplyModal` (`resumeInputMode="file"`, `uploadResume` to Supabase `/resumes`; mobile instead
 * reuses this app's own generic `POST /upload/document` — `uploadDocument`, `fileType: 'resume'` —
 * same pattern every other document upload in this app already uses).
 */
export function JobApplyFormSheet({
  visible,
  jobId,
  screeningQuestions,
  onClose,
  onSubmit,
  submitting,
}: {
  visible: boolean;
  jobId: string | null;
  screeningQuestions: string[];
  onClose: () => void;
  onSubmit: (args: { jobId: string; resumeUrl: string; coverLetter: string; screeningAnswers: string[] }) => void;
  submitting: boolean;
}) {
  const { colors, fonts, radius } = useTheme();
  const [resume, setResume] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setResume(null);
      setCoverLetter('');
      setAnswers(screeningQuestions.map(() => ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, jobId]);

  const handleSubmit = async () => {
    if (!jobId || !resume) return;
    setUploading(true);
    try {
      const { fileUrl } = await uploadDocument(resume, 'resume');
      onSubmit({ jobId, resumeUrl: fileUrl, coverLetter: coverLetter.trim(), screeningAnswers: answers });
    } catch {
      Toast.show({ type: 'error', text1: 'Resume upload failed', text2: 'Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const busy = uploading || submitting;

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissable={!busy}>
      <View style={styles.headerRow}>
        <Text style={[fonts.display, styles.title, { color: colors.ink, flex: 1 }]}>Apply for this Role</Text>
        <Pressable
          onPress={onClose}
          disabled={busy}
          accessibilityLabel="Close"
          style={[styles.closeButton, { backgroundColor: colors.surfaceSunken, borderRadius: radius.lg }]}
        >
          <X size={16} color={colors.ink2} strokeWidth={1.8} />
        </Pressable>
      </View>

      <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>Resume</Text>
      <FileUploadButton
        value={resume}
        onChange={setResume}
        acceptedTypes={[types.pdf, types.docx, types.doc]}
        placeholder="Tap to upload your resume"
      />

      <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>Cover Letter (optional)</Text>
      <TextInput
        value={coverLetter}
        onChangeText={setCoverLetter}
        multiline
        numberOfLines={4}
        placeholder="Tell them why you're a fit…"
        placeholderTextColor={colors.ink3}
        style={[styles.textarea, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
      />

      {screeningQuestions.map((question, i) => (
        <View key={i}>
          <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>{question}</Text>
          <TextInput
            value={answers[i] ?? ''}
            onChangeText={text =>
              setAnswers(prev => {
                const next = [...prev];
                next[i] = text;
                return next;
              })
            }
            placeholder="Your answer"
            placeholderTextColor={colors.ink3}
            style={[styles.input, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
          />
        </View>
      ))}

      <Pressable
        onPress={handleSubmit}
        disabled={!resume || busy}
        style={[styles.sendButton, { backgroundColor: !resume ? colors.surfaceSunken : colors.gold }]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={!resume ? colors.ink3 : '#fff'} />
        ) : (
          <Text style={[fonts.bold, styles.sendButtonText, { color: !resume ? colors.ink3 : '#fff' }]}>
            Submit Application
          </Text>
        )}
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: 18, letterSpacing: -0.2 },
  fieldLabel: { fontSize: 12, marginTop: 14, marginBottom: 6 },
  textarea: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, fontSize: 13, minHeight: 84, textAlignVertical: 'top' },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, fontSize: 13, height: 44 },
  sendButton: { height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 18, marginBottom: 4 },
  sendButtonText: { fontSize: 13.5 },
});
