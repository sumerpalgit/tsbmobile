import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { useTheme } from '../../theme';
import { changePassword } from '../../api/settings';

/** Bottom-sheet Modal for Account & Security's "Change password" — same `Modal` + backdrop-
 * `Pressable` chrome as `ActionSheet.tsx` (that one is items-only, this needs its own form-field
 * body). Validation matches web exactly: `new === confirm && new.length >= 8` — no complexity
 * rule. The mockup's "with a number and a symbol" copy is a hint only, not enforced by the real
 * backend either.
 *
 * Keyboard handling is manual (`keyboardHeight` state + `marginBottom`), not
 * `KeyboardAvoidingView` — same root cause as `ContributeResourceSheet.tsx`'s own doc comment:
 * `KeyboardAvoidingView`'s Android resize behavior doesn't reliably apply inside a `Modal`, so the
 * bottom-anchored sheet just sat where it was and the keyboard covered the lower fields. Since
 * this sheet is fixed-height (3 short fields, no scrolling needed), pushing the whole sheet up by
 * the keyboard's own height via `marginBottom` is simpler than a scrollable body here. */
export function ChangePasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setCurrent('');
    setNext('');
    setConfirm('');
    setShowCurrent(false);
    setShowNext(false);
    setShowConfirm(false);
  }, [visible]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates?.height ?? 0));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSubmit = async () => {
    if (!current || !next || !confirm) {
      Toast.show({ type: 'error', text1: 'Fill in all fields' });
      return;
    }
    if (next !== confirm) {
      Toast.show({ type: 'error', text1: 'New passwords do not match' });
      return;
    }
    if (next.length < 8) {
      Toast.show({ type: 'error', text1: 'Password must be at least 8 characters.' });
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(current, next);
      Toast.show({ type: 'success', text1: 'Password updated' });
      onClose();
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error ?? err.message : 'Please try again.';
      Toast.show({ type: 'error', text1: 'Could not update password', text2: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={submitting ? undefined : onClose}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.sheet,
            { marginBottom: keyboardHeight, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl + 6, borderTopRightRadius: radius.xxl + 6 },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Change password</Text>

          <PasswordField label="Current password" value={current} onChangeText={setCurrent} visible={showCurrent} onToggleVisible={() => setShowCurrent(v => !v)} />
          <PasswordField
            label="New password"
            value={next}
            onChangeText={setNext}
            visible={showNext}
            onToggleVisible={() => setShowNext(v => !v)}
            hint="At least 8 characters, with a number and a symbol."
          />
          <PasswordField label="Confirm new password" value={confirm} onChangeText={setConfirm} visible={showConfirm} onToggleVisible={() => setShowConfirm(v => !v)} />

          <View style={styles.footer}>
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
              style={({ pressed }) => [styles.submitButton, { backgroundColor: '#182E43', borderRadius: radius.lg, opacity: submitting ? 0.7 : 1 }, pressed && styles.pressed]}
            >
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[fonts.bold, { fontSize: fontSize.body, color: '#fff' }]}>Update password</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  visible,
  onToggleVisible,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  hint?: string;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  return (
    <View style={{ gap: 7, marginTop: 14 }}>
      <Text style={[fonts.semibold, { fontSize: fontSize.small + 1, color: colors.ink }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          style={[fonts.regular, styles.input, { color: colors.ink, fontSize: fontSize.body }]}
        />
        <Pressable onPress={onToggleVisible} hitSlop={8}>
          {visible ? <EyeOff size={16} color={colors.ink3} strokeWidth={1.7} /> : <Eye size={16} color={colors.ink3} strokeWidth={1.7} />}
        </Pressable>
      </View>
      {!!hint && <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, lineHeight: 15 }]}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10,16,24,0.5)',
  },
  sheet: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 46,
    paddingHorizontal: 13,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
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
    opacity: 0.7,
  },
});
