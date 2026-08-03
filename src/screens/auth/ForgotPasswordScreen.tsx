import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { Mail } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { FormField, PrimaryButton } from '../../components';
import { AuthStackParamList } from '../../navigation/types';
import { forgotPassword } from '../../api/auth';
import { AuthHero, BackToLoginButton, EMAIL_PATTERN, authStyles } from './authShared';

/**
 * Forgot Password — mobile port of the "FORGOT PASSWORD SHEET" screen in the
 * auth redesign, `TSBAuthSign up · Login · Forgot.html` (repo root). Reached
 * from Login's "Forgot password?" link.
 *
 * Matches `webSrc/src/app/auth/forgot-password/page.tsx`: submitting calls
 * `POST /api/auth/forgot-password` with `{ email }`, no token involved at
 * this step. On success, routes straight to `ResetPasswordOtp` (the code +
 * new-password screen) instead of showing its own "check your inbox" panel —
 * the OTP entry, resend, and cooldown all live there now, same as `CheckEmailScreen`
 * owns that for email verification rather than `SignupScreen`.
 */

type ForgotPasswordFormValues = {
  email: string;
};

function ForgotPasswordScreen() {
  const { colors, fonts, fontSize, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: '' },
    mode: 'onSubmit',
  });

  // Reached only as a modal pushed from Login, so goBack() properly
  // dismisses it — navigate('Login') would push a duplicate Login on top
  // instead, the same stack-growth bug this screen's sibling links just got
  // fixed for.
  const goLogin = () => navigation.goBack();

  const onValid = async ({ email }: ForgotPasswordFormValues) => {
    try {
      await forgotPassword(email);
      navigation.replace('ResetPasswordOtp', { email });
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.message
        : 'Something went wrong. Please try again.';
      Toast.show({ type: 'error', text1: 'Could not send reset code', text2: message });
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

        {/* White bottom sheet — 20px top padding here vs. 24px on Login/Signup, per the design file. */}
        <View
          style={[
            authStyles.sheet,
            {
              backgroundColor: colors.surface,
              paddingTop: 20,
              paddingBottom: 34 + insets.bottom,
              ...elevation('lg'),
            },
          ]}
        >
          <BackToLoginButton onPress={goLogin} />

          <View style={{ gap: 16 }}>
            <View>
              <Text
                style={[
                  fonts.authDisplay,
                  { fontSize: fontSize.authHeading, color: colors.ink, letterSpacing: -0.3 },
                ]}
              >
                Forgot password?
              </Text>
              <Text
                style={[
                  fonts.regular,
                  styles.subtitle,
                  { fontSize: fontSize.authFootnote, color: colors.authMuted, marginTop: 6, maxWidth: 290 },
                ]}
              >
                Enter the email on your Bridge Account and we&apos;ll send you a reset code.
              </Text>
            </View>

            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Professional email is required',
                pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="Professional Email"
                  icon={<Mail size={16} color={colors.authMuted} strokeWidth={1.75} />}
                  error={errors.email?.message}
                  placeholder="you@company.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <PrimaryButton
              label="Send reset code"
              loadingLabel="Sending code…"
              loading={isSubmitting}
              letterSpacing={0}
              onPress={handleSubmit(onValid)}
            />
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
});

export default ForgotPasswordScreen;
