import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme';

/**
 * In-app confirm dialog — replaces the native OS `Alert.alert` previously used for RSVP/cancel
 * confirmation. Centered card over a backdrop, same visual language (radius/elevation/tokens) as
 * the rest of My Events' overlays, instead of the platform's own alert chrome, which looks out of
 * place next to the app's own design.
 */
export function ConfirmDialog({
  visible,
  eyebrow,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  confirmColor,
  onConfirm,
  onCancel,
  onShow,
}: {
  visible: boolean;
  /** Small caps label above the title (e.g. "DELETE MESSAGE") with a top-right close (×) button
   * that also calls `onCancel` — opt-in, existing callers are unaffected when omitted. */
  eyebrow?: string;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Confirm button renders red instead of gold — for actions like cancelling an RSVP. */
  destructive?: boolean;
  /** Overrides the confirm button's background — for actions that need neither the default gold
   * nor red (e.g. ETA Chapters' "Join Chapter" confirm, which matches web's real navy button).
   * Takes priority over `destructive` when both are set. */
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Fires once the native modal has actually finished presenting — the caller uses this to
   * clear the triggering button's own loading spinner (`EventListCard`'s `pendingAction`) at the
   * precise moment this dialog becomes visible, not just when it was requested. */
  onShow?: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth, elevation } = useTheme();

  return (
    // `statusBarTranslucent` for consistency with `EventDetailView.tsx`/`EventsFilterPage.tsx` —
    // this dialog is centered rather than top-padded, so it's lower-risk, but the same
    // inconsistent-coordinate-space class of bug applies to any Modal without it.
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onCancel} onShow={onShow}>
      <Pressable style={[styles.backdrop, { backgroundColor: 'rgba(24,46,67,0.44)' }]} onPress={onCancel}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.card,
            elevation('lg'),
            { backgroundColor: colors.surface, borderRadius: radius.xxl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin },
          ]}
        >
          {eyebrow ? (
            <View style={styles.eyebrowRow}>
              <Text style={[fonts.bold, styles.eyebrow, { color: colors.ink3 }]}>{eyebrow}</Text>
              <Pressable onPress={onCancel} hitSlop={8}>
                <X size={16} color={colors.ink3} strokeWidth={1.8} />
              </Pressable>
            </View>
          ) : null}
          <Text style={[fonts.display, styles.title, { color: colors.ink }]}>{title}</Text>
          <Text style={[fonts.regular, styles.message, { fontSize: fontSize.body, color: colors.ink2 }]}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[fonts.semibold, styles.buttonText, { color: colors.ink2 }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                { backgroundColor: confirmColor ?? (destructive ? colors.danger : colors.gold), borderRadius: radius.lg },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[fonts.bold, styles.buttonText, { color: '#fff' }]}>{confirmLabel}</Text>
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
  },
  card: {
    width: '100%',
    maxWidth: 340,
    padding: 20,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  eyebrow: {
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 19,
    letterSpacing: -0.2,
  },
  message: {
    lineHeight: 20,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
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
