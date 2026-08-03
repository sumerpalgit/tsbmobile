import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { FormField, OtpInput, PrimaryButton } from '../../components';
import { AuthStackParamList } from '../../navigation/types';
import { resendForgotPasswordOtp, resetPasswordWithOtp, verifyResetOtp } from '../../api/auth';
import { AuthHero, BackToLoginButton, SocialButton, authStyles } from './authShared';

const OTP_LENGTH = 4;
const RESEND_COOLDOWN_SECONDS = 30;

type Step = 'code' | 'password';

type ResetPasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

/**
 * Reset Password (OTP) — reached right after `ForgotPasswordScreen` submits. Primary
 * password-reset path, same reasoning as `CheckEmailScreen` replacing the link-click email
 * verification flow: a link opened on a different device is a dead end, a code the user reads
 * and types back into this same screen isn't. `ResetPasswordScreen`/`tsb://reset-password`
 * stay in place as a fallback, not removed — this is just the primary path now.
 *
 * Two sub-steps, not one combined form: `code` (OTP only) → `password` (new password fields),
 * shown one at a time via local `step` state — matches the design reference exactly rather than
 * the earlier single-screen layout. The `code` step's "Verify" button calls
 * `POST /api/auth/verify-reset-otp` (`verifyResetOtp`) — a standalone check, separate from the
 * final `resetPasswordWithOtp` submit (`POST /api/auth/reset-password-otp`), which re-validates
 * the code anyway when it's sent along with the new password.
 *
 * Resend calls `POST /api/auth/resend-forgot-password-otp` (`resendForgotPasswordOtp`) — its
 * own dedicated endpoint, distinct from `resendVerification` (email verification's resend).
 */
function ResetPasswordOtpScreen() {
  const { colors, fonts, fontSize, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { params } = useRoute<RouteProp<AuthStackParamList, 'ResetPasswordOtp'>>();

  const [step, setStep] = useState<Step>('code');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: { newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigation.replace('Login'), 3000);
    return () => clearTimeout(timer);
  }, [success, navigation]);

  const goLogin = () => navigation.replace('Login');

  const verifyCode = async () => {
    if (otp.length < OTP_LENGTH) return;
    setOtpError(false);
    setVerifyingCode(true);
    try {
      await verifyResetOtp(params.email, otp);
      setStep('password');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.message
        : 'Something went wrong. Please try again.';
      setOtpError(true);
      setOtp('');
      Toast.show({ type: 'error', text1: 'Incorrect code', text2: message });
    } finally {
      setVerifyingCode(false);
    }
  };

  const onValid = async (data: ResetPasswordFormValues) => {
    try {
      await resetPasswordWithOtp(params.email, otp, data.newPassword);
      setSuccess(true);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.message
        : 'Something went wrong. Please try again.';
      // The code itself may be what's wrong (expired/incorrect) even though this failure
      // surfaces from the password-step submit — send the user back to re-enter it.
      setOtpError(true);
      setOtp('');
      setStep('code');
      Toast.show({ type: 'error', text1: 'Password reset failed', text2: message });
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const result = await resendForgotPasswordOtp(params.email);
      Toast.show({ type: 'success', text1: result.message });
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.message
        : 'Something went wrong. Please try again.';
      Toast.show({ type: 'error', text1: 'Could not resend code', text2: message });
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.authPanel }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.authPanel} />
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <AuthHero topInset={insets.top} />

        <View
          style={[
            authStyles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: 34 + insets.bottom,
              ...elevation('lg'),
            },
          ]}
        >
          {success ? (
            <View style={styles.content}>
              <View style={[styles.iconBadge, { backgroundColor: colors.authIconBadgeBg }]}>
                <CheckCircle2 size={28} color={colors.gold} strokeWidth={1.7} />
              </View>
              <Text
                style={[
                  fonts.authDisplay,
                  styles.center,
                  { fontSize: fontSize.authHeading, color: colors.ink, letterSpacing: -0.3 },
                ]}
              >
                Password reset successful!
              </Text>
              <Text
                style={[fonts.regular, styles.center, { fontSize: fontSize.authFootnote, color: colors.authMuted }]}
              >
                Your password has been updated. Redirecting you to the login page…
              </Text>
            </View>
          ) : step === 'code' ? (
            <>
              <BackToLoginButton onPress={goLogin} />

              <View style={{ gap: 16 }}>
                <View>
                  <Text
                    style={[
                      fonts.authDisplay,
                      { fontSize: fontSize.authHeading, color: colors.ink, letterSpacing: -0.3 },
                    ]}
                  >
                    Reset password
                  </Text>
                  <Text
                    style={[
                      fonts.regular,
                      styles.subtitle,
                      { fontSize: fontSize.authFootnote, color: colors.authMuted, marginTop: 6 },
                    ]}
                  >
                    Enter the {OTP_LENGTH}-digit code we sent to{' '}
                    <Text style={[fonts.semibold, { color: colors.ink }]}>{params.email}</Text>.
                  </Text>
                </View>

                <OtpInput length={OTP_LENGTH} value={otp} onChange={setOtp} error={otpError} />

                <View style={{ gap: 10 }}>
                  <PrimaryButton
                    label="Verify"
                    loadingLabel="Verifying…"
                    loading={verifyingCode}
                    disabled={otp.length < OTP_LENGTH}
                    letterSpacing={0}
                    onPress={verifyCode}
                  />
                  {cooldown > 0 ? (
                    <Text style={[fonts.regular, styles.cooldownText, { color: colors.authMuted }]}>
                      Resend code in {cooldown}s
                    </Text>
                  ) : (
                    <SocialButton
                      label={resending ? 'Resending…' : 'Resend code'}
                      onPress={resending ? () => {} : resend}
                    />
                  )}
                </View>
              </View>
            </>
          ) : (
            <View style={{ gap: 16 }}>
              <View>
                <Text
                  style={[
                    fonts.authDisplay,
                    { fontSize: fontSize.authHeading, color: colors.ink, letterSpacing: -0.3 },
                  ]}
                >
                  Create new password
                </Text>
                <Text
                  style={[
                    fonts.regular,
                    styles.subtitle,
                    { fontSize: fontSize.authFootnote, color: colors.authMuted, marginTop: 6 },
                  ]}
                >
                  Enter your new password below.
                </Text>
              </View>

              <Controller
                control={control}
                name="newPassword"
                rules={{
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Use at least 8 characters' },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    label="New password"
                    icon={<Lock size={16} color={colors.authMuted} strokeWidth={1.75} />}
                    rightElement={
                      <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                        {showPassword ? (
                          <EyeOff size={17} color={colors.authMuted} strokeWidth={1.75} />
                        ) : (
                          <Eye size={17} color={colors.authMuted} strokeWidth={1.75} />
                        )}
                      </Pressable>
                    }
                    error={errors.newPassword?.message}
                    placeholder="Min. 8 characters"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                rules={{
                  required: 'Please confirm your password',
                  validate: (value, formValues) => value === formValues.newPassword || 'Passwords do not match',
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    label="Confirm new password"
                    icon={<Lock size={16} color={colors.authMuted} strokeWidth={1.75} />}
                    rightElement={
                      <Pressable onPress={() => setShowConfirmPassword(v => !v)} hitSlop={8}>
                        {showConfirmPassword ? (
                          <EyeOff size={17} color={colors.authMuted} strokeWidth={1.75} />
                        ) : (
                          <Eye size={17} color={colors.authMuted} strokeWidth={1.75} />
                        )}
                      </Pressable>
                    }
                    error={errors.confirmPassword?.message}
                    placeholder="Re-enter password"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <PrimaryButton
                label="Reset password"
                loadingLabel="Resetting…"
                loading={isSubmitting}
                letterSpacing={0}
                onPress={handleSubmit(onValid)}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    lineHeight: 20,
  },
  cooldownText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  content: {
    gap: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  center: {
    textAlign: 'center',
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ResetPasswordOtpScreen;
