import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { types } from '@react-native-documents/picker';
import { ArrowLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme';
import { FileUploadButton } from '../FileUploadButton';
import type { PickedFile } from '../FileUploadButton';
import { uploadFileDirectToSupabase } from '../../api/supabaseDirectUpload';
import { createResource } from '../../api/resources';
import { CONTENT_TYPES } from '../../types/resources';

const EMPTY = { title: '', contentType: '', authorSource: '', description: '', link: '' };

/** "Contribute a resource" form — matches `Resources.html`'s sheet (~line 361) for layout, real
 * web functionality otherwise. All 5 real content types are offered (`page.tsx:257-260` maps
 * `CONTENT_TYPES` directly, not the mockup's own 3-option demo select). Required-field validation
 * matches web's real (if visually inconsistent) `handleSubmit` gate exactly — only `title` and
 * `content_type` actually block submission (`page.tsx:205`); `description`/`author_source` still
 * show a required asterisk in the UI (matching web's own inconsistency) but aren't enforced. Web's
 * real form also collects `author_source` but never sends it (`page.tsx:219-225`, a real bug) —
 * sent here anyway, see `createResource`'s doc comment.
 *
 * Plain screen content, not a `Modal` sheet — this used to be a bottom-sheet `Modal`, moved to a
 * dedicated pushed screen (`ContributeResourceScreen.tsx`, registered in `AppNavigator.tsx`) for
 * the same reason `CreateEventScreen`/`CreateAdCampaignScreen`/etc. were: consistency with this
 * app's established precedent of real navigation pushes for anything beyond a single lightweight
 * sheet, and it gets a real native push transition and back gesture instead. `MyResourcesScreen`
 * refetches on its own focus (matching Ad Management's convention) rather than this screen
 * needing a separate `onSuccess` callback — returning here via `onClose` after a successful
 * submit is enough to pick up the new resource. */
export function ContributeResourceSheet({ onClose }: { onClose: () => void }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const [fields, setFields] = useState(EMPTY);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  // Whichever of "Short description"/the link field (the two low enough to end up under the
  // keyboard) is currently focused, so the keyboard-show handler knows what to measure.
  const focusedInputRef = useRef<TextInput | null>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const linkInputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // This app's build (`newArchEnabled=true` in `android/gradle.properties`, RN 0.83) runs on the
  // New Architecture. Confirmed by on-device debug logging (not guessed):
  //
  // 1. `react-native-keyboard-aware-scroll-view` (this form used to use it) is built on RN's
  //    legacy scroll-responder API, unreliable under Fabric — its own auto-scroll landed on the
  //    wrong field, and manual calls through its ref silently did nothing.
  // 2. `KeyboardAvoidingView` doesn't reliably resize this screen for the keyboard on Android
  //    either (Android's own `windowSoftInputMode="adjustResize"` and RN's own resize logic don't
  //    always agree, confirmed elsewhere in this app as a real flicker/gap bug — see
  //    `CreateChapterScreen.tsx`'s doc comment). So the `ScrollView` below needs real extra
  //    bottom padding to even have something to scroll into — `paddingBottom: keyboardHeight` on
  //    its content does that (same technique `KeyboardAwareScrollView`'s `enableOnAndroid` used
  //    internally).
  // 3. `scrollToEnd()` isn't the right target though — it scrolls past *all* of that new padding
  //    (plus whatever headroom the form already had at rest), overshooting the keyboard's top
  //    edge by a large gap. The correct amount is precise: measure the focused input's actual
  //    position in the window and scroll only far enough that its bottom edge clears the
  //    keyboard's top edge, with a small margin — not further.
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      const kbHeight = e.endCoordinates?.height ?? 0;
      setKeyboardHeight(kbHeight);
      const input = focusedInputRef.current;
      if (!input) return;
      // Wait a frame so the new `paddingBottom` above has actually rendered — otherwise this
      // scroll can get clamped to the old (shorter) scrollable range.
      requestAnimationFrame(() => {
        input.measureInWindow((_x, y, _width, height) => {
          const keyboardTop = Dimensions.get('window').height - kbHeight;
          const overlap = y + height - keyboardTop;
          if (overlap > 0) {
            scrollRef.current?.scrollTo({ y: scrollOffsetRef.current + overlap + 12, animated: true });
          }
        });
      });
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    // Matches web's real `handleSubmit` gate exactly (`page.tsx:205`) — only title + type
    // actually block submission, despite description/author-source showing a required asterisk.
    if (!fields.title.trim() || !fields.contentType) {
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
      Toast.show({ type: 'success', text1: 'Resource submitted for review' });
      onClose();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not submit resource', text2: 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.pageBg, paddingTop: insets.top }]}
      // Android stays `undefined`, matching `CreateEventWizard.tsx`/`CreateCampaignWizard.tsx`'s
      // established convention — `behavior="height"` fights this app's own
      // `windowSoftInputMode="adjustResize"`; the `keyboardHeight`-based content padding above is
      // the one real mechanism doing that job here.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
        <Pressable
          onPress={onClose}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[fonts.display, styles.headerTitle, { color: colors.ink }]}>Contribute a resource</Text>
          <Text style={[fonts.regular, styles.headerSubtitle, { color: colors.ink3 }]}>Share knowledge with the TSB community</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: styles.bodyContent.paddingBottom + keyboardHeight }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={e => {
          scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
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
                {CONTENT_TYPES.map(t => {
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
                      <Text style={[fonts.semibold, { fontSize: 11.5, color: active ? colors.goldDark : colors.ink2 }]}>{t}</Text>
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
            placeholder="Your name or source URL"
            placeholderTextColor={colors.ink3}
            style={[fonts.regular, styles.input, { fontSize: fontSize.body, color: colors.ink, backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.lg }]}
          />
        </Field>

        <Field label="Short description" required colors={colors} fonts={fonts}>
          <TextInput
            ref={descriptionInputRef}
            value={fields.description}
            onChangeText={t => setFields(f => ({ ...f, description: t }))}
            onFocus={() => {
              focusedInputRef.current = descriptionInputRef.current;
            }}
            onBlur={() => {
              focusedInputRef.current = null;
            }}
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
            acceptedTypes={[types.pdf, types.docx, types.xlsx, types.video]}
            placeholder="Tap to upload a file — PDF, DOCX, XLSX, MP4 · Max 50MB"
          />
          <TextInput
            ref={linkInputRef}
            value={fields.link}
            onChangeText={t => setFields(f => ({ ...f, link: t }))}
            onFocus={() => {
              focusedInputRef.current = linkInputRef.current;
            }}
            onBlur={() => {
              focusedInputRef.current = null;
            }}
            placeholder="Or paste a link (https://…)"
            placeholderTextColor={colors.ink3}
            autoCapitalize="none"
            keyboardType="url"
            style={[fonts.regular, styles.linkInput, { fontSize: fontSize.body, color: colors.ink, backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.lg }]}
          />
        </Field>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin, paddingBottom: 16 + insets.bottom }]}>
        <Pressable
          onPress={onClose}
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
    </KeyboardAvoidingView>
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
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    marginTop: 6,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },
  body: {
    flex: 1,
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
    flexWrap: 'wrap',
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
    paddingHorizontal: 16,
    paddingTop: 16,
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
