import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { useTheme } from '../../theme';

const MAX_INPUT_HEIGHT = 120;

/** Chapter chat composer — input + send only. No emoji button (device keyboard already has
 * one, same established decision as Messages' `ThreadComposer`) and no attach button (the
 * group-chat send endpoint, `POST /eta/groups/:id/messages`, is text-only — there's no real
 * file/image variant to wire up, unlike DMs). Non-members see a disabled input with a read-only
 * banner instead of the composer row, matching web's `isSelectedGroupMember` gate exactly.
 *
 * Uses `SafeAreaView`'s own `edges={['bottom']}` rather than manually reading
 * `useSafeAreaInsets().bottom` into a `paddingBottom` — a manual `Math.max(insets.bottom, N)`
 * floor still left a visible gap (the page's cream background showing through below the white
 * composer bar, confirmed via screenshot) on at least one device, most likely because
 * `insets.bottom` doesn't always resolve to the real system gesture-nav height in this screen's
 * position in the navigator tree. `SafeAreaView` computes and applies the correct bottom inset
 * itself instead of trusting a hook value read once here. */
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
  const canSend = canPost && value.trim().length > 0;

  if (!canPost) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={[
          styles.readOnly,
          { backgroundColor: colors.surface, borderTopColor: colors.borderSoft, borderTopWidth: borderWidth.thin },
        ]}
      >
        <Text style={[fonts.regular, styles.readOnlyText, { color: colors.ink3 }]}>
          Read-only — join this chapter to send messages.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderTopColor: colors.borderSoft, borderTopWidth: borderWidth.thin },
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
    </SafeAreaView>
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
