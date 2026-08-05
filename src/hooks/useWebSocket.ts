import { useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WS_URL } from '@env';

const TOKEN_POLL_DELAY_MS = 500;
const MAX_TOKEN_POLLS = 20;

/** Direct RN port of webSrc's `useWebSocket.ts` — same reconnection config, same token-not-ready
 * poll-and-retry (up to 20× every 500ms before giving up silently), same single multiplexed
 * `"message"` socket event carrying a `type` discriminator (`ONLINE_USERS` / `NEW_MESSAGE`) —
 * there is no per-feature socket event on this backend, everything arrives on `"message"`.
 *
 * Only real difference from web: `AsyncStorage.getItem` is async (unlike `localStorage`), so
 * `connect` is async here — same reuses the `accessToken` key `apiClient`'s interceptor and AI
 * Assist's `streamAiGenerate` already read, instead of web's separate `ws_token` localStorage
 * key (mobile has one token for both REST and WS auth, web keeps them distinct because its REST
 * calls use cookie-session auth instead of this token at all).
 *
 * Returned socket ref mirrors web's (unused by any caller today, kept for parity/future use). */
export function useWebSocket(onMessage: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);
  const tokenPollCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  const connect = useCallback(async () => {
    if (unmountedRef.current) return;

    const token = await AsyncStorage.getItem('accessToken');
    if (unmountedRef.current) return;

    if (!token) {
      if (tokenPollCountRef.current < MAX_TOKEN_POLLS) {
        tokenPollCountRef.current += 1;
        retryTimerRef.current = setTimeout(connect, TOKEN_POLL_DELAY_MS);
      }
      return;
    }

    tokenPollCountRef.current = 0;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    socketRef.current = socket;

    socket.on('message', (data: any) => {
      onMessageRef.current(data);
    });
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  return socketRef;
}
