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
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [isAuthLoaded, setAuthLoaded] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setOnAuthFailure(() => setAuthenticated(false));

    AsyncStorage.getItem('accessToken').then(token => {
      setAuthenticated(!!token);
      setAuthLoaded(true);
    });

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
      login: () => setAuthenticated(true),
      logout: () => {
        AsyncStorage.removeMany(['accessToken', 'refreshToken']);
        queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
        setAuthenticated(false);
      },
    }),
    [isAuthenticated, isAuthLoaded, queryClient],
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
