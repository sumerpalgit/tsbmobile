import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Share,
  Text,
  View,
} from 'react-native';
import { DrawerActions, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { useTheme } from '../theme';
import { useMe } from '../hooks/useMe';
import { useAiConversations } from '../hooks/useAiConversations';
import { useAiConversationMutations } from '../hooks/useAiConversationMutations';
import {
  createAiConversation,
  fetchAiConversationMessages,
  streamAiGenerate,
  uploadAiDocument,
} from '../api/ai-assist';
import { AiHeader } from '../components/ai-assist/AiHeader';
import { EmptyState } from '../components/ai-assist/EmptyState';
import { MessageBubble } from '../components/ai-assist/MessageBubble';
import { TypingIndicator } from '../components/ai-assist/TypingIndicator';
import { Composer } from '../components/ai-assist/Composer';
import { HistoryDrawer } from '../components/ai-assist/HistoryDrawer';
import { ShareSheet } from '../components/ai-assist/ShareSheet';
import { MoreSheet } from '../components/ai-assist/MoreSheet';
import { ChatOptionsSheet } from '../components/ai-assist/ChatOptionsSheet';
import { ReplyActionsSheet } from '../components/ai-assist/ReplyActionsSheet';
import { RenameDialog } from '../components/ai-assist/RenameDialog';
import { SummaryModal } from '../components/ai-assist/SummaryModal';
import { ConfirmDialog } from '../components/events/ConfirmDialog';
import type { Conversation, Message, MessageReaction, PaginationInfo } from '../types/ai-assist';
import type { AppStackParamList, MainTabParamList } from '../navigation/types';

/** AI Assist — functionality from `webSrc/src/app/dashboard/ai-assist/page.tsx` (conversations,
 * streaming generation, reactions, share/summarise/rename/delete/save, PDF upload), UI from the
 * `AIAssist.html` mobile mockup (empty/thread views, History Drawer, Prompt Library, bottom
 * sheets). See `/home/strivedge/.claude/plans/delightful-seeking-snowglobe.md` for the full
 * architecture writeup — streaming uses `streamAiGenerate`'s XHR-based SSE parser (no readable-
 * stream `fetch` support in this RN/Hermes configuration), export uses `Share.share()` instead of
 * web's `jspdf`/blob-download flow, and the History Drawer replaces web's permanent sidebar. */
export default function AiAssistScreen() {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'AiAssist'>>();
  // Separate from `navigation` above (tab-level) — `PromptLibrary` lives one level up on the
  // parent stack (`AppStackParamList`), same reasoning `MyResourcesScreen.tsx` already documents
  // for `stackNavigation`.
  const stackNavigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'AiAssist'>>();
  const { data: me } = useMe();
  const { conversations, isLoading: conversationsLoading, refetch: refetchConversations } = useAiConversations();
  const mutations = useAiConversationMutations();

  const [view, setView] = useState<'empty' | 'thread'>('empty');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState('New chat');
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [messageReactions, setMessageReactions] = useState<Record<string, MessageReaction>>({});
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareUrlLoading, setShareUrlLoading] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [chatMenuConversation, setChatMenuConversation] = useState<Conversation | null>(null);
  const [replyMenuMessageId, setReplyMenuMessageId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const listRef = useRef<FlatList<Message>>(null);
  const streamAbortRef = useRef<(() => void) | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const prevContentHeightRef = useRef(0);
  const pendingScrollAdjustRef = useRef<number | null>(null);
  // Matches webSrc's `lastScrollTime` debounce (`page.tsx:394-411`) — without it, rapid scroll
  // events (throttled at 32ms here) can fire `loadMoreMessages` more than once before the first
  // call's `setLoadingMore(true)` re-render lands, double-fetching/double-prepending a page.
  const lastLoadMoreAtRef = useRef(0);

  useEffect(() => () => streamAbortRef.current?.(), []);

  const isChatSaved = conversations.find(c => c.id === currentConversationId)?.is_saved ?? false;

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated }));
  }, []);

  const showToast = (text1: string, type: 'success' | 'error' | 'info' = 'success') =>
    Toast.show({ type, text1 });

  const resetToEmpty = useCallback(() => {
    streamAbortRef.current?.();
    streamAbortRef.current = null;
    setView('empty');
    setMessages([]);
    setCurrentConversationId(null);
    setChatTitle('New chat');
    setPagination(null);
    setLoading(false);
  }, []);

  const openConversation = useCallback(async (conversationId: string) => {
    setHistoryOpen(false);
    setView('thread');
    shouldAutoScrollRef.current = true;
    try {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) setChatTitle(conv.title);
      const { messages: msgs, pagination: pageInfo } = await fetchAiConversationMessages(conversationId, 1, 50);
      setMessages(
        msgs.map(m => ({ id: m.id, text: m.content, isUser: m.message_type === 'user', timestamp: new Date(m.created_at) })),
      );
      const reactions: Record<string, MessageReaction> = {};
      msgs.forEach(m => {
        if (m.reaction === 'like' || m.reaction === 'dislike') reactions[m.id] = m.reaction;
      });
      setMessageReactions(reactions);
      setCurrentConversationId(conversationId);
      setPagination(pageInfo);
      requestAnimationFrame(() => scrollToBottom(false));
    } catch {
      showToast('Failed to load chat', 'error');
    }
  }, [conversations, scrollToBottom]);

  const loadMoreMessages = useCallback(async () => {
    if (!currentConversationId || !pagination?.hasMore || loadingMore) return;
    setLoadingMore(true);
    prevContentHeightRef.current = 0; // captured via onContentSizeChange before this resolves
    try {
      const nextPage = pagination.currentPage + 1;
      const { messages: msgs, pagination: pageInfo } = await fetchAiConversationMessages(currentConversationId, nextPage, 50);
      const older = msgs.map(m => ({ id: m.id, text: m.content, isUser: m.message_type === 'user', timestamp: new Date(m.created_at) }));
      pendingScrollAdjustRef.current = prevContentHeightRef.current;
      setMessages(prev => [...older, ...prev]);
      setPagination(pageInfo);
    } catch {
      showToast('Failed to load older messages', 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [currentConversationId, pagination, loadingMore]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const now = Date.now();
    if (
      e.nativeEvent.contentOffset.y < 40 &&
      pagination?.hasMore &&
      !loadingMore &&
      now - lastLoadMoreAtRef.current > 500
    ) {
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
    }
    prevContentHeightRef.current = height;
  };

  // Matches webSrc's `start`-event handler (`page.tsx:653-661`): once the backend assigns a real
  // conversation (and generates its title server-side), refetch and adopt that title — otherwise
  // the thread header stays on the raw first-message text forever, diverging from what History
  // shows for the same chat.
  const syncTitleFromServer = useCallback(async (conversationId: string) => {
    try {
      const result = await refetchConversations();
      const conv = result.data?.find(c => c.id === conversationId);
      if (conv) setChatTitle(conv.title);
    } catch {
      // Non-critical — the locally-set title (raw first message) stays as a reasonable fallback.
    }
  }, [refetchConversations]);

  const generateContent = useCallback(async (userMessage: string) => {
    setLoading(true);
    shouldAutoScrollRef.current = true;
    const assistantId = `${Date.now()}-ai`;
    setMessages(prev => [...prev, { id: assistantId, text: '', isUser: false, timestamp: new Date() }]);

    const { abort } = await streamAiGenerate(
      { message: userMessage, conversationId: currentConversationId },
      {
        onStart: convId => {
          if (convId && !currentConversationId) {
            setCurrentConversationId(convId);
            syncTitleFromServer(convId);
          }
        },
        onToken: (_token, fullText) => {
          setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, text: fullText } : m)));
        },
        onDone: (finalText, convId) => {
          if (convId && !currentConversationId) setCurrentConversationId(convId);
          setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, text: finalText || m.text } : m)));
          setLoading(false);
          streamAbortRef.current = null;
          refetchConversations();
        },
        onError: message => {
          setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, text: message } : m)));
          setLoading(false);
          streamAbortRef.current = null;
        },
      },
    );
    streamAbortRef.current = abort;
  }, [currentConversationId, refetchConversations, syncTitleFromServer]);

  const handleAsk = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setView('thread');
    setHistoryOpen(false);
    if (!messages.length) setChatTitle(trimmed);
    setMessages(prev => [...prev, { id: `${Date.now()}-user`, text: trimmed, isUser: true, timestamp: new Date() }]);
    setInputText('');
    generateContent(trimmed);
  }, [loading, messages.length, generateContent]);

  const handleSend = () => handleAsk(inputText);

  // `PromptLibraryScreen` (a pushed screen, not a `Modal` anymore) can't return a value via
  // `goBack()`, so it navigates back into this tab with `selectedPrompt` set instead — the same
  // "deliver data into an already-mounted tab screen" pattern `MessagesScreen`'s
  // `openConversation` param already uses. Cleared via `setParams` once consumed, since this tab
  // screen stays mounted and a stale param would otherwise re-fire on the next focus.
  useEffect(() => {
    if (!route.params?.selectedPrompt) return;
    handleAsk(route.params.selectedPrompt);
    navigation.setParams({ selectedPrompt: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.selectedPrompt]);

  const handleReaction = (messageId: string, reaction: MessageReaction) => {
    const next = messageReactions[messageId] === reaction ? null : reaction;
    setMessageReactions(prev => {
      const updated = { ...prev };
      if (next === null) delete updated[messageId];
      else updated[messageId] = next;
      return updated;
    });
    mutations.react({ messageId, reaction: next });
  };

  const handleCopy = (text: string) => {
    if (!text.trim()) return;
    Clipboard.setString(text);
    showToast('Copied to clipboard ✓');
  };

  const handleAttach = async () => {
    if (isUploadingDocument || loading) return;
    try {
      const [picked] = await pick({ type: [types.pdf] });
      if (picked.type && picked.type !== 'application/pdf') {
        showToast('Only PDF files are allowed.', 'error');
        return;
      }
      if (picked.size && picked.size > 15 * 1024 * 1024) {
        showToast('File size must be 15 MB or less.', 'error');
        return;
      }
      setIsUploadingDocument(true);
      setUploadingFileName(picked.name ?? 'document.pdf');
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = await createAiConversation('New Chat');
        setCurrentConversationId(conversationId);
        setView('thread');
      }
      await uploadAiDocument(
        { uri: picked.uri, name: picked.name ?? 'document.pdf', size: picked.size ?? null, mimeType: picked.type ?? 'application/pdf' },
        conversationId,
      );
      setMessages(prev => [
        ...prev,
        { id: `${Date.now()}-upload`, text: `✅ Document uploaded: ${picked.name}. You can now ask questions about it.`, isUser: false, timestamp: new Date() },
      ]);
      showToast(`Uploaded ${picked.name} ✓`);
      refetchConversations();
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      // Matches webSrc's catch (`page.tsx:584`): surface the real backend error instead of a
      // fixed generic string, same shape webSrc's own `requestBackend` extracts errors in.
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message
        : err instanceof Error
        ? err.message
        : undefined;
      showToast(message || 'Failed to upload document', 'error');
    } finally {
      setIsUploadingDocument(false);
      setUploadingFileName('');
    }
  };

  const handleToggleBookmark = () => {
    if (!currentConversationId) return;
    mutations.toggleSave({ id: currentConversationId, isSaved: !isChatSaved });
  };

  const handleOpenShare = async () => {
    if (!currentConversationId) return;
    setShareOpen(true);
    setShareUrl('');
    setShareUrlLoading(true);
    try {
      const url = await mutations.share(currentConversationId);
      if (url) setShareUrl(url);
    } finally {
      setShareUrlLoading(false);
    }
  };

  const handleSummarise = async (messageId: string) => {
    setSummaryOpen(true);
    setSummaryText('');
    setSummaryLoading(true);
    try {
      const summary = await mutations.summarise(messageId);
      setSummaryText(summary);
    } catch {
      setSummaryText('Failed to generate summary — please try again.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleExportChat = async () => {
    if (!messages.length) {
      showToast('No messages to export', 'error');
      return;
    }
    const body = messages
      .filter(m => m.text.trim())
      .map(m => `**${m.isUser ? 'You' : 'AI Assist'}**\n${m.text}`)
      .join('\n\n---\n\n');
    try {
      await Share.share({ message: `${chatTitle}\n\n${body}` });
    } catch {
      // User dismissed the share sheet — not an error.
    }
  };

  const handleExportMessage = async (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    try {
      await Share.share({ message: msg.text });
    } catch {
      // Dismissed — not an error.
    }
  };

  const handleConfirmRename = (title: string) => {
    if (!renameTarget) return;
    if (renameTarget.id === currentConversationId) setChatTitle(title);
    mutations.rename({ id: renameTarget.id, title });
    setRenameTarget(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    mutations.remove(deleteTarget.id);
    if (deleteTarget.id === currentConversationId) resetToEmpty();
    setDeleteTarget(null);
  };

  const greetingName = me?.name?.split(' ')[0] ?? null;
  const askedTurns = messages.filter(m => m.isUser).length;
  const threadMeta = `${askedTurns} ${askedTurns === 1 ? 'question' : 'questions'} · AI Assist`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      {view === 'empty' ? (
        <AiHeader
          view="empty"
          onOpenMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
          onOpenHistory={() => setHistoryOpen(true)}
          onBellPress={() => showToast('3 new notifications', 'info')}
        />
      ) : (
        <AiHeader
          view="thread"
          threadTitle={chatTitle}
          threadMeta={threadMeta}
          bookmarked={isChatSaved}
          onBack={() => setView('empty')}
          onNewChat={resetToEmpty}
          onToggleBookmark={handleToggleBookmark}
          onShare={handleOpenShare}
          onMore={() => setMoreOpen(true)}
        />
      )}

      {/* `behavior: undefined` on Android is a no-op — the composer rendered hidden behind the
          keyboard because of it, even with the manifest's `windowSoftInputMode="adjustResize"`.
          `'height'` is the standard Android pairing (`'padding'` stays iOS-only, RN's own
          recommendation). */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {view === 'empty' ? (
          <EmptyState
            greetingName={greetingName}
            onAsk={handleAsk}
            onOpenLibraryForCategory={category => stackNavigation.navigate('PromptLibrary', { initialCategory: category })}
          />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={{ padding: 16, gap: 16 }}
            onScroll={handleScroll}
            onContentSizeChange={handleContentSizeChange}
            scrollEventThrottle={32}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => {
              const isLast = index === messages.length - 1;
              // While the assistant's reply is still an empty placeholder (no tokens have
              // streamed in yet), show only the typing dots — not both the dots AND a message
              // card with a bare "…" and a live Copy/Like/Dislike row for content that doesn't
              // exist yet. Once the first token arrives `item.text` is non-empty and this swaps
              // over to the real `MessageBubble`.
              const isPendingAssistant = isLast && loading && !item.isUser && !item.text;
              return (
                <View style={{ gap: 16 }}>
                  {isPendingAssistant ? (
                    <TypingIndicator />
                  ) : (
                    <MessageBubble
                      message={item}
                      reaction={messageReactions[item.id]}
                      onCopy={() => handleCopy(item.text)}
                      onReact={reaction => handleReaction(item.id, reaction)}
                      onMore={() => setReplyMenuMessageId(item.id)}
                    />
                  )}
                </View>
              );
            }}
          />
        )}

        {/* Upload progress banner — matches webSrc's `page.tsx:1113-1129` (spinner + filename +
            informational copy). No Cancel button: web's own Cancel is dead code there (its
            `AbortController` is never actually wired to the request, confirmed by reading
            `handleCancelDocumentUpload`/`handleDocumentUpload`), so omitting it isn't a
            regression — a non-functional button isn't worth reproducing. */}
        {isUploadingDocument && (
          <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 12,
                borderRadius: radius.xl,
                borderWidth: borderWidth.thin,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <ActivityIndicator size="small" color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={[fonts.medium, { fontSize: fontSize.body, color: colors.ink }]}>
                  Uploading {uploadingFileName || 'document'}…
                </Text>
                <Text style={[fonts.regular, { fontSize: fontSize.small, color: colors.ink3, marginTop: 2 }]}>
                  AI will use document context after processing completes.
                </Text>
              </View>
            </View>
          </View>
        )}

        <Composer
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onOpenLibrary={() => stackNavigation.navigate('PromptLibrary', { initialCategory: 'all' })}
          onAttach={handleAttach}
          isUploadingDocument={isUploadingDocument}
          disabled={loading}
        />

        {/* Disclaimer — matches webSrc's `page.tsx:1419-1422`, shown under the composer at all
            times. Same `colors.surface` background as the `Composer` card above it (not the page
            background) so the two read as one continuous bottom block instead of the text
            appearing to float separately. */}
        <View style={{ backgroundColor: colors.surface, paddingBottom: 8 }}>
          <Text
            style={[
              fonts.regular,
              {
                textAlign: 'center',
                fontSize: 10,
                color: colors.ink3,
                opacity: 0.7,
                paddingHorizontal: 16,
              },
            ]}
          >
            AI Assist can make mistakes. Verify important deal and tax information independently.
          </Text>
        </View>
      </KeyboardAvoidingView>

      <HistoryDrawer
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        conversations={conversations}
        loading={conversationsLoading}
        activeConversationId={currentConversationId}
        onSelect={openConversation}
        onNewChat={resetToEmpty}
        onOpenMenu={setChatMenuConversation}
        onOpenLibrary={() => {
          setHistoryOpen(false);
          stackNavigation.navigate('PromptLibrary', { initialCategory: 'all' });
        }}
      />

      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        shareUrl={shareUrl}
        loading={shareUrlLoading}
        onCopy={() => {
          if (!shareUrl) return;
          Clipboard.setString(shareUrl);
          showToast('Link copied ✓');
        }}
      />

      <MoreSheet
        visible={moreOpen}
        onClose={() => setMoreOpen(false)}
        bookmarked={isChatSaved}
        onRename={() => currentConversationId && setRenameTarget({ id: currentConversationId, title: chatTitle })}
        onToggleBookmark={handleToggleBookmark}
        onExport={handleExportChat}
        onDelete={() => currentConversationId && setDeleteTarget({ id: currentConversationId, title: chatTitle })}
      />

      <ChatOptionsSheet
        visible={!!chatMenuConversation}
        onClose={() => setChatMenuConversation(null)}
        conversation={chatMenuConversation}
        onOpen={() => chatMenuConversation && openConversation(chatMenuConversation.id)}
        onRename={() => chatMenuConversation && setRenameTarget({ id: chatMenuConversation.id, title: chatMenuConversation.title })}
        onToggleSave={() =>
          chatMenuConversation &&
          mutations.toggleSave({ id: chatMenuConversation.id, isSaved: !chatMenuConversation.is_saved })
        }
        onShare={async () => {
          if (!chatMenuConversation) return;
          const id = chatMenuConversation.id;
          setCurrentConversationId(id);
          await handleOpenShare();
        }}
        onDelete={() => chatMenuConversation && setDeleteTarget({ id: chatMenuConversation.id, title: chatMenuConversation.title })}
      />

      <ReplyActionsSheet
        visible={!!replyMenuMessageId}
        onClose={() => setReplyMenuMessageId(null)}
        onSummarise={() => replyMenuMessageId && handleSummarise(replyMenuMessageId)}
        onRegenerate={() => showToast('Regenerating answer…', 'info')}
        onExport={() => replyMenuMessageId && handleExportMessage(replyMenuMessageId)}
        onShare={handleOpenShare}
      />

      <RenameDialog
        visible={!!renameTarget}
        initialValue={renameTarget?.title ?? ''}
        onConfirm={handleConfirmRename}
        onCancel={() => setRenameTarget(null)}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete chat?"
        message={`"${deleteTarget?.title ?? ''}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <SummaryModal
        visible={summaryOpen}
        loading={summaryLoading}
        summary={summaryText}
        onClose={() => setSummaryOpen(false)}
      />
    </View>
  );
}
