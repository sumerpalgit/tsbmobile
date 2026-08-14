import React, { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ChevronLeft } from 'lucide-react-native';
import { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { WEB_BASE_URL } from '@env';
import { useTheme } from '../../theme';
import { useAuth } from '../../store/AuthContext';
import { AuthStackParamList } from '../../navigation/types';
import { oauthSignIn } from '../../api/auth';

GoogleSignin.configure({
  webClientId: '571675034140-q8rhmsmidot1tjeutu5hrovthu29clut.apps.googleusercontent.com',
});

const PROFESSIONAL_1 = require('../../assets/images/professional1.jpg');
const PROFESSIONAL_2 = require('../../assets/images/professional2.jpg');
const AUTH_LOGO = require('../../assets/images/AuthLogo.png');

/**
 * Pieces shared by the auth screens (`LoginScreen`, `SignupScreen`,
 * `ForgotPasswordScreen`) in the redesign, `TSBAuthSign up · Login ·
 * Forgot.html` (repo root) — the dark hero, the Google/LinkedIn buttons, the
 * "OR ..." divider, and the field/button styling all repeat identically
 * across those sheets.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Google "G" mark, copied verbatim from the design file's inline SVG (viewBox 0 0 18 18). */
export function GoogleIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 18 18">
      <Path d="M17.6 9.2c0-.6-.05-1.2-.15-1.8H9v3.4h4.8a4.1 4.1 0 01-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" fill="#4285F4" />
      <Path d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.55-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 009 18z" fill="#34A853" />
      <Path d="M3.9 10.7a5.4 5.4 0 010-3.4V5H.9a9 9 0 000 8l3-2.3z" fill="#FBBC05" />
      <Path d="M9 3.6c1.3 0 2.5.45 3.4 1.35l2.6-2.6A9 9 0 00.9 5l3 2.3C4.6 5.15 6.6 3.6 9 3.6z" fill="#EA4335" />
    </Svg>
  );
}

/** LinkedIn "in" mark, copied verbatim from the design file's inline SVG (viewBox 0 0 18 18). */
export function LinkedInIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 18 18">
      <Rect width="18" height="18" rx="3" fill="#0A66C2" />
      <Rect x="3.2" y="7" width="2.4" height="7.6" fill="#fff" />
      <Circle cx="4.4" cy="4.4" r="1.4" fill="#fff" />
      <Path
        d="M7.6 14.6V7h2.3v1a2.7 2.7 0 012.4-1.2c1.7 0 2.7 1.1 2.7 3.1v4.7h-2.4v-4.3c0-1-.4-1.6-1.3-1.6s-1.4.6-1.4 1.6v4.3H7.6z"
        fill="#fff"
      />
    </Svg>
  );
}

export function SocialButton({
  icon,
  label,
  onPress = () => {},
  loading = false,
}: {
  icon?: React.ReactNode;
  label: string;
  /** No-op by default — the Google/LinkedIn buttons have nothing to hook up to yet. */
  onPress?: () => void;
  loading?: boolean;
}) {
  const { colors, fonts, fontSize, borderWidth } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        authStyles.social,
        {
          borderWidth: borderWidth.thin,
          borderColor: colors.authFieldBorder,
          backgroundColor: pressed ? colors.surfaceSunken : colors.surface,
          opacity: loading ? 0.7 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <>
          {icon}
          <Text style={[fonts.semibold, { fontSize: fontSize.authButton, color: colors.ink }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/** The Google + LinkedIn button pair, identical on every auth sheet. */
export function SocialSignIn() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  async function handleGoogleSignIn() {
    console.log('[GoogleSignIn] button pressed');
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('[GoogleSignIn] Play Services available');

      const response = await GoogleSignin.signIn();
      console.log('[GoogleSignIn] raw response:', JSON.stringify(response, null, 2));

      if (!isSuccessResponse(response)) {
        console.log('[GoogleSignIn] user cancelled the sign-in flow');
        return;
      }

      console.log('[GoogleSignIn] SUCCESS — user:', response.data.user);
      const result = await oauthSignIn(response.data.user.email);
      console.log('[GoogleSignIn] oauth-signin result:', result);

      if (!result.complete) {
        navigation.replace('Onboarding');
        return;
      }
      login();
    } catch (error) {
      if (isErrorWithCode(error)) {
        console.log('[GoogleSignIn] ERROR code:', error.code);
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            console.log('[GoogleSignIn] sign-in already in progress');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.log('[GoogleSignIn] Play Services not available or outdated');
            break;
          default:
            console.log('[GoogleSignIn] unhandled error:', error);
        }
        return;
      }
      if (axios.isAxiosError(error)) {
        console.log('[GoogleSignIn] backend error:', error.response?.data);
        Toast.show({
          type: 'error',
          text1: 'Google sign-in failed',
          text2: error.response?.data?.error ?? error.message,
        });
        return;
      }
      console.log('[GoogleSignIn] non-library error:', error);
    } finally {
      setGoogleLoading(false);
    }
  }

  /** Opens webSrc's own LinkedIn sign-in flow rather than doing OAuth natively — LinkedIn's
   * code-for-token exchange needs a client secret that only webSrc's server holds (same secret
   * the "Continue with LinkedIn" button on the website flow uses). webSrc redirects back into
   * the app via `callbackURL`, landing on the tsb://linkedin-callback deep link
   * (`LinkedInCallbackScreen`), which does the actual session persisting/navigation once webSrc
   * hands back a token.
   *
   * Uses `InAppBrowser.openAuth` (Custom Tabs on Android, `ASWebAuthenticationSession` on iOS)
   * instead of a bare `Linking.openURL` specifically because it resolves a real promise once the
   * browser navigates back to the app — that's what lets the spinner cover the *whole* round
   * trip (open → LinkedIn → webSrc → back) instead of just the instant it takes the OS to bring
   * the browser to front, and lets a cancelled/dismissed session be told apart from a genuine
   * failure so cancelling never shows an error toast. `openAuth`'s own redirect capture doesn't
   * reliably also fire the app's normal URL-scheme handler on every platform (`
   * ASWebAuthenticationSession` in particular consumes it internally), so a successful result's
   * `url` is explicitly re-opened via `Linking.openURL` — that's what actually routes into
   * `RootNavigator`'s deep-link config and `LinkedInCallbackScreen`, keeping all the existing
   * token/session logic there unduplicated. Falls back to a bare `Linking.openURL` if
   * `InAppBrowser` isn't available on this device (that library's own recommended pattern) —
   * same behavior as before this change, just for the rare device that doesn't support it. */
  async function handleLinkedInSignIn() {
    console.log('[LinkedInSignIn] button pressed');
    setLinkedinLoading(true);
    try {
      const callbackURL = encodeURIComponent('tsb://linkedin-callback');
      const url = `${WEB_BASE_URL}/mobile-auth/linkedin?callbackURL=${callbackURL}`;

      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.openAuth(url, 'tsb://', { ephemeralWebSession: false });
        console.log('[LinkedInSignIn] openAuth result:', JSON.stringify(result));

        if (result.type === 'success' && result.url) {
          await Linking.openURL(result.url);
        }
        // 'cancel' / 'dismiss' — user backed out of the browser; nothing to do, no error shown.
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.log('[LinkedInSignIn] error opening browser:', error);
      Toast.show({
        type: 'error',
        text1: 'LinkedIn sign-in failed',
        text2: 'Something went wrong. Please try again.',
      });
    } finally {
      setLinkedinLoading(false);
    }
  }

  return (
    <View style={{ gap: 10 }}>
      <SocialButton
        icon={<GoogleIcon />}
        label="Continue with Google"
        onPress={handleGoogleSignIn}
        loading={googleLoading}
      />
      <SocialButton
        icon={<LinkedInIcon />}
        label="Continue with LinkedIn"
        onPress={handleLinkedInSignIn}
        loading={linkedinLoading}
      />
    </View>
  );
}

/** "‹ Back to login" pill — top-left of the Forgot Password sheet. */
export function BackToLoginButton({ onPress }: { onPress: () => void }) {
  const { colors, fonts, fontSize, borderWidth } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        authStyles.backButton,
        {
          borderWidth: borderWidth.thin,
          borderColor: colors.authFieldBorder,
          backgroundColor: pressed ? colors.surface : colors.authField,
        },
      ]}
    >
      <ChevronLeft size={15} color={colors.authBody} strokeWidth={1.6} />
      <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.authBody }]}>Back to login</Text>
    </Pressable>
  );
}

/** "── OR ... ──" divider between social sign-in and the email form. */
export function AuthDivider({ label }: { label: string }) {
  const { colors, fonts, fontSize } = useTheme();

  return (
    <View style={authStyles.divider}>
      <View style={[authStyles.dividerLine, { backgroundColor: colors.authFieldBorder }]} />
      <Text
        style={[
          fonts.bold,
          { fontSize: fontSize.caption, color: colors.authMuted, letterSpacing: 1.05, marginHorizontal: 12 },
        ]}
      >
        {label}
      </Text>
      <View style={[authStyles.dividerLine, { backgroundColor: colors.authFieldBorder }]} />
    </View>
  );
}

/** Dark hero — logo, tagline, description, social proof. Identical on every auth sheet. */
export function AuthHero({ topInset }: { topInset: number }) {
  const { colors, fonts, fontSize } = useTheme();

  return (
    <View
      style={{
        paddingTop: topInset + 6,
        paddingHorizontal: 22,
        paddingBottom: 26,
        backgroundColor: colors.authPanel,
      }}
    >
      <View style={authStyles.heroLogoRow}>
        <Image source={AUTH_LOGO} resizeMode="contain" style={authStyles.logoMark} />
        <Text style={[fonts.semibold, { fontSize: fontSize.subtitle, color: colors.onAccent }]}>
          The Search Bridge
        </Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text
          style={[fonts.authDisplay, authStyles.taglineLine, { fontSize: fontSize.authHero, color: colors.onAccent }]}
        >
          Find.
        </Text>
        <Text
          style={[fonts.authDisplay, authStyles.taglineLine, { fontSize: fontSize.authHero, color: colors.onAccent }]}
        >
          Connect.
        </Text>
        <Text
          style={[
            fonts.authDisplay,
            authStyles.taglineLine,
            { fontSize: fontSize.authHero, color: colors.goldLight, fontStyle: 'italic' },
          ]}
        >
          Close.
        </Text>
      </View>

      <Text
        style={[
          fonts.regular,
          authStyles.heroDescription,
          { fontSize: fontSize.authFootnote, color: colors.authPanelText },
        ]}
      >
        The premier M&A ecosystem connecting searchers, investors, and business owners.
      </Text>

      <View style={authStyles.socialProofRow}>
        <View style={authStyles.avatarRow}>
          <Image source={PROFESSIONAL_1} resizeMode="cover" style={[authStyles.avatarDot, { borderColor: colors.authPanel }]} />
          <Image
            source={PROFESSIONAL_2}
            resizeMode="cover"
            style={[authStyles.avatarDot, authStyles.avatarOverlap, { borderColor: colors.authPanel }]}
          />
          {/* Reuses the first photo — the design file's actual 3rd avatar is a
              copyrighted Disney still, which isn't going in here. */}
          <Image
            source={PROFESSIONAL_1}
            resizeMode="cover"
            style={[authStyles.avatarDot, authStyles.avatarOverlap, { borderColor: colors.authPanel }]}
          />
        </View>
        <Text style={[fonts.semibold, { fontSize: fontSize.small, color: 'rgba(255,255,255,0.8)' }]}>
          10k+ professionals
        </Text>
      </View>
    </View>
  );
}

export const authStyles = StyleSheet.create({
  heroLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logoMark: {
    width: 26,
    height: 23,
  },
  taglineLine: {
    lineHeight: 37,
    letterSpacing: -0.5,
  },
  heroDescription: {
    marginTop: 12,
    lineHeight: 20,
    maxWidth: 290,
  },
  socialProofRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarRow: {
    flexDirection: 'row',
  },
  avatarDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
  },
  avatarOverlap: {
    marginLeft: -9,
  },
  sheet: {
    // Fills the rest of the scroll view instead of hugging its own content —
    // without this, short content (e.g. Forgot Password's default state)
    // leaves the sheet short of the screen bottom, exposing the navy
    // KeyboardAvoidingView background underneath it.
    flexGrow: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 34,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 11,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  fieldError: {
    fontSize: 11.5,
    marginTop: 5,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  social: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
