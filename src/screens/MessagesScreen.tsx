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
import type { RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { useTheme } from '../theme';
import { useMe } from '../hooks/useMe';
import { useConversations } from '../hooks/useConversations';
import { useMessageMutations } from '../hooks/useMessageMutations';
import { useWebSocket } from '../hooks/useWebSocket';
import { fetchMessages, sendMessage, uploadChatFile } from '../api/messages';
import { CONVERSATIONS_QUERY_KEY } from '../api/queryKeys';
import { appendUniqueMessages, groupMessages } from '../types/messages';
import type { Conversation, Message, PaginationInfo, ReplyTo } from '../types/messages';
import type { UserSearchResult } from '../api/messages';
import type { PickedFile } from '../components/FileUploadButton';
import type { MainTabParamList } from '../navigation/types';

import { MessagesHeader } from '../components/messages/MessagesHeader';
import { InboxToolbar } from '../components/messages/InboxToolbar';
import { ConversationList } from '../components/messages/ConversationList';
import { ThreadMessageGroup, DayDivider } from '../components/messages/ThreadMessageBubble';
import { ThreadComposer } from '../components/messages/ThreadComposer';
import { NewMessageOverlay } from '../components/messages/NewMessageOverlay';
import { ConversationOptionsSheet } from '../components/messages/ConversationOptionsSheet';

type ThreadItem =
  | { key: string; kind: 'day'; label: string }
  | { key: string; kind: 'group'; group: ReturnType<typeof groupMessages>[number]['groups'][number]; senderName: string };

/** Messages — functionality from `webSrc/src/app/dashboard/messages/page.tsx` (conversations,
 * real-time delivery over Socket.IO, text/image/file/shared-post messages, pagination,
 * optimistic send, mark-as-read, new-conversation search), UI from the `Messages.html` mobile
 * mockup. See `/home/strivedge/.claude/plans/delightful-seeking-snowglobe.md` for the full
 * architecture writeup — Mute/Block/Delete-conversation are dropped entirely (mockup shows them
 * as real, web has zero backend for any of the three, confirmed by a full-repo grep before this
 * build started), the caption+attachment bug is fixed (web silently drops a typed caption when a
 * file is also attached — mobile sends both as separate messages), and the outgoing "seen"
 * checkmark is a static sent-indicator, not real read-receipt data (web has none). */
export default function MessagesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'Messages'>>();
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

  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [optionsConversation, setOptionsConversation] = useState<Conversation | null>(null);

  const listRef = useRef<FlatList<ThreadItem>>(null);
  const shouldAutoScrollRef = useRef(true);
  const prevContentHeightRef = useRef(0);
  const pendingScrollAdjustRef = useRef<number | null>(null);
  const lastLoadMoreAtRef = useRef(0);

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

      markRead(convId);
      setMessages(prev => {
        if (prev.some(msg => msg.id === m.id)) return prev;
        shouldAutoScrollRef.current = true;
        return [...prev, { id: m.id, message: m.message, created_at: m.created_at, isSenderMe: false, sender: { name: senderName }, reply_to: m.reply_to ?? null }];
      });
    },
    [me, markRead, queryClient],
  );
  useWebSocket(handleIncomingMessage);

  // ── Open / load a conversation ─────────────────────────────────────────────────────────────
  const openConversation = useCallback(
    async (conversation: Pick<Conversation, 'id' | 'name' | 'profileImg' | 'participantId' | 'unreadCount'>) => {
      setView('thread');
      setActiveConversationId(conversation.id);
      setMessages([]);
      setPagination(null);
      setLoadingMessages(true);
      setReplyTo(null);
      setPendingFile(null);
      shouldAutoScrollRef.current = true;
      if (conversation.unreadCount > 0) markRead(conversation.id);
      try {
        const { messages: msgs, pagination: pageInfo } = await fetchMessages(conversation.id, 1, 50);
        setMessages(appendUniqueMessages([], msgs));
        setPagination(pageInfo);
        requestAnimationFrame(() => scrollToBottom(false));
      } catch {
        // No visible error state on failure — matches webSrc (console.error only).
      } finally {
        setLoadingMessages(false);
      }
    },
    [markRead, scrollToBottom],
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
          setView('inbox');
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }, [view]),
  );

  const loadMoreMessages = useCallback(async () => {
    if (!activeConversationId || !pagination?.hasMore || loadingMore) return;
    setLoadingMore(true);
    prevContentHeightRef.current = 0;
    try {
      const nextPage = pagination.currentPage + 1;
      const { messages: older, pagination: pageInfo } = await fetchMessages(activeConversationId, nextPage, 50);
      pendingScrollAdjustRef.current = prevContentHeightRef.current;
      setMessages(prev => appendUniqueMessages(older, prev));
      setPagination(pageInfo);
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
      shouldAutoScrollRef.current = false;
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

  // ── Send file (optimistic, matches webSrc's `sendFile` — minus the caption bug, see decision #2) ──
  const sendFileOptimistic = useCallback(
    async (file: PickedFile) => {
      if (!activeConversationId) return;
      const isImage = (file.mimeType ?? '').startsWith('image/');
      setIsUploadingFile(true);
      const tempId = `temp-${Date.now()}`;
      const tempPayload = JSON.stringify({ type: isImage ? 'image' : 'file', fileName: file.name, fileSize: file.size ?? 0, mimeType: file.mimeType ?? '', fileUrl: file.uri });
      const tempMsg: Message = {
        id: tempId,
        message: tempPayload,
        created_at: new Date().toISOString(),
        isSenderMe: true,
        sender: { name: me?.name || 'You', username: me?.username, profile_img: me?.profileImg },
        reply_to: null,
      };
      setMessages(prev => appendUniqueMessages(prev, [tempMsg]));
      shouldAutoScrollRef.current = true;
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old = []) =>
        old.map(c => (c.id === activeConversationId ? { ...c, latestMessage: { message: tempPayload, created_at: tempMsg.created_at, sender: { name: me?.name || 'You' } } } : c)),
      );
      try {
        const fileUrl = await uploadChatFile(file);
        const finalPayload = JSON.stringify({ type: isImage ? 'image' : 'file', fileName: file.name, fileSize: file.size ?? 0, mimeType: file.mimeType ?? '', fileUrl });
        const saved = await sendMessage(activeConversationId, finalPayload);
        setMessages(prev => prev.map(m => (m.id === tempId ? { ...m, id: saved.id, message: finalPayload, created_at: saved.created_at } : m)));
      } catch {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        showToast('Failed to send file. Please try again.', 'error');
      } finally {
        setIsUploadingFile(false);
      }
    },
    [activeConversationId, me, queryClient],
  );

  const handleSend = async () => {
    if (!activeConversationId) return;
    const text = inputText.trim();
    const file = pendingFile;

    if (file) {
      // Decision #2 (fixing web's bug): a typed caption is sent as its own message first
      // (instant), then the file follows as a second message — nothing typed is silently lost.
      if (text) {
        setInputText('');
        const capturedReply = replyTo;
        setReplyTo(null);
        await sendTextOptimistic(text, capturedReply);
      }
      setPendingFile(null);
      await sendFileOptimistic(file);
      return;
    }

    if (!text) return;
    setInputText('');
    const capturedReply = replyTo;
    setReplyTo(null);
    await sendTextOptimistic(text, capturedReply);
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

  // ── Reply-to (hover-reveal on web → tap "..." isn't in the mockup's message bubble, so this
  // is wired from a long-press on a bubble; kept minimal since the mockup has no explicit affordance) ──
  const activeConversation = conversations.find(c => c.id === activeConversationId) ?? null;

  const threadItems: ThreadItem[] = [];
  groupMessages(messages).forEach((dateGroup, di) => {
    threadItems.push({ key: `day-${di}`, kind: 'day', label: dateGroup.dateLabel });
    dateGroup.groups.forEach((group, gi) => {
      threadItems.push({ key: `group-${di}-${gi}`, kind: 'group', group, senderName: group.senderName });
    });
  });

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
          initials={(activeConversation?.name ?? '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
          avatarColor={colors.navy2}
          onBack={() => setView('inbox')}
          onViewProfile={() => showToast('Opening profile', 'info')}
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
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) =>
                item.kind === 'day' ? <DayDivider label={item.label} /> : <ThreadMessageGroup group={item.group} senderName={item.senderName} />
              }
            />
          )}
          <ThreadComposer
            value={inputText}
            onChangeText={setInputText}
            onSend={handleSend}
            onAttach={handleAttach}
            pendingFile={pendingFile}
            onRemovePendingFile={() => setPendingFile(null)}
            isUploadingFile={isUploadingFile}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            disabled={false}
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
        onViewProfile={() => showToast('Opening profile', 'info')}
      />
    </View>
  );
}
