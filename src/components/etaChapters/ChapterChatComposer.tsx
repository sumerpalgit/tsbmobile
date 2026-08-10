import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { useTheme } from '../../theme';

const MAX_INPUT_HEIGHT = 120;

/** Chapter chat composer — input + send only. No emoji button (device keyboard already has
 * one, same established decision as Messages' `ThreadComposer`) and no attach button (the
 * group-chat send endpoint, `POST /eta/groups/:id/messages`, is text-only — there's no real
 * file/image variant to wire up, unlike DMs). Non-members see a disabled input with a read-only
 * banner instead of the composer row, matching web's `isSelectedGroupMember` gate exactly.
 *
 * Pads for the bottom safe-area inset (home indicator / gesture-nav area) itself — without it,
 * the composer's own background stops at a fixed `paddingBottom` and the screen's page
 * background shows through below it as a visible gap (confirmed on-device via screenshot). */
export function ChapterChatComposer({
  value,
  onChangeText,
  onSend,
  canPost,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  canPost: boolean;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const canSend = canPost && value.trim().length > 0;

  if (!canPost) {
    return (
      <View
        style={[
          styles.readOnly,
          { paddingBottom: Math.max(insets.bottom, 14), backgroundColor: colors.surface, borderTopColor: colors.borderSoft, borderTopWidth: borderWidth.thin },
        ]}
      >
        <Text style={[fonts.regular, styles.readOnlyText, { color: colors.ink3 }]}>
          Read-only — join this chapter to send messages.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 10), backgroundColor: colors.surface, borderTopColor: colors.borderSoft, borderTopWidth: borderWidth.thin },
      ]}
    >
      <View style={[styles.inputWrap, { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xxl, backgroundColor: colors.surfaceSunken }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Type your message…"
          placeholderTextColor={colors.ink3}
          multiline
          style={[fonts.regular, styles.input, { fontSize: fontSize.ui, color: colors.ink, maxHeight: MAX_INPUT_HEIGHT }]}
        />
      </View>
      <Pressable
        onPress={onSend}
        disabled={!canSend}
        accessibilityLabel="Send message"
        style={[styles.sendButton, { borderRadius: radius.xl, backgroundColor: canSend ? colors.gold : colors.surfaceSunken }]}
      >
        <Send size={17} color={canSend ? '#fff' : colors.ink3} strokeWidth={1.9} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 10,
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  input: {
    paddingVertical: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnly: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  readOnlyText: {
    fontSize: 12.5,
  },
});
