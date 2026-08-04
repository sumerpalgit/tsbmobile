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
import { XCircle } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useAuth } from '../../store/AuthContext';
import { PrimaryButton } from '../../components';
import { AuthStackParamList } from '../../navigation/types';
import { applyOAuthSession } from '../../api/auth';
import { AuthHero, authStyles } from './authShared';

/**
 * LinkedIn Callback — reached via the tsb://linkedin-callback?token=...&complete=... deep link
 * once webSrc's betterAuth LinkedIn flow finishes server-side (see `SocialSignIn`'s
 * `handleLinkedInSignIn`, which opens that flow in a browser). Unlike `VerifyEmailScreen` this
 * screen makes no API call of its own — webSrc already called `oauth-signin` and handed back
 * the token, so this just persists it and routes on, the same way `oauthSignIn`'s Google path
 * does once its own network call resolves.
 */
function LinkedInCallbackScreen() {
  const { colors, fonts, fontSize, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { params } = useRoute<RouteProp<AuthStackParamList, 'LinkedInCallback'>>();
  const { login } = useAuth();

  const [error, setError] = useState('');

  useEffect(() => {
    const { token, complete, error: paramError } = params ?? {};

    if (paramError) {
      setError(
        paramError === 'account_not_found'
          ? 'No account found for this LinkedIn email. Please sign up first.'
          : 'LinkedIn sign-in failed. Please try again.',
      );
      return;
    }

    if (!token) {
      setError('LinkedIn sign-in failed. Please try again.');
      return;
    }

    let cancelled = false;

    applyOAuthSession(token, complete === 'true').then(() => {
      if (cancelled) return;
      if (complete === 'true') {
        login();
      } else {
        navigation.replace('Onboarding');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [params, navigation, login]);

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
            {!error && (
              <>
                <ActivityIndicator size="large" color={colors.gold} />
                <Text
                  style={[
                    fonts.regular,
                    styles.center,
                    { fontSize: fontSize.authFootnote, color: colors.authMuted },
                  ]}
                >
                  Finishing LinkedIn sign-in…
                </Text>
              </>
            )}

            {!!error && (
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
                  Sign-in failed
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

export default LinkedInCallbackScreen;
