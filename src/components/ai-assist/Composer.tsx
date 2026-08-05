import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Paperclip, Send, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../theme';

const MAX_INPUT_HEIGHT = 120;

/** Message composer — auto-growing input, Library shortcut, PDF attach button, send. Matches the
 * mockup's composer row. `Enter` submits on hardware keyboards (web parity); the on-screen
 * keyboard's return key is left as a newline since chat messages are often multi-line. */
export function Composer({
  value,
  onChangeText,
  onSend,
  onOpenLibrary,
  onAttach,
  isUploadingDocument,
  disabled,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onOpenLibrary: () => void;
  onAttach: () => void;
  isUploadingDocument: boolean;
  disabled: boolean;
}) {
  const { colors, fonts, fontSize, radius, borderWidth, elevation } = useTheme();
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderTopColor: colors.borderSoft, borderTopWidth: borderWidth.thin },
      ]}
    >
      <View
        style={[
          styles.card,
          elevation('sm'),
          { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xxl, backgroundColor: colors.surface },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Ask anything about M&A, ETA, deals…"
          placeholderTextColor={colors.ink3}
          multiline
          style={[fonts.regular, styles.input, { fontSize: fontSize.ui, color: colors.ink, maxHeight: MAX_INPUT_HEIGHT }]}
        />
        <View style={styles.row}>
          <Pressable
            onPress={onOpenLibrary}
            style={({ pressed }) => [
              styles.libraryButton,
              {
                borderColor: colors.border,
                borderWidth: borderWidth.thin,
                borderRadius: radius.lg,
                backgroundColor: pressed ? colors.cream : colors.surfaceSunken,
              },
            ]}
          >
            <Sparkles size={13} color={colors.goldDark} strokeWidth={1.6} />
            <Text style={[fonts.semibold, styles.libraryText, { color: colors.ink2 }]}>Library</Text>
          </Pressable>

          <Pressable
            onPress={onAttach}
            disabled={isUploadingDocument}
            accessibilityLabel="Attach a PDF"
            style={({ pressed }) => [
              styles.iconButton,
              {
                borderColor: colors.border,
                borderWidth: borderWidth.thin,
                borderRadius: radius.lg,
                backgroundColor: pressed ? colors.cream : colors.surfaceSunken,
                opacity: isUploadingDocument ? 0.6 : 1,
              },
            ]}
          >
            {isUploadingDocument ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : (
              <Paperclip size={16} color={colors.ink2} strokeWidth={1.5} />
            )}
          </Pressable>

          <View style={{ flex: 1 }} />

          <Pressable
            onPress={onSend}
            disabled={!canSend}
            accessibilityLabel="Send"
            style={[
              styles.sendButton,
              {
                borderRadius: radius.lg,
                backgroundColor: canSend ? colors.gold : colors.surfaceSunken,
              },
            ]}
          >
            <Send size={17} color={canSend ? '#fff' : colors.ink3} strokeWidth={1.9} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 10,
  },
  card: {
    padding: 12,
    paddingBottom: 10,
  },
  input: {
    paddingTop: 2,
    paddingBottom: 0,
    minHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 11,
  },
  libraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 11,
  },
  libraryText: {
    fontSize: 11.5,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
