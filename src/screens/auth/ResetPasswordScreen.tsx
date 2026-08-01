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
import { FormField, PrimaryButton } from '../../components';
import { AuthStackParamList } from '../../navigation/types';
import { resetPassword } from '../../api/auth';
import { AuthHero, authStyles } from './authShared';

type ResetPasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

/**
 * Reset Password — reached via the tsb://reset-password?token=... deep link
 * when the user taps the link in their password-reset email. Mirrors
 * `webSrc/src/app/auth/reset-password/page.tsx`: no token means an
 * immediate error (matches web's `useEffect` toast on missing token),
 * submitting fires `POST /api/auth/reset-password` with `{ token,
 * newPassword }` once, and success shows a confirmation panel before
 * routing to Login after 3s (same delay as web's redirect).
 */
function ResetPasswordScreen() {
  const { colors, fonts, fontSize, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { params } = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const token = params?.token;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: { newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!token) {
      Toast.show({ type: 'error', text1: 'Invalid or missing reset token.' });
    }
  }, [token]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigation.replace('Login'), 3000);
    return () => clearTimeout(timer);
  }, [success, navigation]);

  const onValid = async (data: ResetPasswordFormValues) => {
    if (!token) {
      Toast.show({ type: 'error', text1: 'Missing reset token.' });
      return;
    }

    try {
      await resetPassword(token, data.newPassword);
      setSuccess(true);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.message
        : 'Something went wrong. Please try again.';
      Toast.show({ type: 'error', text1: 'Password reset failed', text2: message });
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
          ) : (
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

export default ResetPasswordScreen;
