import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CheckEmailScreen,
  ForgotPasswordScreen,
  LinkedInCallbackScreen,
  LoginScreen,
  ResetPasswordOtpScreen,
  ResetPasswordScreen,
  SignupScreen,
  VerifyEmailScreen,
} from '../screens/auth';
import { OnboardingScreen } from '../screens/onboarding';
import { useTheme } from '../theme';
import { useAuth } from '../store/AuthContext';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Unlike the old JS-based stack, native-stack doesn't pick up
 * `NavigationContainer`'s theme for its own native screen ("card") surface —
 * it needs an explicit `contentStyle`, the native-stack equivalent of the
 * `sceneStyle` `DrawerNavigator` already sets. Without it this card defaults
 * to white regardless of `resolvedTheme`, which is what showed through
 * behind Login/Signup in dark mode.
 *
 * Starts at Onboarding instead of Login when `needsOnboarding` is true — a relaunch with a
 * valid token but an incomplete profile (e.g. Step 1 done, app killed before Step 2) — so the
 * user resumes the wizard instead of either skipping it (the bug this fixes) or being bounced
 * back through Login first. See `AuthContext`'s bootstrap check.
 */
function AuthNavigator() {
  const { colors } = useTheme();
  const { needsOnboarding } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName={needsOnboarding ? 'Onboarding' : 'Login'}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.authPanel } }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ResetPasswordOtp" component={ResetPasswordOtpScreen} />
      <Stack.Screen name="LinkedInCallback" component={LinkedInCallbackScreen} />
      {/* Bottom-sheet-style modal over Login, not a horizontal push like Login → Signup. */}
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ presentation: 'modal' }}
      />
      {/* Light card, not the dark auth-hero navy the navigator defaults to. */}
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ contentStyle: { backgroundColor: colors.obPage } }}
      />
    </Stack.Navigator>
  );
}

export default AuthNavigator;
