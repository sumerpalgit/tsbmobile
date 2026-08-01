import React, { useState } from 'react';
import { Platform, KeyboardAvoidingView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { Mail } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { PrimaryButton } from '../../components';
import { AuthStackParamList } from '../../navigation/types';
import { resendVerification } from '../../api/auth';
import { AuthHero, SocialButton, authStyles } from './authShared';

/**
 * Check Email — reached after Signup registers the account. Register returns
 * no token: the account needs email verification first. If the backend's
 * email points at the tsb://verify-email deep link, tapping it opens
 * VerifyEmailScreen directly and this screen is skipped on the way back
 * (matching webSrc's `/auth/verify` page auto-redirecting to complete-profile).
 * Until that link is live end-to-end (or if the app isn't installed when the
 * email arrives), this screen is the fallback: the user verifies via
 * whatever the link actually opens, then manually continues to Login, where
 * a not-yet-verified account still surfaces the "email not verified" case.
 */
function CheckEmailScreen() {
  const { colors, fonts, fontSize, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { params } = useRoute<RouteProp<AuthStackParamList, 'CheckEmail'>>();

  const [resending, setResending] = useState(false);

  const goLogin = () => navigation.replace('Login');

  const resend = async () => {
    setResending(true);
    try {
      const result = await resendVerification(params.email);
      Toast.show({ type: 'success', text1: result.message });
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.message
        : 'Something went wrong. Please try again.';
      Toast.show({ type: 'error', text1: 'Could not resend email', text2: message });
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
                Check your email
              </Text>
              <Text
                style={[
                  fonts.regular,
                  styles.subtitle,
                  { fontSize: fontSize.authFootnote, color: colors.authMuted, marginTop: 6 },
                ]}
              >
                We sent a verification link to{' '}
                <Text style={[fonts.semibold, { color: colors.ink }]}>{params.email}</Text>. Click the link to
                verify your account, then come back and log in.
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              <PrimaryButton label="Continue to login" letterSpacing={0} onPress={goLogin} />
              <SocialButton
                label={resending ? 'Resending…' : 'Resend email'}
                onPress={resending ? () => {} : resend}
              />
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
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CheckEmailScreen;
