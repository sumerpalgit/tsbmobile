import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../theme';

/**
 * Pieces shared by the auth screens (`LoginScreen`, `SignupScreen`,
 * `ForgotPasswordScreen`) in the redesign, `TSBAuthSign up · Login ·
 * Forgot.html` (repo root) — the dark hero, the Google/LinkedIn buttons, the
 * "OR ..." divider, and the field/button styling all repeat identically
 * across those sheets.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Bowtie glyph + window, copied from the design file's inline SVG (viewBox 0 0 36 32). */
function LogoMark({ color }: { color: string }) {
  return (
    <Svg width={26} height={23} viewBox="0 0 36 32" fill="none">
      <Path d="M2 6 L14 16 L2 26 Z" fill={color} />
      <Path d="M34 6 L22 16 L34 26 Z" fill={color} />
      <Rect x="14" y="11" width="8" height="10" rx="1" fill="#FFFFFF" />
      <Line x1="15" y1="14" x2="21" y2="14" stroke={color} strokeWidth={0.7} />
      <Line x1="15" y1="18" x2="21" y2="18" stroke={color} strokeWidth={0.7} />
    </Svg>
  );
}

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
}: {
  icon?: React.ReactNode;
  label: string;
  /** No-op by default — the Google/LinkedIn buttons have nothing to hook up to yet. */
  onPress?: () => void;
}) {
  const { colors, fonts, fontSize, borderWidth } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        authStyles.social,
        {
          borderWidth: borderWidth.thin,
          borderColor: colors.authFieldBorder,
          backgroundColor: pressed ? colors.surfaceSunken : colors.surface,
        },
      ]}
    >
      {icon}
      <Text style={[fonts.semibold, { fontSize: fontSize.authButton, color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

/** The Google + LinkedIn button pair, identical on every auth sheet. */
export function SocialSignIn() {
  return (
    <View style={{ gap: 10 }}>
      <SocialButton icon={<GoogleIcon />} label="Continue with Google" />
      <SocialButton icon={<LinkedInIcon />} label="Continue with LinkedIn" />
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
        <LogoMark color={colors.goldLight} />
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
          <View style={[authStyles.avatarDot, { backgroundColor: colors.authAvatarRing1, borderColor: colors.authPanel }]} />
          <View
            style={[
              authStyles.avatarDot,
              authStyles.avatarOverlap,
              { backgroundColor: colors.authAvatarRing2, borderColor: colors.authPanel },
            ]}
          />
          <View
            style={[
              authStyles.avatarDot,
              authStyles.avatarOverlap,
              { backgroundColor: colors.authMuted, borderColor: colors.authPanel },
            ]}
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
