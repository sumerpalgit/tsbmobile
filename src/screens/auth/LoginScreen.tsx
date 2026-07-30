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
import { Check, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useAuth } from '../../store/AuthContext';
import { FormField, PrimaryButton } from '../../components';
import { AuthStackParamList } from '../../navigation/types';
import { AuthDivider, AuthHero, EMAIL_PATTERN, SocialSignIn, authStyles } from './authShared';

/**
 * Login — mobile port of the "LOGIN SHEET" screen in the auth redesign,
 * `TSBAuthSign up · Login · Forgot.html` (repo root): a dark hero (logo,
 * tagline, social proof) with a white bottom sheet holding the form. Social
 * sign-in and "forgot password" stay inert — there's no OAuth wiring or a
 * forgot-password screen on mobile yet. Submit still just flips the
 * in-memory auth flag until the real API lands.
 *
 * Two deliberate departures from the design file, both to avoid a new native
 * dependency this repo doesn't already have:
 *  - the hero's `linear-gradient(160deg,#182E43,#1E3852)` is a flat
 *    `authPanel` fill — the two stops are close enough in value that a
 *    gradient library felt like overkill for the difference.
 *  - body copy stays DM Sans (this app's existing type family) rather than
 *    switching to the design's `Inter` — no Inter TTFs are bundled, and
 *    adding them means touching native font linking on both platforms.
 *    Headings do switch to Georgia as specced (see `fonts.authDisplay`).
 */

type LoginFormValues = {
  email: string;
  password: string;
};

function LoginScreen() {
  const { login } = useAuth();
  const { colors, fonts, fontSize, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  const onValid = async (_data: LoginFormValues) => {
    // Phase 1 placeholder — no backend yet, so any valid-shaped input signs in.
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
              Welcome Back
            </Text>
            <Text
              style={[
                fonts.regular,
                { fontSize: fontSize.authFootnote, color: colors.authMuted, marginTop: 6 },
              ]}
            >
              Sign in to your &ldquo;Bridge Account&rdquo;
            </Text>
          </View>

          <SocialSignIn />
          <AuthDivider label="OR SIGN IN WITH EMAIL" />

          {/* Fields */}
          <View style={{ gap: 13 }}>
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
              rules={{ required: 'Password is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="Password"
                  labelRight={
                    <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
                      <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.gold }]}>
                        Forgot password?
                      </Text>
                    </Pressable>
                  }
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
                  placeholder="Your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>

          {/* Remember me */}
          <Pressable onPress={() => setRemember(v => !v)} style={styles.rememberRow} hitSlop={4}>
            <View
              style={[
                authStyles.checkbox,
                {
                  backgroundColor: remember ? colors.gold : colors.authField,
                  borderColor: remember ? colors.gold : colors.authFieldBorder,
                },
              ]}
            >
              {remember && <Check size={12} color={colors.onAccent} strokeWidth={2.75} />}
            </View>
            <Text style={[fonts.regular, { fontSize: fontSize.authRemember, color: colors.authBody }]}>
              Keep me signed in on this device
            </Text>
          </Pressable>

          {/* Submit */}
          <PrimaryButton
            label="Login"
            loadingLabel="Signing in…"
            loading={isSubmitting}
            onPress={handleSubmit(onValid)}
          />

          {/* Sign up */}
          <View style={authStyles.footer}>
            <Text style={[fonts.regular, { fontSize: fontSize.authFootnote, color: colors.authBody }]}>
              Don&apos;t have an account?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Signup')} hitSlop={8}>
              <Text style={[fonts.bold, { fontSize: fontSize.authFootnote, color: colors.gold }]}>
                Create an account
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default LoginScreen;
