import React, { useState } from 'react';
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
import { Mail } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { FormField, PrimaryButton } from '../../components';
import { AuthStackParamList } from '../../navigation/types';
import { AuthHero, BackToLoginButton, EMAIL_PATTERN, SocialButton, authStyles } from './authShared';

/**
 * Forgot Password — mobile port of the "FORGOT PASSWORD SHEET" screen in the
 * auth redesign, `TSBAuthSign up · Login · Forgot.html` (repo root). Reached
 * from Login's "Forgot password?" link. Two states, both local component
 * state (`sent`) rather than a real request — there's no reset-email API
 * yet, so submitting a valid-shaped email just flips to the "sent" view,
 * same Phase 1 placeholder pattern as Login/Signup's submit.
 */

type ForgotPasswordFormValues = {
  email: string;
};

function ForgotPasswordScreen() {
  const { colors, fonts, fontSize, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [toast, setToast] = useState<string | null>(null);

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
    setSentEmail(email);
    setSent(true);
  };

  const resend = () => {
    setToast('Reset link sent again.');
    setTimeout(() => setToast(null), 2400);
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

          {sent ? (
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
                  Check your inbox
                </Text>
                <Text
                  style={[
                    fonts.regular,
                    styles.subtitle,
                    { fontSize: fontSize.authFootnote, color: colors.authMuted, marginTop: 6 },
                  ]}
                >
                  We sent a reset link to{' '}
                  <Text style={[fonts.semibold, { color: colors.ink }]}>{sentEmail}</Text>. The link expires in 30
                  minutes.
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                <PrimaryButton label="Back to login" letterSpacing={0} onPress={goLogin} />
                <SocialButton label="Resend email" onPress={resend} />
              </View>
            </View>
          ) : (
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
                  Enter the email on your Bridge Account and we&apos;ll send you a secure reset link.
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
                label="Send reset link"
                loadingLabel="Sending link…"
                loading={isSubmitting}
                letterSpacing={0}
                onPress={handleSubmit(onValid)}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {toast && (
        <View style={[styles.toastWrap, { bottom: 24 + insets.bottom }]} pointerEvents="none">
          <View style={[styles.toast, { backgroundColor: colors.authPanel }]}>
            <View style={[styles.toastDot, { backgroundColor: colors.goldLight }]} />
            <Text style={[fonts.semibold, { fontSize: fontSize.authFootnote, color: colors.onAccent }]}>{toast}</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    lineHeight: 20,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    maxWidth: 300,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  toastDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});

export default ForgotPasswordScreen;
