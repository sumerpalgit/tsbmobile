import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { setOnAuthFailure } from '../api/client';
import { getMe } from '../api/profile';
import { ME_QUERY_KEY } from '../api/queryKeys';

type AuthContextValue = {
  isAuthenticated: boolean;
  /** False until the stored token has been checked, so navigation can hold on a
   * splash screen instead of flashing the login screen for an already-logged-in user. */
  isAuthLoaded: boolean;
  /** A valid token exists but the account hasn't finished Onboarding yet — e.g. the user
   * verified/completed Step 1 then killed the app before Steps 2-4. `isAuthenticated` stays
   * false in this case (same as the live-session path: `CheckEmailScreen` navigates to
   * Onboarding without calling `login()`), so `AuthNavigator` renders as normal but resumes
   * at Onboarding instead of Login. */
  needsOnboarding: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isAuthLoaded, setAuthLoaded] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setOnAuthFailure(() => {
      setAuthenticated(false);
      setNeedsOnboarding(false);
    });

    Promise.all([AsyncStorage.getItem('accessToken'), AsyncStorage.getItem('onboardingComplete')]).then(
      ([token, onboardingComplete]) => {
        const hasToken = !!token;
        const isComplete = onboardingComplete === 'true';
        setAuthenticated(hasToken && isComplete);
        setNeedsOnboarding(hasToken && !isComplete);
        setAuthLoaded(true);
      },
    );

    return () => setOnAuthFailure(null);
  }, []);

  // Fires on both bootstrap (token already stored) and an explicit login() call,
  // since both just flip isAuthenticated to true — so the user's profile is cached
  // and ready before any screen asks useMe() for it.
  useEffect(() => {
    if (isAuthenticated) {
      queryClient.prefetchQuery({ queryKey: ME_QUERY_KEY, queryFn: getMe, staleTime: 5 * 60 * 1000 });
    }
  }, [isAuthenticated, queryClient]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isAuthLoaded,
      needsOnboarding,
      login: () => {
        // Every current call site (LoginScreen after step2 is true, Onboarding's own
        // completion step) only calls this once Onboarding is actually done — so this is the
        // single place that guarantees the persisted flag and React state agree, regardless
        // of which call site got here.
        AsyncStorage.setItem('onboardingComplete', 'true');
        setNeedsOnboarding(false);
        setAuthenticated(true);
      },
      logout: () => {
        AsyncStorage.removeMany(['accessToken', 'refreshToken', 'onboardingComplete']);
        queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
        setNeedsOnboarding(false);
        setAuthenticated(false);
      },
    }),
    [isAuthenticated, isAuthLoaded, needsOnboarding, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
