import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { types } from '@react-native-documents/picker';
import { Plus, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme';
import { FileUploadButton } from '../FileUploadButton';
import type { PickedFile } from '../FileUploadButton';
import { uploadFileDirectToSupabase } from '../../api/supabaseDirectUpload';
import { createResource } from '../../api/resources';

const CONTRIBUTE_TYPES = ['Templates', 'Checklists', 'Articles'] as const;

const EMPTY = { title: '', contentType: '', authorSource: '', description: '', link: '' };

/** Bottom-sheet Contribute form — matches `Resources.html`'s sheet (~line 361). Only 3 content
 * types are offered here (matches the mockup's own 3-option select — see the plan) even though
 * browsing supports 5; Tools/Case Studies aren't contributable via this form on the mockup's own
 * design. Web's real form also collects `author_source` but never sends it (`page.tsx:219-225`,
 * a real bug) — sent here anyway, see `createResource`'s doc comment. */
export function ContributeResourceSheet({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const [fields, setFields] = useState(EMPTY);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setFields(EMPTY);
    setFile(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!fields.title.trim() || !fields.contentType || !fields.authorSource.trim() || !fields.description.trim()) {
      Toast.show({ type: 'error', text1: 'Fill in the required fields' });
      return;
    }
    if (!file && !fields.link.trim()) {
      Toast.show({ type: 'error', text1: 'Attach a file or paste a link' });
      return;
    }
    setSubmitting(true);
    try {
      let fileUrl: string | undefined;
      if (file) {
        fileUrl = (await uploadFileDirectToSupabase(file.uri, file.name, file.mimeType || 'application/octet-stream', 'resources', 'resources')) ?? undefined;
      }
      await createResource({
        title: fields.title.trim(),
        description: fields.description.trim(),
        contentType: fields.contentType,
        authorSource: fields.authorSource.trim(),
        resourceLink: fields.link.trim() || undefined,
        fileUrl,
      });
      reset();
      onClose();
      onSuccess();
      Toast.show({ type: 'success', text1: 'Resource submitted for review' });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not submit resource', text2: 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={[styles.backdrop, { backgroundColor: 'rgba(12,21,32,0.5)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        {/* Android: no `behavior` here — `KeyboardAwareScrollView` below already handles the
         * keyboard itself (`enableOnAndroid`). Stacking `behavior="height"` on top of that made
         * the sheet jump/blink on keyboard-open (two independent repositioning passes firing off
         * the same event), same double-compensation `OnboardingScreen.tsx` documents. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl }]}>
            <View style={[styles.header, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
              <View style={[styles.headerIcon, { backgroundColor: colors.chip, borderRadius: radius.lg }]}>
                <Plus size={17} color={colors.goldDark} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[fonts.display, styles.headerTitle, { color: colors.ink }]}>Contribute a resource</Text>
                <Text style={[fonts.regular, styles.headerSubtitle, { color: colors.ink3 }]}>Share knowledge with the TSB community</Text>
              </View>
              <Pressable onPress={handleClose} accessibilityLabel="Close" style={[styles.closeButton, { backgroundColor: colors.surfaceSunken, borderRadius: radius.lg }]}>
                <X size={16} color={colors.ink2} strokeWidth={1.8} />
              </Pressable>
            </View>

            {/* Plain `ScrollView` never scrolls a focused input into view on its own — the lower
             * fields (Short description, the link input) ended up hidden behind the keyboard.
             * `enableOnAndroid` is required since this library only auto-scrolls on Android when
             * explicitly told to — same fix already established for `OnboardingScreen.tsx`. */}
            <KeyboardAwareScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              enableOnAndroid
              extraScrollHeight={20}
              keyboardOpeningTime={0}
            >
              <Field label="Resource title" required colors={colors} fonts={fonts}>
                <TextInput
                  value={fields.title}
                  onChangeText={t => setFields(f => ({ ...f, title: t }))}
                  placeholder="e.g. SME Acquisition Due Diligence Checklist"
                  placeholderTextColor={colors.ink3}
                  style={[fonts.regular, styles.input, { fontSize: fontSize.body, color: colors.ink, backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.lg }]}
                />
              </Field>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field label="Type" required colors={colors} fonts={fonts}>
                    <View style={styles.chipsRow}>
                      {CONTRIBUTE_TYPES.map(t => {
                        const active = fields.contentType === t;
                        return (
                          <Pressable
                            key={t}
                            onPress={() => setFields(f => ({ ...f, contentType: t }))}
                            style={[
                              styles.typeChip,
                              { borderRadius: radius.md },
                              active
                                ? { backgroundColor: colors.chip, borderColor: colors.gold, borderWidth: 1 }
                                : { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin },
                            ]}
                          >
                            <Text style={[fonts.semibold, { fontSize: 11.5, color: active ? colors.goldDark : colors.ink2 }]}>{t.slice(0, -1)}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </Field>
                </View>
              </View>

              <Field label="Author / source" required colors={colors} fonts={fonts}>
                <TextInput
                  value={fields.authorSource}
                  onChangeText={t => setFields(f => ({ ...f, authorSource: t }))}
                  placeholder="Your name"
                  placeholderTextColor={colors.ink3}
                  style={[fonts.regular, styles.input, { fontSize: fontSize.body, color: colors.ink, backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.lg }]}
                />
              </Field>

              <Field label="Short description" required colors={colors} fonts={fonts}>
                <TextInput
                  value={fields.description}
                  onChangeText={t => setFields(f => ({ ...f, description: t }))}
                  placeholder="What is this? Who is it for?"
                  placeholderTextColor={colors.ink3}
                  multiline
                  textAlignVertical="top"
                  style={[fonts.regular, styles.textarea, { fontSize: fontSize.body, color: colors.ink, backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.lg }]}
                />
              </Field>

              <Field label="Upload file or paste link" colors={colors} fonts={fonts}>
                <FileUploadButton
                  value={file}
                  onChange={setFile}
                  acceptedTypes={[types.pdf, types.docx, types.xlsx]}
                  placeholder="Tap to upload a file — PDF, DOCX, XLSX · Max 50MB"
                />
                <TextInput
                  value={fields.link}
                  onChangeText={t => setFields(f => ({ ...f, link: t }))}
                  placeholder="Or paste a link (https://…)"
                  placeholderTextColor={colors.ink3}
                  autoCapitalize="none"
                  keyboardType="url"
                  style={[fonts.regular, styles.linkInput, { fontSize: fontSize.body, color: colors.ink, backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.lg }]}
                />
              </Field>
            </KeyboardAwareScrollView>

            <View style={[styles.footer, { borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
              <Pressable
                onPress={handleClose}
                disabled={submitting}
                style={({ pressed }) => [styles.cancelButton, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: borderWidth.thin }, pressed && styles.pressed]}
              >
                <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                style={({ pressed }) => [styles.submitButton, { backgroundColor: colors.gold, borderRadius: radius.lg, opacity: submitting ? 0.7 : 1 }, pressed && styles.pressed]}
              >
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[fonts.bold, { fontSize: fontSize.title, color: '#fff' }]}>Submit resource</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Field({
  label,
  required,
  colors,
  fonts,
  children,
}: {
  label: string;
  required?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  fonts: ReturnType<typeof useTheme>['fonts'];
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>
        {label}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    maxHeight: '88%',
  },
  sheet: {
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 16,
  },
  headerIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  headerSubtitle: {
    fontSize: 10.5,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 16,
  },
  bodyContent: {
    paddingBottom: 16,
  },
  field: {
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 12.5,
    marginBottom: 7,
  },
  input: {
    height: 44,
    paddingHorizontal: 13,
    borderWidth: 1,
  },
  textarea: {
    height: 80,
    padding: 13,
    borderWidth: 1,
  },
  linkInput: {
    height: 42,
    paddingHorizontal: 13,
    borderWidth: 1,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    height: 38,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  cancelButton: {
    height: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
