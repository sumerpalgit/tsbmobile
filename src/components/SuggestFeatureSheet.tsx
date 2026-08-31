import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { X } from 'lucide-react-native';
import { useTheme } from '../theme';
import { BottomSheet } from './BottomSheet';
import { Icon } from './icons/Icon';
import { submitFeatureSuggestion } from '../api/feedback';

/**
 * "Suggest a Feature" — ported from web's `SuggestFeatureModal`
 * (`webSrc/app/dashboard/layout.tsx:14-79`), the one item in web's **mobile** drawer
 * (`layout.tsx:356`) that had no mobile equivalent at all. All copy is verbatim from web: the
 * title, the "What would make The Search Bridge better for you?" subtitle, the textarea
 * placeholder, "Send Suggestion"/"Sending…", and the sent state's "Thanks for the idea!" /
 * "We read every suggestion and use them to shape the roadmap."
 *
 * One deliberate deviation from web: **bottom sheet, not a centered modal.** Web renders a
 * 440px-wide centered card. Every compose-and-submit surface in this app is a `BottomSheet`
 * (`CommentComposerSheet` is the direct analogue — same textarea + single gold submit button
 * shape), and that shell already solves the keyboard-avoidance and `SafeAreaProvider` nesting
 * problems a hand-rolled centered `Modal` would hit here. No mobile mockup exists for this
 * screen to check against — it's a web-only feature — so the app's own established pattern wins
 * over a literal web port.
 *
 * **Send failures are swallowed, matching web exactly** (`layout.tsx:26` —
 * `catch { /* silently succeed — suggestion is best-effort *\/ }`): the thank-you state shows
 * whether or not the POST landed. This is a confirmed product decision, not an oversight — it
 * was raised with the user and reaffirmed ("web also show same Error but needs to do same as
 * web, show thanks sheet after once submitted"). Worth knowing while reading this:
 * `POST /api/feature-suggestions` currently **404s** on the backend (verified 2026-08-31 against
 * `tsb-api.testdevurl.com`; `/api/notifications` on the same host 401s, so the host is right and
 * the route simply isn't implemented). So today every suggestion — on web and here — is silently
 * dropped. When that route is stood up, this code starts working with no change. Do NOT "fix"
 * this by surfacing the error without asking; keeping parity with web is the point.
 */
export function SuggestFeatureSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Reset to a blank form each time the sheet reopens — otherwise reopening after a successful
  // send would land straight back on the thank-you state with no way to write a second idea.
  useEffect(() => {
    if (visible) {
      setText('');
      setSent(false);
      setSending(false);
    }
  }, [visible]);

  const canSend = !!text.trim() && !sending;

  const handleSubmit = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await submitFeatureSuggestion(text);
    } catch {
      // Deliberately swallowed — see this component's doc comment. Matches web's own
      // `catch { /* silently succeed — suggestion is best-effort */ }`.
    }
    setSent(true);
    setSending(false);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissable={!sending}>
      {sent ? (
        <View style={styles.sentBody}>
          <Text style={styles.sentEmoji}>💡</Text>
          <Text
            style={[fonts.display, styles.sentTitle, { color: colors.ink }]}
          >
            Thanks for the idea!
          </Text>
          <Text
            style={[
              fonts.regular,
              styles.sentCopy,
              { fontSize: fontSize.body, color: colors.ink3 },
            ]}
          >
            We read every suggestion and use them to shape the roadmap.
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primaryButton,
              styles.sentButton,
              {
                backgroundColor: colors.gold,
                borderRadius: radius.lg,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[fonts.bold, styles.primaryButtonText]}>Close</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.headerRow}>
            <LinearGradient
              colors={[colors.goldDark, colors.gold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.iconBadge, { borderRadius: radius.md }]}
            >
              <Icon name="lightbulb" size={18} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text
                style={[fonts.display, styles.title, { color: colors.ink }]}
              >
                Suggest a Feature
              </Text>
              <Text
                style={[
                  fonts.regular,
                  styles.subtitle,
                  { fontSize: fontSize.caption, color: colors.ink3 },
                ]}
              >
                What would make The Search Bridge better for you?
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              disabled={sending}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={[
                styles.closeButton,
                {
                  backgroundColor: colors.surfaceSunken,
                  borderRadius: radius.lg,
                },
              ]}
            >
              <X size={16} color={colors.ink2} strokeWidth={1.8} />
            </Pressable>
          </View>

          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={4}
            autoFocus
            editable={!sending}
            placeholder="Describe the feature or improvement..."
            placeholderTextColor={colors.ink3}
            style={[
              styles.textarea,
              {
                backgroundColor: colors.surfaceSunken,
                borderColor: colors.border,
                borderWidth: borderWidth.thin,
                borderRadius: radius.md,
                color: colors.ink,
                fontSize: fontSize.body,
              },
            ]}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={!canSend}
            accessibilityRole="button"
            style={[
              styles.primaryButton,
              {
                backgroundColor: canSend ? colors.gold : colors.surfaceSunken,
                borderRadius: radius.lg,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={[
                  fonts.bold,
                  styles.primaryButtonText,
                  { color: canSend ? '#fff' : colors.ink3 },
                ]}
              >
                Send Suggestion
              </Text>
            )}
          </Pressable>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: { fontSize: 16, letterSpacing: -0.2 },
  subtitle: { marginTop: 1 },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textarea: {
    padding: 12,
    minHeight: 96,
    textAlignVertical: 'top',
    marginTop: 16,
    lineHeight: 19.5,
  },
  primaryButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  primaryButtonText: { fontSize: 13.5, color: '#fff' },
  sentBody: { alignItems: 'center', paddingVertical: 16 },
  sentEmoji: { fontSize: 32, marginBottom: 12 },
  sentTitle: { fontSize: 16, letterSpacing: -0.2, marginBottom: 6 },
  sentCopy: { textAlign: 'center', lineHeight: 19 },
  sentButton: { alignSelf: 'center', paddingHorizontal: 32, marginTop: 20 },
});
