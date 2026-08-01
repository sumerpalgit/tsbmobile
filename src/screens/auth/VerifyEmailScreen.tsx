import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { PrimaryButton } from '../../components';
import { AuthStackParamList } from '../../navigation/types';
import { verifyEmail } from '../../api/auth';
import { AuthHero, authStyles } from './authShared';

type Status = 'loading' | 'success' | 'error';

/**
 * Verify Email — reached via the tsb://verify-email?token=... deep link when
 * the user taps the link in their verification email. Mirrors
 * `webSrc/src/app/auth/verify/page.tsx`: fires `GET /api/auth/verify-email`
 * once on mount with the token carried in the link, then moves on to
 * Onboarding on success (web redirects to `/auth/complete-profile`, its
 * equivalent of this app's Onboarding wizard).
 *
 * The manual "Continue to login" path from `CheckEmailScreen` stays as a
 * fallback — this screen only fires when the deep link actually reaches the
 * app (requires the backend's email template to link to `tsb://...`, or
 * Universal Links once those are set up; see AuthNavigator's `linking`
 * config in RootNavigator).
 */
function VerifyEmailScreen() {
  const { colors, fonts, fontSize, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { params } = useRoute<RouteProp<AuthStackParamList, 'VerifyEmail'>>();

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params?.token;
    if (!token) {
      setStatus('error');
      setError('No verification token provided.');
      return;
    }

    let cancelled = false;

    verifyEmail(token, params?.userId)
      .then(result => {
        if (cancelled) return;
        setStatus('success');
        setMessage(result.message);
      })
      .catch(err => {
        if (cancelled) return;
        setStatus('error');
        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.error ?? err.message
            : 'Network error. Please try again.',
        );
      });

    return () => {
      cancelled = true;
    };
  }, [params?.token, params?.userId]);

  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => navigation.replace('Onboarding'), 2000);
    return () => clearTimeout(timer);
  }, [status, navigation]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.authPanel }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.authPanel} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
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
          <View style={styles.content}>
            {status === 'loading' && (
              <>
                <ActivityIndicator size="large" color={colors.gold} />
                <Text
                  style={[
                    fonts.regular,
                    styles.center,
                    { fontSize: fontSize.authFootnote, color: colors.authMuted },
                  ]}
                >
                  Verifying your email address…
                </Text>
              </>
            )}

            {status === 'success' && (
              <>
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
                  Email verified successfully!
                </Text>
                {!!message && (
                  <Text
                    style={[
                      fonts.regular,
                      styles.center,
                      { fontSize: fontSize.authFootnote, color: colors.authMuted },
                    ]}
                  >
                    {message}
                  </Text>
                )}
                <ActivityIndicator size="small" color={colors.gold} />
                <Text style={[fonts.regular, styles.center, { fontSize: fontSize.small, color: colors.authMuted }]}>
                  Redirecting you to complete your profile…
                </Text>
              </>
            )}

            {status === 'error' && (
              <>
                <View style={[styles.iconBadge, { backgroundColor: colors.dangerSurface }]}>
                  <XCircle size={28} color={colors.danger} strokeWidth={1.7} />
                </View>
                <Text
                  style={[
                    fonts.authDisplay,
                    styles.center,
                    { fontSize: fontSize.authHeading, color: colors.ink, letterSpacing: -0.3 },
                  ]}
                >
                  Verification failed
                </Text>
                <Text style={[fonts.regular, styles.center, { fontSize: fontSize.authFootnote, color: colors.danger }]}>
                  {error}
                </Text>
                <PrimaryButton label="Back to login" letterSpacing={0} onPress={() => navigation.replace('Login')} />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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

export default VerifyEmailScreen;
