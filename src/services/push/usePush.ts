import { useEffect, useRef } from 'react';
import { useAuth } from '../../store/AuthContext';
import { createDefaultChannel } from './channel';
import { requestPushPermission } from './permissions';
import { getAndLogPushToken, subscribeToTokenRefresh } from './token';
import { registerPushHandlers, consumeInitialNotification } from './handlers';
import { navigateFromPush } from './navigateFromPush';

/** Poll interval and cap for the cold-start replay — see the comment on `replayInitial`. */
const REPLAY_DELAY_MS = 300;
const MAX_REPLAY_ATTEMPTS = 20; // ~6s, comfortably past App.tsx's ≥2s splash.

/**
 * Wires push into the app lifecycle. Mounted once, from `App.tsx`.
 *
 * Driven by `isAuthenticated`, mirroring `SocketContext`'s own effect — permission and token only
 * make sense for a signed-in user, and asking a brand-new user for notification permission before
 * they've seen anything worth being notified about wastes the one prompt Android ever shows.
 *
 * Handlers are registered regardless of auth state: a notification can be tapped while the app is
 * closed, and the tap must still route once the user turns out to be logged in.
 */
export function usePush() {
  const { isAuthenticated } = useAuth();
  const didRequestRef = useRef(false);

  // Channel + handlers: once, on mount, independent of auth.
  useEffect(() => {
    createDefaultChannel();
    const unsubscribeHandlers = registerPushHandlers();
    const unsubscribeTokenRefresh = subscribeToTokenRefresh();

    /**
     * Cold start: the tap that launched the app. `getInitialNotification` resolves long before
     * the navigator exists (App.tsx holds a splash for ≥2s and until theme+auth load), so
     * `navigateFromPush` returns false and we retry on a short interval until it takes.
     *
     * Bounded rather than open-ended so a payload that never routes can't leave a timer running
     * for the life of the process.
     */
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const replayInitial = async (
      data: Record<string, string | undefined> | undefined,
    ) => {
      if (cancelled || !data) return;
      const handled = await navigateFromPush(data);
      if (handled) return;
      attempts += 1;
      if (attempts >= MAX_REPLAY_ATTEMPTS) return;
      timer = setTimeout(() => replayInitial(data), REPLAY_DELAY_MS);
    };

    consumeInitialNotification().then(replayInitial);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribeHandlers();
      unsubscribeTokenRefresh();
    };
  }, []);

  // Permission + token: after login only.
  useEffect(() => {
    if (!isAuthenticated || didRequestRef.current) return;
    didRequestRef.current = true;
    requestPushPermission().then(granted => {
      if (granted) getAndLogPushToken();
    });
  }, [isAuthenticated]);
}
