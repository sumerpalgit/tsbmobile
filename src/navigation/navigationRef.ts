import { createNavigationContainerRef } from '@react-navigation/native';
import type { AppStackParamList } from './types';

/**
 * Navigation handle usable from outside the React tree.
 *
 * Push notification taps arrive from native code — sometimes before any component has mounted
 * (a cold start from a killed app) — so they can't use `useNavigation`. This ref is attached to
 * the `NavigationContainer` in `RootNavigator.tsx` and read by
 * `services/push/navigateFromPush.ts`.
 *
 * Deliberately NOT solved with React Navigation's `linking` config: that object is typed
 * `LinkingOptions<AuthStackParamList>` and all three of its routes live in `AuthNavigator`, so
 * once the user is logged in no `tsb://` URL resolves to anything. Widening it also fails for
 * `MemberProfile`, whose param is a full non-serializable `Profile` object rather than an id.
 */
export const navigationRef = createNavigationContainerRef<AppStackParamList>();

/** True once the container has mounted and can accept navigation calls. */
export function isNavigationReady(): boolean {
  return navigationRef.isReady();
}
