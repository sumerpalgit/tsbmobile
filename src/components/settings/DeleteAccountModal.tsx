import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { useTheme } from '../../theme';
import { deleteAccount } from '../../api/settings';
import { useAuth } from '../../store/AuthContext';

const CONFIRM_WORD = 'DELETE';

/** Danger Zone's "Delete account" — same visual chrome as `ConfirmDialog.tsx` (centered card,
 * eyebrow + close, backdrop), but not an extension of it: this needs a "type DELETE" `TextInput`
 * gating the destructive button, a different shape from `ConfirmDialog`'s plain Yes/No. Matches
 * web's real gate exactly — case-sensitive, must equal the literal string "DELETE". On success,
 * calls `useAuth().logout()` (matching web's own `signOut()` + redirect-to-login). */
export function DeleteAccountModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, fonts, fontSize, radius, borderWidth, elevation } = useTheme();
  const { logout } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) setConfirmText('');
  }, [visible]);

  const canDelete = confirmText === CONFIRM_WORD && !submitting;

  const handleDelete = async () => {
    if (!canDelete) return;
    setSubmitting(true);
    try {
      await deleteAccount();
      Toast.show({ type: 'success', text1: 'Account deleted' });
      onClose();
      logout();
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error ?? err.message : 'Please try again.';
      Toast.show({ type: 'error', text1: 'Could not delete account', text2: message });
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={submitting ? undefined : onClose}>
      <Pressable style={styles.backdrop} onPress={submitting ? undefined : onClose}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.card,
            elevation('lg'),
            { backgroundColor: colors.surface, borderRadius: radius.xxl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin },
          ]}
        >
          <View style={styles.eyebrowRow}>
            <Text style={[fonts.bold, styles.eyebrow, { color: colors.danger }]}>DELETE ACCOUNT</Text>
            <Pressable onPress={submitting ? undefined : onClose} hitSlop={8}>
              <X size={16} color={colors.ink3} strokeWidth={1.8} />
            </Pressable>
          </View>
          <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Are you sure?</Text>
          <Text style={[fonts.regular, styles.message, { fontSize: fontSize.body, color: colors.ink2 }]}>
            This permanently removes your account and data. This can&apos;t be undone.
          </Text>

          <Text style={[fonts.semibold, styles.inputLabel, { fontSize: fontSize.small + 1, color: colors.ink }]}>
            Type <Text style={{ color: colors.danger }}>{CONFIRM_WORD}</Text> to confirm
          </Text>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={CONFIRM_WORD}
            placeholderTextColor={colors.ink3}
            style={[
              fonts.semibold,
              styles.input,
              { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body },
            ]}
          />

          <View style={styles.actions}>
            <Pressable
              onPress={submitting ? undefined : onClose}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[fonts.semibold, styles.buttonText, { color: colors.ink2 }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              disabled={!canDelete}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                { backgroundColor: colors.danger, borderRadius: radius.lg, opacity: canDelete ? 1 : 0.5 },
                pressed && canDelete && styles.pressed,
              ]}
            >
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[fonts.bold, styles.buttonText, { color: '#fff' }]}>Delete account</Text>}
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
  inputLabel: {
    marginTop: 16,
    marginBottom: 7,
  },
  input: {
    height: 46,
    paddingHorizontal: 13,
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
