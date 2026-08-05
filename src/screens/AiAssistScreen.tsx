import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Share,
  View,
} from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
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
import { FollowUpPrompts } from '../components/ai-assist/FollowUpPrompts';
import { Composer } from '../components/ai-assist/Composer';
import { HistoryDrawer } from '../components/ai-assist/HistoryDrawer';
import { PromptLibrary } from '../components/ai-assist/PromptLibrary';
import { ShareSheet } from '../components/ai-assist/ShareSheet';
import { MoreSheet } from '../components/ai-assist/MoreSheet';
import { ChatOptionsSheet } from '../components/ai-assist/ChatOptionsSheet';
import { ReplyActionsSheet } from '../components/ai-assist/ReplyActionsSheet';
import { RenameDialog } from '../components/ai-assist/RenameDialog';
import { SummaryModal } from '../components/ai-assist/SummaryModal';
import { ConfirmDialog } from '../components/events/ConfirmDialog';
import type { Conversation, Message, MessageReaction, PaginationInfo } from '../types/ai-assist';

const ALL_SUGGESTED_PROMPTS = [
  'Analyze this SaaS business for acquisition readiness',
  'What questions should I ask during management diligence?',
  'Explain EBITDA vs adjusted EBITDA with examples',
  'Create a quick investment memo outline',
  'What are common red flags in financial statements?',
  'How do earn-outs typically work in M&A deals?',
  'Evaluate churn risk for a B2B SaaS company',
  'What metrics matter most for a marketplace business?',
  'Help me draft an LOI structure',
  'Explain quality of earnings (QoE)',
  'How should I value a services-based company?',
  'What legal risks should I watch for pre-acquisition?',
];

function pickRandomPrompts(count: number) {
  return [...ALL_SUGGESTED_PROMPTS].sort(() => 0.5 - Math.random()).slice(0, count);
}

/** AI Assist — functionality from `webSrc/src/app/dashboard/ai-assist/page.tsx` (conversations,
 * streaming generation, reactions, share/summarise/rename/delete/save, PDF upload), UI from the
 * `AIAssist.html` mobile mockup (empty/thread views, History Drawer, Prompt Library, bottom
 * sheets). See `/home/strivedge/.claude/plans/delightful-seeking-snowglobe.md` for the full
 * architecture writeup — streaming uses `streamAiGenerate`'s XHR-based SSE parser (no readable-
 * stream `fetch` support in this RN/Hermes configuration), export uses `Share.share()` instead of
 * web's `jspdf`/blob-download flow, and the History Drawer replaces web's permanent sidebar. */
export default function AiAssistScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
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
  const [suggestedPrompts] = useState(() => pickRandomPrompts(3));
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryCategory, setLibraryCategory] = useState('all');
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
    if (e.nativeEvent.contentOffset.y < 40 && pagination?.hasMore && !loadingMore) {
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

  const generateContent = useCallback(async (userMessage: string) => {
    setLoading(true);
    shouldAutoScrollRef.current = true;
    const assistantId = `${Date.now()}-ai`;
    setMessages(prev => [...prev, { id: assistantId, text: '', isUser: false, timestamp: new Date() }]);

    const { abort } = await streamAiGenerate(
      { message: userMessage, conversationId: currentConversationId },
      {
        onStart: convId => {
          if (convId && !currentConversationId) setCurrentConversationId(convId);
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
  }, [currentConversationId, refetchConversations]);

  const handleAsk = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setView('thread');
    setLibraryOpen(false);
    setHistoryOpen(false);
    if (!messages.length) setChatTitle(trimmed);
    setMessages(prev => [...prev, { id: `${Date.now()}-user`, text: trimmed, isUser: true, timestamp: new Date() }]);
    setInputText('');
    generateContent(trimmed);
  }, [loading, messages.length, generateContent]);

  const handleSend = () => handleAsk(inputText);

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
      showToast('Failed to upload document', 'error');
    } finally {
      setIsUploadingDocument(false);
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
  const lastMessage = messages[messages.length - 1];
  const showFollowups = view === 'thread' && !loading && messages.length > 1 && !!lastMessage && !lastMessage.isUser;

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
            onOpenLibraryForCategory={category => {
              setLibraryCategory(category);
              setLibraryOpen(true);
            }}
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
                  {isLast && showFollowups ? (
                    <FollowUpPrompts prompts={suggestedPrompts} onSelect={handleAsk} />
                  ) : null}
                </View>
              );
            }}
          />
        )}

        <Composer
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onOpenLibrary={() => {
            setLibraryCategory('all');
            setLibraryOpen(true);
          }}
          onAttach={handleAttach}
          isUploadingDocument={isUploadingDocument}
          disabled={loading}
        />
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
          setLibraryCategory('all');
          setLibraryOpen(true);
        }}
      />

      <PromptLibrary
        visible={libraryOpen}
        initialCategory={libraryCategory}
        onClose={() => setLibraryOpen(false)}
        onSelectPrompt={text => {
          setLibraryOpen(false);
          handleAsk(text);
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
