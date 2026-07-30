import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { Check, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useAuth } from '../../store/AuthContext';
import { FormField, PrimaryButton } from '../../components';
import { AuthStackParamList } from '../../navigation/types';
import { AuthDivider, AuthHero, EMAIL_PATTERN, SocialSignIn, authStyles } from './authShared';

/**
 * Signup — mobile port of the "SIGN UP SHEET" screen in the auth redesign,
 * `TSBAuthSign up · Login · Forgot.html` (repo root). Same hero/social/field
 * chrome as `LoginScreen` (shared via `authShared.tsx`), plus full name,
 * confirm-password, and a terms checkbox. Submit is a Phase 1 placeholder
 * like the login screen: it just signs the user in, since there's no signup
 * API yet.
 */

type SignupFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function SignupScreen() {
  const { login } = useAuth();
  const { colors, fonts, fontSize, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
    mode: 'onSubmit',
  });

  const onValid = async (_data: SignupFormValues) => {
    if (!agreed) {
      setAgreeError(true);
      return;
    }
    setAgreeError(false);
    // Phase 1 placeholder — no signup API yet, so any valid-shaped input signs in.
    login();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.authPanel }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.authPanel} />
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <AuthHero topInset={insets.top} />

        {/* White bottom sheet */}
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
          {/* Header */}
          <View>
            <Text
              style={[
                fonts.authDisplay,
                { fontSize: fontSize.authHeading, color: colors.ink, letterSpacing: -0.3 },
              ]}
            >
              Create an account
            </Text>
            <Text
              style={[
                fonts.regular,
                { fontSize: fontSize.authFootnote, color: colors.authMuted, marginTop: 6 },
              ]}
            >
              Create your &ldquo;Bridge Account&rdquo;
            </Text>
          </View>

          {/* Fields */}
          <View style={{ gap: 13 }}>
            <Controller
              control={control}
              name="fullName"
              rules={{ required: 'Full name is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="Full Name"
                  icon={<User size={16} color={colors.authMuted} strokeWidth={1.75} />}
                  error={errors.fullName?.message}
                  placeholder="Your name"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

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

            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Password is required',
                minLength: { value: 8, message: 'Use at least 8 characters' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="Password"
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
                  error={errors.password?.message}
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
                validate: (value, formValues) =>
                  value === formValues.password || 'Passwords do not match',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="Confirm Password"
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
          </View>

          {/* Terms */}
          <View>
            <Pressable
              onPress={() => {
                setAgreed(v => !v);
                setAgreeError(false);
              }}
              style={styles.termsRow}
              hitSlop={4}
            >
              <View
                style={[
                  authStyles.checkbox,
                  styles.termsCheckbox,
                  {
                    backgroundColor: agreed ? colors.gold : colors.authField,
                    borderColor: agreed ? colors.gold : agreeError ? colors.authFieldBorderError : colors.authFieldBorder,
                  },
                ]}
              >
                {agreed && <Check size={12} color={colors.onAccent} strokeWidth={2.75} />}
              </View>
              <Text style={[fonts.regular, styles.termsText, { color: colors.authBody }]}>
                I agree to the{' '}
                <Text style={[fonts.semibold, { color: colors.gold }]}>Terms of Service</Text> and{' '}
                <Text style={[fonts.semibold, { color: colors.gold }]}>Privacy Policy</Text>.
              </Text>
            </Pressable>
            {agreeError && (
              <Text style={[fonts.regular, authStyles.fieldError, { color: colors.authErrorText }]}>
                You must agree to continue
              </Text>
            )}
          </View>

          {/* Submit */}
          <PrimaryButton
            label="Create account"
            loadingLabel="Creating account…"
            loading={isSubmitting}
            onPress={handleSubmit(onValid)}
          />

          <AuthDivider label="OR" />
          <SocialSignIn />

          {/* Login link */}
          <View style={authStyles.footer}>
            <Text style={[fonts.regular, { fontSize: fontSize.authFootnote, color: colors.authBody }]}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => navigation.replace('Login')} hitSlop={8}>
              <Text style={[fonts.bold, { fontSize: fontSize.authFootnote, color: colors.gold }]}>Login</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  termsCheckbox: {
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18.6,
  },
});

export default SignupScreen;
