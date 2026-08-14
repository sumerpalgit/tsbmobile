import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { useTheme } from '../../theme';
import { changeEmail } from '../../api/settings';
import { OtpInput } from '../OtpInput';

const OTP_LENGTH = 4;

/** Bottom-sheet Modal for Account & Security's "Change email". `POST /settings/change-email`
 * (already built in Phase 1) is unchanged — still just triggers the send. What happens after is
 * being migrated from web's link-based flow to an OTP flow instead, matching Signup
 * (`CheckEmailScreen.tsx`) and Forgot Password (`ResetPasswordOtpScreen.tsx`), both already
 * OTP-based on mobile — a "click the link in your email" flow doesn't work well on mobile (see
 * the team message flagging this).
 *
 * **UI-only for now, per explicit instruction — there is no verify-code endpoint yet.** Once
 * "Send Verification" succeeds, this swaps to an `OtpInput` (`OTP_LENGTH = 4`, same length as
 * the other two OTP flows) + "Verify" button, but the button doesn't call anything real yet —
 * see `handleVerify`'s own comment. Wire it to the real endpoint once the backend team ships one;
 * nothing else in this file should need to change at that point.
 *
 * Same chrome/keyboard-handling/SafeAreaProvider-nesting recipe as `ChangePasswordSheet.tsx` —
 * see that file's doc comment for the full root-cause writeup on both. */
export function ChangeEmailSheet({ visible, currentEmail, onClose }: { visible: boolean; currentEmail: string; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaProvider>
        <ChangeEmailSheetContent visible={visible} currentEmail={currentEmail} onClose={onClose} />
      </SafeAreaProvider>
    </Modal>
  );
}

function ChangeEmailSheetContent({ visible, currentEmail, onClose }: { visible: boolean; currentEmail: string; onClose: () => void }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const [newEmail, setNewEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setNewEmail('');
    setStep('form');
    setOtp('');
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
    if (!newEmail.trim()) {
      Toast.show({ type: 'error', text1: 'Enter a new email address' });
      return;
    }
    setSubmitting(true);
    try {
      await changeEmail(newEmail.trim());
      setStep('otp');
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error ?? err.message : 'Please try again.';
      Toast.show({ type: 'error', text1: 'Could not send verification', text2: message });
    } finally {
      setSubmitting(false);
    }
  };

  // No verify-code endpoint exists yet (flagged to the backend team — see this file's doc
  // comment) — this is UI-only until one ships. Keeps the same loading-state shape a real
  // submit would use so wiring the real call later is a drop-in swap, not a rebuild.
  const handleVerify = async () => {
    if (otp.length < OTP_LENGTH) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      Toast.show({ type: 'info', text1: 'Verification not connected yet', text2: 'Waiting on the backend OTP endpoint.' });
    }, 400);
  };

  return (
    <Pressable style={styles.backdrop} onPress={submitting || verifying ? undefined : onClose}>
      <Pressable
        onPress={e => e.stopPropagation()}
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl + 6, borderTopRightRadius: radius.xxl + 6 },
          { marginBottom: keyboardHeight },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />

        {step === 'otp' ? (
          <View style={styles.otpWrap}>
            <View style={[styles.otpIconWell, { backgroundColor: colors.chip }]}>
              <Mail size={22} color={colors.goldDark} strokeWidth={1.6} />
            </View>
            <Text style={[fonts.display, styles.otpTitle, { color: colors.ink }]}>Enter verification code</Text>
            <Text style={[fonts.regular, styles.otpMessage, { color: colors.ink3 }]}>
              Enter the {OTP_LENGTH}-digit code we sent to{' '}
              <Text style={[fonts.semibold, { color: colors.ink2 }]}>{newEmail}</Text>.
            </Text>

            <View style={{ marginTop: 20 }}>
              <OtpInput length={OTP_LENGTH} value={otp} onChange={setOtp} />
            </View>

            <Pressable
              onPress={handleVerify}
              disabled={otp.length < OTP_LENGTH || verifying}
              style={({ pressed }) => [
                styles.submitButton,
                { backgroundColor: '#182E43', borderRadius: radius.lg, opacity: otp.length < OTP_LENGTH || verifying ? 0.7 : 1 },
                pressed && styles.pressed,
              ]}
            >
              {verifying ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[fonts.bold, { fontSize: fontSize.body, color: '#fff' }]}>Verify</Text>}
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Change email</Text>

            <View style={{ gap: 7, marginTop: 14 }}>
              <Text style={[fonts.semibold, { fontSize: fontSize.small + 1, color: colors.ink }]}>Current email</Text>
              <View style={[styles.readonlyField, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
                <Text style={[fonts.regular, { fontSize: fontSize.body, color: colors.ink3 }]} numberOfLines={1}>
                  {currentEmail}
                </Text>
              </View>
            </View>

            <View style={{ gap: 7, marginTop: 14 }}>
              <Text style={[fonts.semibold, { fontSize: fontSize.small + 1, color: colors.ink }]}>New email</Text>
              <TextInput
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="new@example.com"
                placeholderTextColor={colors.ink3}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={[fonts.regular, styles.input, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body }]}
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [styles.submitButton, { backgroundColor: '#182E43', borderRadius: radius.lg, opacity: submitting ? 0.7 : 1 }, pressed && styles.pressed]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Mail size={15} color="#fff" strokeWidth={1.8} />
                  <Text style={[fonts.bold, { fontSize: fontSize.body, color: '#fff' }]}>Send Verification</Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </Pressable>
    </Pressable>
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
  readonlyField: {
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  input: {
    height: 46,
    paddingHorizontal: 13,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    marginTop: 20,
  },
  otpWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  otpIconWell: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  otpTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  otpMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  pressed: {
    opacity: 0.7,
  },
});
