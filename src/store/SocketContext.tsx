import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WS_URL } from '@env';
import { useAuth } from './AuthContext';

const TOKEN_POLL_DELAY_MS = 500;
const MAX_TOKEN_POLLS = 20;

type MessageListener = (data: any) => void;

type SocketContextValue = {
  socketRef: React.RefObject<Socket | null>;
  subscribe: (listener: MessageListener) => () => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);

/**
 * One shared socket.io connection for the whole app — replaces what used to be a brand-new
 * `io(WS_URL, ...)` call per screen (`MessagesScreen`, `EtaChaptersScreen`, each via their own
 * `useWebSocket()` call in the old `src/hooks/useWebSocket.ts`).
 *
 * React Navigation's Drawer keeps previously-visited screens mounted in the background by
 * default (confirmed: `EtaChapters` and the `Tabs` screen housing Messages are sibling
 * `Drawer.Screen`s, no `unmountOnBlur` set) — so once a session had visited both Messages and
 * ETA Chapters, TWO simultaneous socket connections stayed open under the same auth token. Web's
 * SPA routing never hits this: navigating away unmounts the previous page's `useWebSocket()`
 * call (and its socket) before the next page's ever opens. If the backend's per-user broadcast
 * targeting only tracks the most-recently-connected socket for a user (a common, simple
 * implementation), the older connection silently stops receiving pushes while still showing
 * "connected" from the client's own perspective — explaining why live messages arrived fine in
 * whichever screen connected last, but never in the other, even after the payload-shape and
 * `group_id`-type fixes in `EtaChaptersScreen.tsx`'s handler.
 *
 * Reconnects on login and disconnects on logout so a stale socket never persists into a
 * different session on the same app instance.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Set<MessageListener>>(new Set());
  const tokenPollCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const teardown = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

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
      listenersRef.current.forEach(fn => fn(data));
    });
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    if (isAuthenticated) {
      tokenPollCountRef.current = 0;
      connect();
    } else {
      teardown();
    }
    return () => {
      unmountedRef.current = true;
      teardown();
    };
  }, [isAuthenticated, connect, teardown]);

  const subscribe = useCallback((listener: MessageListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const value = useRef<SocketContextValue>({ socketRef, subscribe }).current;

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/** Drop-in replacement for the old per-component `useWebSocket` hook — identical signature
 * (`useWebSocket(onMessage): socketRef`), but now subscribes to `SocketProvider`'s single shared
 * connection instead of opening a new one per call site. */
export function useWebSocket(onMessage: MessageListener) {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useWebSocket must be used within a SocketProvider');
  }

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => ctx.subscribe(data => onMessageRef.current(data)), [ctx]);

  return ctx.socketRef;
}
