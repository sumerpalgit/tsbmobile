import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
} from 'react-native';
import { DrawerActions, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTheme } from '../theme';
import { useMe } from '../hooks/useMe';
import { useConversations } from '../hooks/useConversations';
import { useMessageMutations } from '../hooks/useMessageMutations';
import { useWebSocket } from '../store/SocketContext';
import { initConversation, leaveConversation } from '../api/wsConversation';
import { deleteMessage, editMessage, fetchMessages, sendMessage, uploadChatFile } from '../api/messages';
import { fetchProfileByUsername } from '../api/profile';
import { CONVERSATIONS_QUERY_KEY } from '../api/queryKeys';
import { appendUniqueMessages, getConversationPreview, getCopyableText, groupMessages, parseMessageContent } from '../types/messages';
import type { Conversation, Message, PaginationInfo, ReplyTo } from '../types/messages';
import type { UserSearchResult } from '../api/messages';
import type { PickedFile } from '../components/FileUploadButton';
import type { AppStackParamList, MainTabParamList } from '../navigation/types';

import { MessagesHeader } from '../components/messages/MessagesHeader';
import { InboxToolbar } from '../components/messages/InboxToolbar';
import { ConversationList } from '../components/messages/ConversationList';
import { ThreadMessageGroup, DayDivider, TypingIndicatorBubble } from '../components/messages/ThreadMessageBubble';
import { ImageViewerModal } from '../components/messages/ImageViewerModal';
import { ThreadComposer } from '../components/messages/ThreadComposer';
import { NewMessageOverlay } from '../components/messages/NewMessageOverlay';
import { ConversationOptionsSheet } from '../components/messages/ConversationOptionsSheet';
import { MessageActionsSheet } from '../components/messages/MessageActionsSheet';
import { ConfirmDialog } from '../components/events/ConfirmDialog';

type ThreadItem =
  | { key: string; kind: 'day'; label: string }
  | { key: string; kind: 'group'; group: ReturnType<typeof groupMessages>[number]['groups'][number]; senderName: string }
  | { key: string; kind: 'typing'; senderName: string };

/** Messages — functionality from `webSrc/src/app/dashboard/messages/page.tsx` (conversations,
 * real-time delivery over Socket.IO, text/image/file/shared-post messages, pagination,
 * optimistic send, mark-as-read, new-conversation search), UI from the `Messages.html` mobile
 * mockup. See `/home/strivedge/.claude/plans/delightful-seeking-snowglobe.md` for the full
 * architecture writeup — Mute/Block/Delete-conversation are dropped entirely (mockup shows them
 * as real, web has zero backend for any of the three, confirmed by a full-repo grep before this
 * build started), and the caption+attachment bug is fixed (web silently drops a typed caption
 * when a file is also attached — mobile sends both as separate messages).
 *
 * Message Edit/Delete/Read-receipts/Typing (all added later, per separate backend contracts — web
 * has no UI for any of these yet, so there's no web page to port from, only the API/socket specs):
 * - Edit (PATCH) covers text, image, and file messages — keep-caption, replace-attachment, and
 *   remove-attachment (converts to a text message) are all real branches in `handleSaveEdit`, not
 *   just a text-only pass (a shared-post message has no edit orchestration in the real contract,
 *   so it stays un-editable). Delete (DELETE, soft) covers every message type. Both real-time via
 *   the same `"message"` socket event as everything else (`MESSAGE_EDITED`/`MESSAGE_DELETED`).
 * - Read receipts are real now (they weren't originally — web had no backend for them at build
 *   time): one conversation-level `otherParticipantLastReadAt` timestamp, not a per-message flag
 *   — every one of my own messages sent at or before that instant flips to double-tick at once.
 *   Same field also gates Edit eligibility (`isMessageEditable`/`isMessageSeen` in
 *   `types/messages.ts`) — under 1hr old AND not yet read. `CONVERSATION_READ` is the real-time
 *   push for it; the backend independently re-checks edit eligibility too, so a stale client just
 *   gets a 409 (handled in `handleSaveEdit`).
 * - Typing indicator is pure socket state, no REST, nothing persisted — raw `socket.emit('typing'
 *   | 'stop_typing', {conversationId})` on the outgoing side (`handleInputChange`/`stopTypingNow`),
 *   `TYPING`/`STOP_TYPING` on the same `"message"` event on the incoming side. See the
 *   `otherTyping` state and its surrounding comments for the debounce/safety-net timers. */
export default function MessagesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'Messages'>>();
  const stackNavigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'Messages'>>();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { conversations, isLoading: conversationsLoading, refetch: refetchConversations } = useConversations();
  const { markRead, startConversation } = useMessageMutations();

  const [view, setView] = useState<'inbox' | 'thread'>('inbox');
  const [refreshingConversations, setRefreshingConversations] = useState(false);
  const handleRefreshConversations = () => {
    setRefreshingConversations(true);
    refetchConversations();
    setTimeout(() => setRefreshingConversations(false), 600);
  };
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<'all' | 'unread'>('all');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [pendingFile, setPendingFile] = useState<PickedFile | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Message | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  // In-app full-screen image viewer target — one shared modal instance for the whole thread
  // rather than one per bubble, see `ImageViewerModal`'s doc comment.
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  // Snapshot from the active thread's own `fetchMessages` response — used for Edit eligibility
  // (`isMessageEditable`). Not real-time (no socket event for it); the 409 path in
  // `handleSaveEdit` is the backstop for it going stale mid-session.
  const [otherParticipantLastReadAt, setOtherParticipantLastReadAt] = useState<string | null>(null);
  // Whether the other participant is currently typing in the open thread — purely live socket
  // state (`TYPING`/`STOP_TYPING`), nothing persisted or fetched. See the `handleInputChange`/
  // `stopTypingNow` pair below for the sending side of this same contract.
  const [otherTyping, setOtherTyping] = useState(false);

  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [optionsConversation, setOptionsConversation] = useState<Conversation | null>(null);
  const [messageActionsTarget, setMessageActionsTarget] = useState<Message | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const listRef = useRef<FlatList<ThreadItem>>(null);
  const shouldAutoScrollRef = useRef(true);
  const prevContentHeightRef = useRef(0);
  const pendingScrollAdjustRef = useRef<number | null>(null);
  const lastLoadMoreAtRef = useRef(0);
  // Content can keep growing for a bit after the first `onContentSizeChange` fires — most often
  // an image message's `<Image>` resolving its real dimensions asynchronously — so a single
  // scroll-to-bottom right after opening a thread can land short of the true bottom. Instead of
  // clearing `shouldAutoScrollRef` on the first growth, this timer pushes the "stop tracking"
  // moment back on every further growth and only lets go after a brief quiet period.
  const autoScrollSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Outgoing typing state: `hasEmittedTypingRef` gates "typing" to once per burst (not per
  // keystroke), `typingStopTimerRef` is the 2.5s-of-no-keystrokes debounce that fires "stop_typing".
  const hasEmittedTypingRef = useRef(false);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Incoming typing state: 5s safety-net in case a real `STOP_TYPING` never arrives (dropped
  // connection, app killed mid-type on their end, etc.) — without it `otherTyping` could get
  // stuck on forever.
  const typingSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set only when editing an image/file message — the attachment fields being edited alongside
  // its caption. `handleSaveEdit` diffs `pendingFile.uri` against `fileUrl` here to tell "kept
  // as-is" from "replaced" (a new local file was picked); `pendingFile === null` at save time
  // means "removed" (see `handleSaveEdit`'s three branches). Null while editing a plain-text
  // message (attach is disabled for that case, so `pendingFile` never gets set at all).
  const editingOriginalRef = useRef<{ type: 'image' | 'file'; fileUrl: string; fileName: string; fileSize: number; mimeType: string } | null>(
    null,
  );

  // Refs so the WS handler (a stable `useCallback`) never reads stale state — same reasoning as
  // webSrc's own `activeConversationRef`/`conversationsRef`.
  const activeConversationRef = useRef<string | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  useEffect(() => {
    activeConversationRef.current = activeConversationId;
  }, [activeConversationId]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Registers this socket into the open conversation's broadcast room — matches web's own
  // `useEffect` keyed on `selectedConversationId` in `messages/page.tsx` (`conversation-init`/
  // `conversation-leave` against the separate WS/chat-notification server). DMs still deliver
  // live without this (the WS server apparently also targets 1:1 messages directly by recipient
  // user id), but this closes the same gap `EtaChaptersScreen.tsx` had — group chat has no such
  // fallback and silently received nothing without it. See `api/wsConversation.ts`.
  useEffect(() => {
    if (!activeConversationId) return;
    const id = activeConversationId;
    initConversation(id);
    return () => {
      leaveConversation(id);
    };
  }, [activeConversationId]);

  const showToast = (text1: string, type: 'success' | 'error' | 'info' = 'success') => Toast.show({ type, text1 });

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated }));
  }, []);

  // ── Real-time (matches webSrc's `handleIncomingMessage` exactly) ──────────────────────────
  const handleIncomingMessage = useCallback(
    (data: any) => {
      if (data?.type === 'ONLINE_USERS') {
        setOnlineUsers(data.payload || []);
        return;
      }
      // Edit/delete land on this same "message" socket event, discriminated the same way as
      // NEW_MESSAGE. Only the open thread's local list is patched — a non-active conversation's
      // stale `latestMessage` preview (and any reply-quote elsewhere pointing at the changed
      // message) catches up on its next own refetch, same known limitation the real contract
      // itself calls out for reply-quotes.
      if (data?.type === 'MESSAGE_EDITED') {
        const { conversationId, messageId, message, editedAt } = data.payload || {};
        if (conversationId !== activeConversationRef.current) return;
        setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, message, edited_at: editedAt } : m)));
        return;
      }
      if (data?.type === 'MESSAGE_DELETED') {
        const { conversationId, messageId } = data.payload || {};
        if (conversationId !== activeConversationRef.current) return;
        setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, message: JSON.stringify({ type: 'deleted' }) } : m)));
        return;
      }
      // Fires when the *other* participant opens/reads the conversation — flips every eligible
      // sent-tick to seen at once (real behavior, see `isMessageSeen`). Updates the conversations
      // cache unconditionally (so a re-opened thread later starts from the fresh value) and the
      // active thread's own state immediately when it's the open conversation, no refetch needed.
      if (data?.type === 'CONVERSATION_READ') {
        const { conversationId, readAt } = data.payload || {};
        if (!conversationId) return;
        queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old = []) =>
          old.map(c => (c.id === conversationId ? { ...c, otherParticipantLastReadAt: readAt } : c)),
        );
        if (conversationId === activeConversationRef.current) setOtherParticipantLastReadAt(readAt);
        return;
      }
      // Typing indicator — pure socket state, nothing persisted/fetched. Only reacts when the
      // event's conversation matches the one currently open, and ignores a self-echo (shouldn't
      // happen per the contract — the server targets everyone *else* viewing it — but cheap to
      // guard). `TYPING` (re)arms a 5s safety-net that self-clears in case a real `STOP_TYPING`
      // never arrives (dropped connection, app killed mid-type on their end, etc.).
      if (data?.type === 'TYPING') {
        const { conversationId, userId } = data.payload || {};
        if (conversationId !== activeConversationRef.current || userId === me?.id) return;
        setOtherTyping(true);
        if (typingSafetyTimerRef.current) clearTimeout(typingSafetyTimerRef.current);
        typingSafetyTimerRef.current = setTimeout(() => setOtherTyping(false), 5000);
        return;
      }
      if (data?.type === 'STOP_TYPING') {
        const { conversationId, userId } = data.payload || {};
        if (conversationId !== activeConversationRef.current || userId === me?.id) return;
        setOtherTyping(false);
        if (typingSafetyTimerRef.current) {
          clearTimeout(typingSafetyTimerRef.current);
          typingSafetyTimerRef.current = null;
        }
        return;
      }
      if (data?.type !== 'NEW_MESSAGE') return;

      const m = data.payload;
      if (m.sender_id === me?.id) return;

      const convId = m.group_id || m.conversation_id;
      const senderConv = conversationsRef.current.find(c => c.id === convId);
      const senderName = m.sender?.name || senderConv?.name || '';

      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old = []) =>
        old.map(c => {
          if (c.id !== convId) return c;
          const isActive = activeConversationRef.current === convId;
          return {
            ...c,
            latestMessage: { message: m.message, created_at: m.created_at, sender: { name: senderName } },
            unreadCount: isActive ? 0 : (c.unreadCount || 0) + 1,
          };
        }),
      );

      if (activeConversationRef.current !== convId) return;

      // The message itself is the clearest possible "they stopped typing" signal — clear
      // immediately rather than waiting for a separate STOP_TYPING that may or may not follow.
      setOtherTyping(false);
      if (typingSafetyTimerRef.current) {
        clearTimeout(typingSafetyTimerRef.current);
        typingSafetyTimerRef.current = null;
      }

      markRead(convId);
      setMessages(prev => {
        if (prev.some(msg => msg.id === m.id)) return prev;
        shouldAutoScrollRef.current = true;
        return [...prev, { id: m.id, message: m.message, created_at: m.created_at, isSenderMe: false, sender: { name: senderName }, reply_to: m.reply_to ?? null }];
      });
    },
    [me, markRead, queryClient],
  );
  const socketRef = useWebSocket(handleIncomingMessage);

  // ── Outgoing typing (raw socket emits, no REST — see the screen-level doc comment) ────────
  // Cancels the pending debounce timer and, if a "typing" is currently outstanding, emits
  // "stop_typing" for it. Called on send, on leaving the thread (either direction), on switching
  // to a different conversation, and on unmount — every case the contract calls out as needing an
  // immediate stop rather than waiting out the debounce.
  const stopTypingNow = useCallback(() => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    if (hasEmittedTypingRef.current && activeConversationRef.current) {
      socketRef.current?.emit('stop_typing', { conversationId: activeConversationRef.current });
    }
    hasEmittedTypingRef.current = false;
  }, [socketRef]);

  useEffect(() => () => stopTypingNow(), [stopTypingNow]);

  const handleInputChange = useCallback(
    (text: string) => {
      setInputText(text);
      if (!activeConversationRef.current) return;
      // "typing" fires once per burst, not per keystroke — the 2.5s timer below is the debounce;
      // each keystroke just pushes it back out rather than emitting again.
      if (!hasEmittedTypingRef.current) {
        hasEmittedTypingRef.current = true;
        socketRef.current?.emit('typing', { conversationId: activeConversationRef.current });
      }
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = setTimeout(stopTypingNow, 2500);
    },
    [socketRef, stopTypingNow],
  );

  // ── Open / load a conversation ─────────────────────────────────────────────────────────────
  const openConversation = useCallback(
    async (conversation: Pick<Conversation, 'id' | 'name' | 'profileImg' | 'participantId' | 'unreadCount'>) => {
      stopTypingNow();
      setView('thread');
      setActiveConversationId(conversation.id);
      setMessages([]);
      setPagination(null);
      setLoadingMessages(true);
      setReplyTo(null);
      setPendingFile(null);
      setEditingTarget(null);
      setOtherTyping(false);
      shouldAutoScrollRef.current = true;
      if (conversation.unreadCount > 0) markRead(conversation.id);
      try {
        const { messages: msgs, pagination: pageInfo, otherParticipantLastReadAt: lastRead } = await fetchMessages(conversation.id, 1, 50);
        setMessages(appendUniqueMessages([], msgs));
        setPagination(pageInfo);
        setOtherParticipantLastReadAt(lastRead);
        requestAnimationFrame(() => scrollToBottom(false));
      } catch {
        // No visible error state on failure — matches webSrc (console.error only).
      } finally {
        setLoadingMessages(false);
      }
    },
    [markRead, scrollToBottom, stopTypingNow],
  );

  // Cross-tab deep link (e.g. Directory's "Message" action): a caller that already knows the
  // target user's name/profileImg and just got `conversationId` back from `startConversation`
  // passes the exact same stub shape `handleSelectNewUser` below builds, so this opens the thread
  // directly with zero dependency on `conversations` (the list query) having resolved yet.
  // Cleared via `setParams` once consumed — this tab screen stays mounted, so a stale param would
  // otherwise re-open the same thread on every later focus.
  useEffect(() => {
    if (!route.params?.openConversation) return;
    const conversation = route.params.openConversation;
    openConversation(conversation);
    navigation.setParams({ openConversation: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.openConversation]);

  // An open thread is local `view` state, not a real navigation screen, so the hardware back
  // button doesn't know about it on its own — it would otherwise skip straight past "close the
  // thread" to whatever the tab navigator does next. Intercept it here (only while this tab is
  // focused) to close the thread first, same as tapping the thread header's own back arrow;
  // returning `false` once already on the inbox lets the event fall through to the tab
  // navigator's normal back handling.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (view === 'thread') {
          stopTypingNow();
          setView('inbox');
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }, [view, stopTypingNow]),
  );

  const loadMoreMessages = useCallback(async () => {
    if (!activeConversationId || !pagination?.hasMore || loadingMore) return;
    setLoadingMore(true);
    prevContentHeightRef.current = 0;
    try {
      const nextPage = pagination.currentPage + 1;
      const { messages: older, pagination: pageInfo, otherParticipantLastReadAt: lastRead } = await fetchMessages(activeConversationId, nextPage, 50);
      pendingScrollAdjustRef.current = prevContentHeightRef.current;
      setMessages(prev => appendUniqueMessages(older, prev));
      setPagination(pageInfo);
      setOtherParticipantLastReadAt(lastRead);
    } catch {
      // Matches webSrc — silently keeps prior state on failure.
    } finally {
      setLoadingMore(false);
    }
  }, [activeConversationId, pagination, loadingMore]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const now = Date.now();
    if (e.nativeEvent.contentOffset.y < 40 && pagination?.hasMore && !loadingMore && now - lastLoadMoreAtRef.current > 500) {
      lastLoadMoreAtRef.current = now;
      loadMoreMessages();
    }
  };

  const handleContentSizeChange = (_w: number, height: number) => {
    if (pendingScrollAdjustRef.current !== null) {
      const delta = height - pendingScrollAdjustRef.current;
      if (delta > 0) listRef.current?.scrollToOffset({ offset: delta, animated: false });
      pendingScrollAdjustRef.current = null;
    } else if (shouldAutoScrollRef.current) {
      scrollToBottom(false);
      if (autoScrollSettleTimerRef.current) clearTimeout(autoScrollSettleTimerRef.current);
      autoScrollSettleTimerRef.current = setTimeout(() => {
        shouldAutoScrollRef.current = false;
        autoScrollSettleTimerRef.current = null;
      }, 400);
    }
    prevContentHeightRef.current = height;
  };

  // ── Send text (optimistic, matches webSrc's `sendMessage` exactly) ────────────────────────
  const sendTextOptimistic = useCallback(
    async (text: string, capturedReplyTo: ReplyTo | null) => {
      if (!activeConversationId) return;
      const tempId = `temp-${Date.now()}`;
      const tempMsg: Message = {
        id: tempId,
        message: text,
        created_at: new Date().toISOString(),
        isSenderMe: true,
        sender: { name: me?.name || 'You', username: me?.username, profile_img: me?.profileImg },
        reply_to: capturedReplyTo ? { id: capturedReplyTo.id, message: capturedReplyTo.text, sender_name: capturedReplyTo.author } : null,
      };
      setMessages(prev => appendUniqueMessages(prev, [tempMsg]));
      shouldAutoScrollRef.current = true;
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old = []) =>
        old.map(c => (c.id === activeConversationId ? { ...c, latestMessage: { message: text, created_at: tempMsg.created_at, sender: { name: me?.name || 'You' } } } : c)),
      );
      try {
        const saved = await sendMessage(activeConversationId, text, capturedReplyTo?.id);
        setMessages(prev => prev.map(m => (m.id === tempId ? { ...m, id: saved.id, created_at: saved.created_at, reply_to: saved.reply_to ?? null } : m)));
      } catch {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setInputText(text);
      }
    },
    [activeConversationId, me, queryClient],
  );

  // ── Send file (optimistic) ──────────────────────────────────────────────────────────────────
  // A typed caption goes out *inside* the same image/file message's JSON payload (`text` field),
  // not as a separate message — confirmed with backend: the message JSON contract now supports
  // an optional `text` alongside `type`/`fileName`/etc., and mobile's earlier two-message
  // workaround (caption sent first, file second) is no longer needed now that this is fixed
  // properly at the source. Existing image/file messages with no caption are unaffected — `text`
  // is simply omitted when there's nothing typed.
  const sendFileOptimistic = useCallback(
    async (file: PickedFile, caption: string, capturedReplyTo: ReplyTo | null) => {
      if (!activeConversationId) return;
      const isImage = (file.mimeType ?? '').startsWith('image/');
      setIsUploadingFile(true);
      const tempId = `temp-${Date.now()}`;
      const tempPayload = JSON.stringify({
        type: isImage ? 'image' : 'file',
        fileName: file.name,
        fileSize: file.size ?? 0,
        mimeType: file.mimeType ?? '',
        fileUrl: file.uri,
        ...(caption ? { text: caption } : {}),
      });
      const tempMsg: Message = {
        id: tempId,
        message: tempPayload,
        created_at: new Date().toISOString(),
        isSenderMe: true,
        sender: { name: me?.name || 'You', username: me?.username, profile_img: me?.profileImg },
        reply_to: capturedReplyTo ? { id: capturedReplyTo.id, message: capturedReplyTo.text, sender_name: capturedReplyTo.author } : null,
      };
      setMessages(prev => appendUniqueMessages(prev, [tempMsg]));
      shouldAutoScrollRef.current = true;
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old = []) =>
        old.map(c => (c.id === activeConversationId ? { ...c, latestMessage: { message: tempPayload, created_at: tempMsg.created_at, sender: { name: me?.name || 'You' } } } : c)),
      );
      try {
        const fileUrl = await uploadChatFile(file);
        const finalPayload = JSON.stringify({
          type: isImage ? 'image' : 'file',
          fileName: file.name,
          fileSize: file.size ?? 0,
          mimeType: file.mimeType ?? '',
          fileUrl,
          ...(caption ? { text: caption } : {}),
        });
        const saved = await sendMessage(activeConversationId, finalPayload, capturedReplyTo?.id);
        setMessages(prev =>
          prev.map(m => (m.id === tempId ? { ...m, id: saved.id, message: finalPayload, created_at: saved.created_at, reply_to: saved.reply_to ?? null } : m)),
        );
      } catch {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        showToast('Failed to send file. Please try again.', 'error');
      } finally {
        setIsUploadingFile(false);
      }
    },
    [activeConversationId, me, queryClient],
  );

  // ── Edit (text, image, and file messages — a shared-post message has no edit orchestration in
  // the real contract, so `isMessageEditable` never offers it) ─────────────────────────────────
  const handleSaveEdit = useCallback(async () => {
    if (!activeConversationId || !editingTarget) return;
    const text = inputText.trim();
    const file = pendingFile;
    const original = editingOriginalRef.current;
    if (!text && !file) return; // can't save a fully-empty message
    const target = editingTarget;
    stopTypingNow();
    setEditingTarget(null);
    setInputText('');
    setPendingFile(null);
    editingOriginalRef.current = null;
    try {
      let payload: string;
      if (!original || !file) {
        // Plain-text edit, or the attachment was removed during an image/file edit — both become
        // (or stay) a plain-text message, matching the real contract's "remove image" case.
        payload = text;
      } else if (file.uri === original.fileUrl) {
        // Attachment kept as-is — only the caption may have changed.
        payload = JSON.stringify({
          type: original.type,
          fileName: original.fileName,
          fileSize: original.fileSize,
          mimeType: original.mimeType,
          fileUrl: original.fileUrl,
          ...(text ? { text } : {}),
        });
      } else {
        // Attachment replaced — upload the new file first, same as a fresh `sendFileOptimistic`.
        setIsUploadingFile(true);
        const isImage = (file.mimeType ?? '').startsWith('image/');
        const fileUrl = await uploadChatFile(file);
        setIsUploadingFile(false);
        payload = JSON.stringify({
          type: isImage ? 'image' : 'file',
          fileName: file.name,
          fileSize: file.size ?? 0,
          mimeType: file.mimeType ?? '',
          fileUrl,
          ...(text ? { text } : {}),
        });
      }
      const saved = await editMessage(activeConversationId, target.id, payload);
      setMessages(prev => prev.map(m => (m.id === target.id ? { ...m, message: saved.message, edited_at: saved.edited_at } : m)));
    } catch (err: any) {
      setIsUploadingFile(false);
      const status = err?.response?.status;
      showToast(status === 409 ? 'This message can no longer be edited' : 'Failed to save edit', 'error');
    }
  }, [activeConversationId, editingTarget, inputText, pendingFile, stopTypingNow]);

  const handleSend = async () => {
    if (!activeConversationId) return;
    if (editingTarget) {
      await handleSaveEdit();
      return;
    }
    stopTypingNow();
    const text = inputText.trim();
    const file = pendingFile;
    const capturedReply = replyTo;
    setReplyTo(null);

    if (file) {
      setInputText('');
      setPendingFile(null);
      await sendFileOptimistic(file, text, capturedReply);
      return;
    }

    if (!text) return;
    setInputText('');
    await sendTextOptimistic(text, capturedReply);
  };

  const handleStartEdit = (message: Message) => {
    const parsed = parseMessageContent(message.message);
    setReplyTo(null);
    if (parsed.type === 'text') {
      editingOriginalRef.current = null;
      setPendingFile(null);
      setEditingTarget(message);
      setInputText(parsed.text);
    } else if (parsed.type === 'image' || parsed.type === 'file') {
      editingOriginalRef.current = { type: parsed.type, fileUrl: parsed.fileUrl, fileName: parsed.fileName, fileSize: parsed.fileSize, mimeType: parsed.mimeType };
      // Represents the existing remote attachment in the composer's own pending-file preview —
      // `handleSaveEdit` tells "kept" from "replaced" by comparing this `uri` back against
      // `editingOriginalRef.current.fileUrl`.
      setPendingFile({ uri: parsed.fileUrl, name: parsed.fileName, size: parsed.fileSize, mimeType: parsed.mimeType });
      setEditingTarget(message);
      setInputText(parsed.text ?? '');
    }
  };

  const handleCancelEdit = () => {
    setEditingTarget(null);
    setInputText('');
    setPendingFile(null);
    editingOriginalRef.current = null;
  };

  // ── Delete (soft delete, any message type, no time/read restriction) ──────────────────────
  const handleConfirmDelete = async () => {
    if (!activeConversationId || !deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteMessage(activeConversationId, target.id);
      setMessages(prev => prev.map(m => (m.id === target.id ? { ...m, message: JSON.stringify({ type: 'deleted' }) } : m)));
      if (editingTarget?.id === target.id) handleCancelEdit();
    } catch {
      showToast('Failed to delete message', 'error');
    }
  };

  const handleAttach = async () => {
    if (isUploadingFile || !activeConversationId) return;
    try {
      const [picked] = await pick({ type: [types.pdf, types.doc, types.docx, types.images] });
      const mime = picked.type ?? '';
      const isImage = mime.startsWith('image/');
      const allowedDocs = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!isImage && !allowedDocs.includes(mime)) {
        showToast('Unsupported file type.', 'error');
        return;
      }
      if (picked.size && picked.size > 10 * 1024 * 1024) {
        showToast('File size must be 10 MB or less.', 'error');
        return;
      }
      setPendingFile({ uri: picked.uri, name: picked.name ?? 'file', size: picked.size ?? null, mimeType: picked.type ?? null });
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      showToast('Could not attach file', 'error');
    }
  };

  // ── New conversation ───────────────────────────────────────────────────────────────────────
  const handleSelectNewUser = async (user: UserSearchResult) => {
    try {
      const conversationId = await startConversation({ username: user.username, name: user.name, profileImg: user.profile_img });
      setNewMessageOpen(false);
      openConversation({ id: conversationId, name: user.name, profileImg: user.profile_img ?? null, participantId: conversationId, unreadCount: 0 });
    } catch {
      showToast('Failed to start conversation', 'error');
    }
  };

  // ── Reply-to / Copy (hover-reveal icon buttons on web → collapsed into one long-press action
  // sheet on mobile, see `MessageActionsSheet`) ──────────────────────────────────────────────
  const activeConversation = conversations.find(c => c.id === activeConversationId) ?? null;

  // "View profile" (thread header + the inbox row's "More" sheet) used to be a toast stub —
  // now navigates into the real `MemberProfileScreen` Directory already built. `Conversation`
  // carries no username field (confirmed on web too — `participantId` there is a raw
  // backend-controlled id, verified on-device NOT to be the username `fetchProfileByUsername`
  // needs), so the other participant's real username is read off a message's `sender.username`
  // instead — reused from state when this is the open thread, otherwise fetched fresh.
  const resolveParticipantUsername = async (conversation: Conversation): Promise<string | null> => {
    if (conversation.id === activeConversationId) {
      const fromState = messages.find(m => !m.isSenderMe && m.sender.username)?.sender.username;
      if (fromState) return fromState;
    }
    try {
      const { messages: fetched } = await fetchMessages(conversation.id, 1, 20);
      return fetched.find(m => !m.isSenderMe && m.sender.username)?.sender.username ?? null;
    } catch {
      return null;
    }
  };

  const handleViewProfile = async (conversation: Conversation) => {
    try {
      const username = await resolveParticipantUsername(conversation);
      if (!username) throw new Error('Could not resolve participant username');
      const profile = await fetchProfileByUsername(username);
      stackNavigation.navigate('MemberProfile', { profile, initialSaved: false });
    } catch {
      showToast('Could not open this profile', 'error');
    }
  };

  const threadItems: ThreadItem[] = [];
  groupMessages(messages).forEach((dateGroup, di) => {
    threadItems.push({ key: `day-${di}`, kind: 'day', label: dateGroup.dateLabel });
    dateGroup.groups.forEach((group, gi) => {
      threadItems.push({ key: `group-${di}-${gi}`, kind: 'group', group, senderName: group.senderName });
    });
  });
  // Always trails the list — "bottom of the chat", not attached to any specific message bubble.
  if (otherTyping && activeConversation) {
    threadItems.push({ key: 'typing-indicator', kind: 'typing', senderName: activeConversation.name });
  }

  // Swipe-right-to-reply (see `SwipeToReply` in `ThreadMessageBubble.tsx`) — fires directly on
  // release past the swipe threshold, no confirmation sheet.
  const handleSwipeReply = (message: Message, author: string) =>
    setReplyTo({ id: message.id, author, text: getConversationPreview(message.message) });

  // Long-press opens the Copy/Edit/Delete sheet — `ThreadMessageBubble` only wires this at all
  // when at least one of those would actually show (copyable text, or an own message that's
  // still deletable), so the sheet never opens empty.
  const handleMessageActions = (message: Message) => setMessageActionsTarget(message);

  const copyableText = messageActionsTarget ? getCopyableText(parseMessageContent(messageActionsTarget.message)) : null;
  const handleCopyFromSheet = () => {
    if (copyableText) Clipboard.setString(copyableText);
    setMessageActionsTarget(null);
    showToast('Copied to clipboard', 'success');
  };
  const handleEditFromSheet = () => {
    if (messageActionsTarget) handleStartEdit(messageActionsTarget);
    setMessageActionsTarget(null);
  };
  const handleDeleteFromSheet = () => {
    if (messageActionsTarget) setDeleteTarget(messageActionsTarget);
    setMessageActionsTarget(null);
  };

  // Tapping a reply quote scrolls to + briefly highlights the original message — only if it's
  // already loaded in the current scrollback (matches web's own limitation: no auto-fetch-to-
  // locate for older, not-yet-loaded pages).
  const scrollToMessage = (messageId: string) => {
    const index = threadItems.findIndex(item => item.kind === 'group' && item.group.messages.some(m => m.id === messageId));
    if (index === -1) return;
    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    setHighlightedMessageId(messageId);
    setTimeout(() => setHighlightedMessageId(current => (current === messageId ? null : current)), 1500);
  };

  const allCount = conversations.length;
  const unreadTotal = conversations.reduce((n, c) => n + (c.unreadCount > 0 ? 1 : 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {view === 'inbox' ? (
        <MessagesHeader
          view="inbox"
          onOpenMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
          onNewMessage={() => setNewMessageOpen(true)}
        />
      ) : (
        <MessagesHeader
          view="thread"
          name={activeConversation?.name ?? ''}
          role="Member"
          presence={activeConversation && onlineUsers.includes(activeConversation.participantId) ? 'Online' : 'Offline'}
          avatarColor={colors.navy2}
          profileImg={activeConversation?.profileImg}
          isOnline={!!(activeConversation && onlineUsers.includes(activeConversation.participantId))}
          onBack={() => {
            stopTypingNow();
            setView('inbox');
          }}
          onViewProfile={() => activeConversation && handleViewProfile(activeConversation)}
          onOptions={() => activeConversation && setOptionsConversation(activeConversation)}
        />
      )}

      {view === 'inbox' ? (
        <View style={{ flex: 1 }}>
          <InboxToolbar
            query={search}
            onQueryChange={setSearch}
            segment={segment}
            onSegmentChange={setSegment}
            allCount={allCount}
            unreadCount={unreadTotal}
          />
          <ConversationList
            conversations={conversations}
            isLoading={conversationsLoading}
            refreshing={refreshingConversations}
            onRefresh={handleRefreshConversations}
            search={search}
            segment={segment}
            onlineUserIds={onlineUsers}
            onOpen={openConversation}
            onMore={setOptionsConversation}
            onStartConversation={() => setNewMessageOpen(true)}
          />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          {loadingMessages && threadItems.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color={colors.gold} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={threadItems}
              keyExtractor={item => item.key}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              onScroll={handleScroll}
              onContentSizeChange={handleContentSizeChange}
              scrollEventThrottle={32}
              keyboardDismissMode="none"
              keyboardShouldPersistTaps="handled"
              onScrollToIndexFailed={info => {
                setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 }), 100);
              }}
              renderItem={({ item }) =>
                item.kind === 'day' ? (
                  <DayDivider label={item.label} />
                ) : item.kind === 'typing' ? (
                  <TypingIndicatorBubble senderName={item.senderName} />
                ) : (
                  <ThreadMessageGroup
                    group={item.group}
                    senderName={item.senderName}
                    highlightedMessageId={highlightedMessageId}
                    otherParticipantLastReadAt={otherParticipantLastReadAt}
                    onSwipeReply={handleSwipeReply}
                    onMessageActions={handleMessageActions}
                    onPressReplyQuote={scrollToMessage}
                    onPressImage={setViewerImageUrl}
                  />
                )
              }
            />
          )}
          <ThreadComposer
            value={inputText}
            onChangeText={handleInputChange}
            onSend={handleSend}
            onAttach={handleAttach}
            pendingFile={pendingFile}
            onRemovePendingFile={() => setPendingFile(null)}
            isUploadingFile={isUploadingFile}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            disabled={false}
            editingPreview={editingTarget ? getConversationPreview(editingTarget.message) : null}
            onCancelEdit={handleCancelEdit}
            editingAllowsAttach={!!editingOriginalRef.current}
          />
        </KeyboardAvoidingView>
      )}

      <NewMessageOverlay
        visible={newMessageOpen}
        onClose={() => setNewMessageOpen(false)}
        onSelectUser={handleSelectNewUser}
        excludeUsername={me?.username}
      />

      <ConversationOptionsSheet
        visible={!!optionsConversation}
        onClose={() => setOptionsConversation(null)}
        conversation={optionsConversation}
        onOpen={() => optionsConversation && openConversation(optionsConversation)}
        onMarkRead={() => optionsConversation && markRead(optionsConversation.id)}
        onViewProfile={() => optionsConversation && handleViewProfile(optionsConversation)}
      />

      <MessageActionsSheet
        visible={!!messageActionsTarget}
        onClose={() => setMessageActionsTarget(null)}
        message={messageActionsTarget}
        otherParticipantLastReadAt={otherParticipantLastReadAt}
        copyableText={copyableText}
        onCopy={handleCopyFromSheet}
        onEdit={handleEditFromSheet}
        onDelete={handleDeleteFromSheet}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        eyebrow="DELETE MESSAGE"
        title="Are you sure?"
        message="This message will be deleted for both you and the recipient. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ImageViewerModal visible={!!viewerImageUrl} imageUrl={viewerImageUrl} onClose={() => setViewerImageUrl(null)} />
    </View>
  );
}
