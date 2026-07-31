import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ForgotPasswordScreen, LoginScreen, SignupScreen } from '../screens/auth';
import { OnboardingScreen } from '../screens/onboarding';
import { useTheme } from '../theme';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Unlike the old JS-based stack, native-stack doesn't pick up
 * `NavigationContainer`'s theme for its own native screen ("card") surface —
 * it needs an explicit `contentStyle`, the native-stack equivalent of the
 * `sceneStyle` `DrawerNavigator` already sets. Without it this card defaults
 * to white regardless of `resolvedTheme`, which is what showed through
 * behind Login/Signup in dark mode.
 */
function AuthNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.authPanel } }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
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
