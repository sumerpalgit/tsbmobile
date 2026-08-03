import React, { useEffect, useState } from 'react';
import { Platform, KeyboardAvoidingView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { Mail } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { OtpInput, PrimaryButton } from '../../components';
import { AuthStackParamList } from '../../navigation/types';
import { resendVerification, verifyEmailOtp } from '../../api/auth';
import { AuthHero, BackToLoginButton, SocialButton, authStyles } from './authShared';

const OTP_LENGTH = 4;
const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Check Email — reached after Signup registers the account. Register returns no token:
 * the account needs email verification before it can log in.
 *
 * OTP-based rather than the link-click flow (`VerifyEmailScreen`/`tsb://verify-email`):
 * a link opened on a different device than the one running this app is a dead end with no
 * fallback (see the tsb:// deep-linking discussion — Universal Links need a real https
 * domain we don't have yet, and a bare custom-scheme link has no browser fallback at all).
 * A code the user reads in their inbox and types back into this same screen sidesteps that
 * entirely — no link, no device handoff, no dead end. `VerifyEmailScreen`/`tsb://` stay in
 * place as-is (not removed), this is just the primary path now.
 *
 * `verifyEmailOtp` posts to the confirmed `POST /api/auth/verify-otp` (`src/api/auth.ts`);
 * the resend action reuses the existing `resendVerification`. The backend picks OTP vs. the
 * link-based flow off `register`'s `platform` field, sent automatically on every register call
 * from this app (`Platform.OS`, not something this screen or `SignupScreen` need to pass).
 */
function CheckEmailScreen() {
  const { colors, fonts, fontSize, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { params } = useRoute<RouteProp<AuthStackParamList, 'CheckEmail'>>();

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const goLogin = () => navigation.replace('Login');

  const verify = async () => {
    if (otp.length < OTP_LENGTH) return;
    setVerifying(true);
    setOtpError(false);
    try {
      const result = await verifyEmailOtp(params.email, otp);
      Toast.show({ type: 'success', text1: result.message ?? 'Email verified' });
      // Confirmed: the backend logs the account in on success (`verifyEmailOtp` already
      // stored the returned token). A freshly-verified account has never completed
      // Onboarding, so go straight there — same reasoning as LoginScreen's step2 branch:
      // don't call AuthContext's login() yet (that flips isAuthenticated and unmounts
      // AuthNavigator, taking Onboarding down with it); Onboarding's own completion step
      // calls login() once it's actually done. Falls back to Login if no token came back,
      // in case that ever isn't the case.
      navigation.replace(result.token ? 'Onboarding' : 'Login');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.message
        : 'Something went wrong. Please try again.';
      setOtpError(true);
      setOtp('');
      Toast.show({ type: 'error', text1: 'Incorrect code', text2: message });
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const result = await resendVerification(params.email);
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
          <BackToLoginButton onPress={goLogin} />

          <View style={{ gap: 16 }}>
            <View style={[styles.iconBadge, { backgroundColor: colors.authIconBadgeBg }]}>
              <Mail size={24} color={colors.gold} strokeWidth={1.7} />
            </View>

            <View>
              <Text
                style={[
                  fonts.authDisplay,
                  { fontSize: fontSize.authHeading, color: colors.ink, letterSpacing: -0.3 },
                ]}
              >
                Verify your email
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
                loading={verifying}
                disabled={otp.length < OTP_LENGTH}
                letterSpacing={0}
                onPress={verify}
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
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CheckEmailScreen;
