import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Mail } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { useTheme } from '../../theme';
import { changeEmail, verifyEmailChangeOtp } from '../../api/settings';
import { ME_QUERY_KEY } from '../../api/queryKeys';
import { OtpInput } from '../OtpInput';

const OTP_LENGTH = 4;
const RESEND_COOLDOWN_SECONDS = 30;

/** Bottom-sheet Modal for Account & Security's "Change email" — OTP-based, matching Signup
 * (`CheckEmailScreen.tsx`) and Forgot Password (`ResetPasswordOtpScreen.tsx`), both already
 * OTP-based on mobile (a "click the link in your email" flow doesn't work well on mobile — see
 * the team message flagging this, and the backend spec shared 2026-08-14 in response).
 *
 * Two real calls, per that spec: `changeEmail(oldEmail, newEmail)` (`POST /settings/
 * change-email`, now sends `platform: Platform.OS` so the backend sends a code instead of a
 * link) starts it; `verifyEmailChangeOtp(code)` (`POST /settings/verify-email-change-otp`)
 * completes it and is what actually updates the account's email server-side — this sheet
 * invalidates `useMe()`'s query on that success so the new email shows up on Account & Security
 * immediately. No separate resend endpoint exists — "Resend code" just re-fires `changeEmail`
 * with the same emails, same as the spec's own note; cooldown/timer copied verbatim from
 * `CheckEmailScreen.tsx`'s established pattern for the other two OTP flows.
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
  const queryClient = useQueryClient();

  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setNewEmail('');
    setEmailError('');
    setStep('form');
    setOtp('');
    setOtpError(false);
    setCooldown(0);
  }, [visible]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

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
      setEmailError('Enter a new email address');
      return;
    }
    setEmailError('');
    setSubmitting(true);
    try {
      const result = await changeEmail(currentEmail, newEmail.trim());
      Toast.show({ type: 'success', text1: result?.message ?? 'Verification code sent' });
      setStep('otp');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      // Shown inline below the New Email field, not just as a Toast — every error this endpoint
      // returns (already in use, malformed, mismatch) is about that one field specifically, and a
      // Toast floating over the sheet read as disconnected from what actually needs fixing.
      const message = axios.isAxiosError(err) ? err.response?.data?.error ?? err.response?.data?.message ?? err.message : 'Please try again.';
      setEmailError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < OTP_LENGTH) return;
    setVerifying(true);
    setOtpError(false);
    try {
      const result = await verifyEmailChangeOtp(otp);
      Toast.show({ type: 'success', text1: result?.message ?? 'Email updated successfully' });
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      onClose();
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error ?? err.response?.data?.message ?? err.message : 'Please try again.';
      setOtpError(true);
      setOtp('');
      Toast.show({ type: 'error', text1: 'Verification failed', text2: message });
    } finally {
      setVerifying(false);
    }
  };

  // No separate resend endpoint (per the backend spec) — re-firing `changeEmail` with the same
  // emails generates a fresh code and invalidates the old one.
  const handleResend = async () => {
    setResending(true);
    try {
      const result = await changeEmail(currentEmail, newEmail.trim());
      Toast.show({ type: 'success', text1: result?.message ?? 'Verification code sent' });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp('');
      setOtpError(false);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error ?? err.response?.data?.message ?? err.message : 'Please try again.';
      Toast.show({ type: 'error', text1: 'Could not resend code', text2: message });
    } finally {
      setResending(false);
    }
  };

  return (
    <Pressable style={styles.backdrop} onPress={submitting || verifying || resending ? undefined : onClose}>
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
              <OtpInput length={OTP_LENGTH} value={otp} onChange={setOtp} error={otpError} />
            </View>

            <Pressable
              onPress={handleVerify}
              disabled={otp.length < OTP_LENGTH || verifying}
              style={({ pressed }) => [
                styles.submitButton,
                styles.otpVerifyButton,
                { backgroundColor: '#182E43', borderRadius: radius.lg, opacity: otp.length < OTP_LENGTH || verifying ? 0.7 : 1 },
                pressed && styles.pressed,
              ]}
            >
              {verifying ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[fonts.bold, { fontSize: fontSize.body, color: '#fff' }]}>Verify</Text>}
            </Pressable>

            {cooldown > 0 ? (
              <Text style={[fonts.regular, styles.cooldownText, { color: colors.ink3 }]}>Resend code in {cooldown}s</Text>
            ) : (
              <Pressable onPress={resending ? undefined : handleResend} hitSlop={8} style={{ marginTop: 16 }}>
                <Text style={[fonts.semibold, styles.resendText, { color: colors.gold }]}>{resending ? 'Resending…' : 'Resend code'}</Text>
              </Pressable>
            )}
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
                onChangeText={text => { setNewEmail(text); if (emailError) setEmailError(''); }}
                placeholder="new@example.com"
                placeholderTextColor={colors.ink3}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={[fonts.regular, styles.input, { backgroundColor: colors.surfaceSunken, borderColor: emailError ? colors.danger : colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body }]}
              />
              {emailError ? (
                <Text style={[fonts.regular, { fontSize: fontSize.small, color: colors.danger }]}>{emailError}</Text>
              ) : null}
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
  // `otpWrap`'s `alignItems: 'center'` (needed to center the icon/title/OTP boxes) also makes
  // this button shrink to fit its own text instead of stretching full-width like every other
  // button in this sheet — `alignSelf: 'stretch'` overrides that just for this one child.
  otpVerifyButton: {
    alignSelf: 'stretch',
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
  cooldownText: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
