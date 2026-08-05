import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../theme';

/** Centered rename dialog — same `ConfirmDialog`-style chrome (`src/components/events/`) but
 * with a text input. The mockup's own rename entry point is toast-only; this ports web's real
 * rename modal (`showRenameModal`/`confirmRename` in `ai-assist/page.tsx`) with that chrome. */
export function RenameDialog({
  visible,
  initialValue,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  initialValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth, elevation } = useTheme();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const canConfirm = value.trim().length > 0;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.card,
            elevation('lg'),
            { backgroundColor: colors.surface, borderRadius: radius.xxl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin },
          ]}
        >
          <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Rename chat</Text>

          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Chat name"
            placeholderTextColor={colors.ink3}
            autoFocus
            style={[
              fonts.regular,
              styles.input,
              {
                fontSize: fontSize.ui,
                color: colors.ink,
                borderColor: colors.border,
                borderWidth: borderWidth.thin,
                borderRadius: radius.lg,
                backgroundColor: colors.surfaceSunken,
              },
            ]}
          />

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[fonts.semibold, styles.buttonText, { color: colors.ink2 }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => canConfirm && onConfirm(value.trim())}
              disabled={!canConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                { backgroundColor: colors.gold, borderRadius: radius.lg, opacity: canConfirm ? 1 : 0.5 },
                pressed && canConfirm && styles.pressed,
              ]}
            >
              <Text style={[fonts.bold, styles.buttonText, { color: '#fff' }]}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(24,46,67,0.44)',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    padding: 20,
  },
  title: {
    fontSize: 19,
    letterSpacing: -0.2,
  },
  input: {
    height: 46,
    paddingHorizontal: 13,
    marginTop: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  button: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1.2,
  },
  buttonText: {
    fontSize: 13.5,
  },
  pressed: {
    opacity: 0.65,
  },
});
