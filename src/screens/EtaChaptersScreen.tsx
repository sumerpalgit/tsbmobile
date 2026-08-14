import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { useTheme } from '../theme';
import { useMe } from '../hooks/useMe';
import { useMyEtaChapters } from '../hooks/useMyEtaChapters';
import { useEtaChapterMutations } from '../hooks/useEtaChapterMutations';
import { useWebSocket } from '../store/SocketContext';
import { fetchEtaGroupMemberCount, fetchEtaGroupMessages, searchEtaChapters, sendEtaGroupMessage } from '../api/eta';
import { initConversation, leaveConversation } from '../api/wsConversation';
import { appendUniqueMessages, groupMessages } from '../types/messages';
import type { AppStackParamList, DrawerParamList } from '../navigation/types';
import type { EtaGroup } from '../types/etaChapters';
import type { Message, PaginationInfo } from '../types/messages';
import { Bell, Calendar, LogOut, Users } from 'lucide-react-native';
import { ConfirmDialog } from '../components/events/ConfirmDialog';
import { ThreadMessageGroup, DayDivider } from '../components/messages/ThreadMessageBubble';
import { ActionSheet } from '../components/ai-assist/ActionSheet';
import { EtaChaptersHeader } from '../components/etaChapters/EtaChaptersHeader';
import { ChapterHero } from '../components/etaChapters/ChapterHero';
import { PrimaryMembershipsBanner, MAX_ACTIVE_ETA_CHAPTERS } from '../components/etaChapters/PrimaryMembershipsBanner';
import { MyChaptersCarousel } from '../components/etaChapters/MyChaptersCarousel';
import { ChapterListControls, ChapterListView } from '../components/etaChapters/ChapterListControls';
import { AllChapterCard } from '../components/etaChapters/AllChapterCard';
import { ChapterListSkeleton } from '../components/etaChapters/ChapterListSkeleton';
import { ChapterDetailView } from '../components/etaChapters/ChapterDetailView';
import { ManageMembershipsSheet } from '../components/etaChapters/ManageMembershipsSheet';
import { ChapterReplacePicker } from '../components/etaChapters/ChapterReplacePicker';
import { ChapterChatHeader } from '../components/etaChapters/ChapterChatHeader';
import { ChapterChatComposer } from '../components/etaChapters/ChapterChatComposer';
import { ChapterChatListScreen } from '../components/etaChapters/ChapterChatListScreen';
import { CommunityGuidelinesSheet } from '../components/etaChapters/CommunityGuidelinesSheet';
import { hasAcceptedGuidelines, markGuidelinesAccepted } from '../components/etaChapters/guidelinesSession';
import { CreateChapterScreen } from '../components/etaChapters/CreateChapterScreen';
import { ChapterPreviewSheet } from '../components/etaChapters/ChapterPreviewSheet';
import { ChapterOptionsSheet } from '../components/etaChapters/ChapterOptionsSheet';
import { ChapterNotificationPrefsModal } from '../components/etaChapters/ChapterNotificationPrefsModal';
import { InviteOthersScreen } from '../components/etaChapters/InviteOthersScreen';
import { ChapterMessageSearchScreen } from '../components/etaChapters/ChapterMessageSearchScreen';
import { ChapterAdBanner } from '../components/etaChapters/ChapterAdBanner';
import { ChapterUpcomingEventsSheet } from '../components/etaChapters/ChapterUpcomingEventsSheet';

const SEARCH_MIN_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 500;

type ChatThreadItem =
  | { key: string; kind: 'day'; label: string }
  | { key: string; kind: 'group'; group: ReturnType<typeof groupMessages>[number]['groups'][number]; senderName: string };

/**
 * ETA Chapters — functionality from `webSrc/src/app/dashboard/my-eta-chapters/page.tsx`, UI from
 * the `ETAChapters.html` mobile mockup. This first build phase covers the main dashboard: hero,
 * primary-memberships banner, my-chapters carousel, and the searchable/paginated all-chapters
 * grid with join/leave. Chapter detail, chat, manage sheet, create-chapter, invites, members
 * directory and ads are later phases (see the plan's "Recommended build order").
 *
 * Drops the mockup's "Spotlight card"/"Trending this month" sections — both are `display:none`
 * in the mockup itself with no state driving them, i.e. dead/unreachable UI, not a real part of
 * the design to port.
 */
function EtaChaptersScreen() {
  const { colors, fonts, fontSize, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  // Separate from `navigation` above (drawer-level) — `CreateAdCampaign` lives one level up on
  // the parent stack (`AppStackParamList`), same reasoning `DrawerNavigator.tsx` itself documents
  // for why Notifications/Profile are reached that way rather than through the drawer navigator.
  const stackNavigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data: me } = useMe();

  const { tab, setTab, myChapters, chapters, pagination, tabCounts, localCountryName, isLoading, loadMore, refetch } = useMyEtaChapters();
  const { joinGroup, leaveGroup, isLeaving, requestCity, isRequestingCity } = useEtaChapterMutations();

  const [query, setQuery] = useState('');
  // Mockup's own default state is `view: 'list'` (rows), not grid — confirmed in
  // `ETAChapters_decoded.html`'s initial `state` object.
  const [view, setView] = useState<ChapterListView>('rows');
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<EtaGroup[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [pendingRejoinByGroup, setPendingRejoinByGroup] = useState<Record<string, string | null>>({});
  const [detailChapter, setDetailChapter] = useState<EtaGroup | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<EtaGroup | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [leaveConfirmChapter, setLeaveConfirmChapter] = useState<EtaGroup | null>(null);
  const [joinConfirmChapter, setJoinConfirmChapter] = useState<EtaGroup | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Phase 4 overlays ────────────────────────────────────────────────────────────────────────
  const [createChapterOpen, setCreateChapterOpen] = useState(false);
  const [previewChapter, setPreviewChapter] = useState<EtaGroup | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [notifPrefsChapter, setNotifPrefsChapter] = useState<EtaGroup | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [cardSettingsChapter, setCardSettingsChapter] = useState<EtaGroup | null>(null);
  const [upcomingEventsChapter, setUpcomingEventsChapter] = useState<EtaGroup | null>(null);

  const handleCreateChapterSubmit = async (payload: { city: string; country: string; chapterName: string; reason: string; connection: string }) => {
    try {
      await requestCity(payload);
      refetch();
      return true;
    } catch {
      return false;
    }
  };

  /** "View member directory" navigates to the app's real Directory tab, scoped to this chapter —
   * matches web's `router.push('/dashboard/directory?group_id=...&chapterName=...')`. Directory
   * is now a real feature (was a Phase-7 placeholder when this only did a bare tab switch with no
   * params threaded through), so the chapter scope now actually carries over instead of landing
   * on an unfiltered list. */
  const handleViewMemberDirectory = (chapter: EtaGroup | null) => {
    if (!chapter) return;
    navigation.navigate('Tabs', { screen: 'Directory', params: { groupId: chapter.id, chapterName: chapter.name } });
  };

  // ── Chapter chat state (mirrors MessagesScreen.tsx's proven WS/pagination/optimistic-send
  // pattern exactly, pointed at the group-chat endpoints instead of DM ones) ──────────────────
  const [chatListOpen, setChatListOpen] = useState(false);
  const [guidelineChapter, setGuidelineChapter] = useState<EtaGroup | null>(null);
  const [guidelineViewOnly, setGuidelineViewOnly] = useState(false);
  const [activeChatChapter, setActiveChatChapter] = useState<EtaGroup | null>(null);
  const [chatMemberCount, setChatMemberCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [loadingChatMessages, setLoadingChatMessages] = useState(false);
  const [chatPagination, setChatPagination] = useState<PaginationInfo | null>(null);
  const [loadingMoreChat, setLoadingMoreChat] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const chatListRef = useRef<FlatList<ChatThreadItem>>(null);
  const shouldAutoScrollRef = useRef(true);
  const prevContentHeightRef = useRef(0);
  const pendingScrollAdjustRef = useRef<number | null>(null);
  const lastLoadMoreAtRef = useRef(0);
  // Content can keep growing for a bit after the first `onContentSizeChange` fires — most often
  // `ChapterAdBanner`'s async ad fetch popping in a ~130px banner it rendered as `null` while
  // loading, or a message avatar image resolving its real dimensions — so a single scroll-to-
  // bottom right after opening a chat can land short of the true bottom. Matches
  // `MessagesScreen.tsx`'s own `autoScrollSettleTimerRef`: instead of clearing `shouldAutoScrollRef`
  // on the first growth, this timer pushes the "stop tracking" moment back on every further growth
  // and only lets go after a brief quiet period.
  const autoScrollSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeChatChapterRef = useRef<EtaGroup | null>(null);
  useEffect(() => {
    activeChatChapterRef.current = activeChatChapter;
  }, [activeChatChapter]);

  // Registers this socket into the open chapter's broadcast room — matches web's own `useEffect`
  // keyed on `selectedGroup` in `my-eta-chapters/page.tsx` (`initEtaConversation`/
  // `leaveEtaConversation`). This was missing entirely on mobile and is the actual root cause of
  // live messages from web never arriving: group broadcasts are room-scoped on the WS server, not
  // sent to every connected socket, so without this call mobile's socket was never a member of
  // any chapter's room regardless of who sent the message. See `api/wsConversation.ts`.
  useEffect(() => {
    if (!activeChatChapter) return;
    const id = activeChatChapter.id;
    initConversation(id);
    return () => {
      leaveConversation(id);
    };
  }, [activeChatChapter]);

  const scrollChatToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => chatListRef.current?.scrollToEnd({ animated }));
  }, []);

  // Manual keyboard tracking instead of `KeyboardAvoidingView` — same root cause as
  // `ChangePasswordSheet.tsx`/`ContributeResourceSheet.tsx`/`CreateChapterScreen.tsx`'s own doc
  // comments: `KeyboardAvoidingView`'s resize behavior doesn't reliably apply in this app's more
  // deeply-nested screens (there it was a `Modal`; here it's this screen's position inside the
  // Drawer navigator), leaving the composer sitting under the keyboard and, on dismiss, a
  // residual empty gap where the miscalculated height never fully resets. `marginBottom:
  // chatKeyboardHeight` on the chat column reproduces what `KeyboardAvoidingView` was meant to do,
  // and — since we now own the show/hide event directly — also re-scrolls to the newest message
  // once the keyboard has finished animating in, which nothing was doing before.
  const [chatKeyboardHeight, setChatKeyboardHeight] = useState(0);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      setChatKeyboardHeight(e.endCoordinates?.height ?? 0);
      if (activeChatChapterRef.current) {
        setTimeout(() => scrollChatToBottom(true), 50);
      }
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setChatKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollChatToBottom]);

  // Matches web's `handleIncomingMessage` filtering for `NEW_MESSAGE` events scoped to a
  // `group_id` — only appends when it matches the chapter currently open in this screen.
  // `String(...)` on both sides of the id comparison guards against the raw socket payload's
  // `group_id` arriving as a different primitive type than `EtaGroup.id` (always normalized to a
  // string by `api/eta.ts`'s `mapGroup`-style helpers) — a real REST-vs-WS type mismatch would
  // silently fail every `!==` check and drop every live message for that chapter.
  const handleIncomingChatMessage = useCallback(
    (data: any) => {
      if (data?.type !== 'NEW_MESSAGE') return;
      const m = data.payload;
      if (!m || m.sender_id === me?.id) return;
      const groupId = m.group_id;
      if (!groupId || String(groupId) !== activeChatChapterRef.current?.id) return;
      setChatMessages(prev => {
        if (prev.some(msg => msg.id === m.id)) return prev;
        shouldAutoScrollRef.current = true;
        return [
          ...prev,
          {
            id: m.id,
            message: m.message,
            created_at: m.created_at,
            isSenderMe: false,
            // Unlike the REST fetch (`fetchEtaGroupMessages`), which nests sender info under a
            // `sender` object, the raw WS `NEW_MESSAGE` payload for group/chapter chat sends flat
            // `sender_name`/`sender_username`/`sender_profile_img` fields instead — confirmed
            // against web's own `handleIncomingMessage` (`my-eta-chapters/page.tsx:799`), which
            // reads these same flat fields rather than a nested `m.sender`.
            sender: { name: m.sender_name || 'Unknown', username: m.sender_username, profile_img: m.sender_profile_img },
          },
        ];
      });
    },
    [me],
  );
  useWebSocket(handleIncomingChatMessage);

  const openChat = useCallback(
    async (chapter: EtaGroup) => {
      setActiveChatChapter(chapter);
      setChatMessages([]);
      setChatPagination(null);
      setLoadingChatMessages(true);
      setChatInput('');
      shouldAutoScrollRef.current = true;
      fetchEtaGroupMemberCount(chapter.id)
        .then(setChatMemberCount)
        .catch(() => setChatMemberCount(chapter.memberCount ?? 0));
      try {
        const { messages: msgs, pagination: pageInfo } = await fetchEtaGroupMessages(chapter.id, 1, 20);
        setChatMessages(appendUniqueMessages([], msgs));
        setChatPagination(pageInfo);
        requestAnimationFrame(() => scrollChatToBottom(false));
      } catch {
        // No visible error state on failure — matches web (console.error only).
      } finally {
        setLoadingChatMessages(false);
      }
    },
    [scrollChatToBottom],
  );

  /** Gates chat behind the Community Guidelines sheet the first time this chapter is opened
   * this app session — matches web's per-chapter `sessionStorage` gate. */
  const openChatFlow = useCallback(
    (chapter: EtaGroup) => {
      if (!hasAcceptedGuidelines(chapter.id)) {
        setGuidelineViewOnly(false);
        setGuidelineChapter(chapter);
        return;
      }
      openChat(chapter);
    },
    [openChat],
  );

  /** Matches the mockup's real `closeChat` (`ETAChapters_decoded.html:1841`) — back from an open
   * chat always returns to the Chat List screen, not the main dashboard, regardless of which
   * entry point the chat was opened from (chat list, "Open member chat", switch-chapter, etc). */
  const closeChat = () => {
    setActiveChatChapter(null);
    setChatMessages([]);
    setChatListOpen(true);
  };

  const loadMoreChatMessages = useCallback(async () => {
    if (!activeChatChapter || !chatPagination?.hasMore || loadingMoreChat) return;
    setLoadingMoreChat(true);
    prevContentHeightRef.current = 0;
    try {
      const nextPage = chatPagination.currentPage + 1;
      const { messages: older, pagination: pageInfo } = await fetchEtaGroupMessages(activeChatChapter.id, nextPage, 50);
      pendingScrollAdjustRef.current = prevContentHeightRef.current;
      setChatMessages(prev => appendUniqueMessages(older, prev));
      setChatPagination(pageInfo);
    } catch {
      // Matches web — silently keeps prior state on failure.
    } finally {
      setLoadingMoreChat(false);
    }
  }, [activeChatChapter, chatPagination, loadingMoreChat]);

  const handleChatScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const now = Date.now();
    if (e.nativeEvent.contentOffset.y < 40 && chatPagination?.hasMore && !loadingMoreChat && now - lastLoadMoreAtRef.current > 500) {
      lastLoadMoreAtRef.current = now;
      loadMoreChatMessages();
    }
  };

  const handleChatContentSizeChange = (_w: number, height: number) => {
    if (pendingScrollAdjustRef.current !== null) {
      const delta = height - pendingScrollAdjustRef.current;
      if (delta > 0) chatListRef.current?.scrollToOffset({ offset: delta, animated: false });
      pendingScrollAdjustRef.current = null;
    } else if (shouldAutoScrollRef.current) {
      scrollChatToBottom(false);
      if (autoScrollSettleTimerRef.current) clearTimeout(autoScrollSettleTimerRef.current);
      autoScrollSettleTimerRef.current = setTimeout(() => {
        shouldAutoScrollRef.current = false;
        autoScrollSettleTimerRef.current = null;
      }, 400);
    }
    prevContentHeightRef.current = height;
  };

  const sendChatTextOptimistic = useCallback(
    async (text: string) => {
      if (!activeChatChapter) return;
      const tempId = `temp-${Date.now()}`;
      const tempMsg: Message = {
        id: tempId,
        message: text,
        created_at: new Date().toISOString(),
        isSenderMe: true,
        sender: { name: me?.name || 'You', username: me?.username, profile_img: me?.profileImg },
      };
      setChatMessages(prev => appendUniqueMessages(prev, [tempMsg]));
      shouldAutoScrollRef.current = true;
      try {
        const saved = await sendEtaGroupMessage(activeChatChapter.id, text);
        setChatMessages(prev => prev.map(m => (m.id === tempId ? { ...m, id: saved.id, created_at: saved.created_at } : m)));
      } catch {
        setChatMessages(prev => prev.filter(m => m.id !== tempId));
        setChatInput(text);
        Toast.show({ type: 'error', text1: 'Message not sent', text2: 'Please try again.' });
      }
    },
    [activeChatChapter, me],
  );

  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text || !activeChatChapter) return;
    setChatInput('');
    sendChatTextOptimistic(text);
  };

  const handleAcceptGuidelines = () => {
    if (!guidelineChapter) return;
    markGuidelinesAccepted(guidelineChapter.id);
    const target = guidelineChapter;
    const viewOnly = guidelineViewOnly;
    setGuidelineChapter(null);
    if (!viewOnly) openChat(target);
  };

  const trimmedQuery = query.trim();
  const isActivelySearching = trimmedQuery.length >= SEARCH_MIN_LENGTH;

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!isActivelySearching) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchEtaChapters(trimmedQuery);
        setSearchResults(results as unknown as EtaGroup[]);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [trimmedQuery, isActivelySearching]);

  const myChapterIds = useMemo(() => new Set(myChapters.map(c => c.id)), [myChapters]);
  const isMember = (chapter: EtaGroup) => chapter.isMember ?? myChapterIds.has(chapter.id);

  const shown = isActivelySearching ? searchResults.filter(c => !isMember(c)) : chapters;
  const showingSkeleton = isActivelySearching ? isSearching : isLoading && chapters.length === 0;

  const handleRefresh = () => {
    setRefreshing(true);
    refetch(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  /** Tap-target entry point for every "Join" button in the app (card, detail, preview, chat-list
   * picker) — gates into whichever confirmation the situation calls for, never calls the join
   * API directly. Matches web's `handleJoinGroup`, which always opens a confirm modal first
   * (`JoinChapterModal`) rather than joining immediately on tap. */
  const handleJoin = (chapter: EtaGroup) => {
    if (isMember(chapter)) {
      openChatFlow(chapter);
      return;
    }
    if (myChapters.length >= MAX_ACTIVE_ETA_CHAPTERS) {
      // Real cap-replace flow (matches web's `JoinChapterModal` replace-picker) — itself the
      // confirmation step for this case, so it doesn't also go through `joinConfirmChapter`.
      setReplaceTarget(chapter);
      return;
    }
    setJoinConfirmChapter(chapter);
  };

  /** The actual join API call — only reached after `joinConfirmChapter`'s dialog is confirmed. */
  const performJoin = async (chapter: EtaGroup) => {
    setJoiningId(chapter.id);
    try {
      const res = await joinGroup(chapter.id);
      if (res.status === 'pending_rejoin') {
        setPendingRejoinByGroup(prev => ({ ...prev, [chapter.id]: res.accepted_at ?? null }));
        Toast.show({ type: 'info', text1: res.message ?? 'Rejoin scheduled', text2: 'A 30-day cooldown applies after leaving a chapter.' });
        return;
      }
      refetch(true);
      Toast.show({ type: 'success', text1: 'Joined chapter successfully' });
      setDetailChapter(null);
    } catch {
      // useEtaChapterMutations already shows an error toast.
    } finally {
      setJoiningId(null);
    }
  };

  const handleConfirmJoin = () => {
    if (!joinConfirmChapter) return;
    const chapter = joinConfirmChapter;
    setJoinConfirmChapter(null);
    performJoin(chapter);
  };

  const handleConfirmReplace = async (replaceChapterId: string) => {
    if (!replaceTarget) return;
    setIsReplacing(true);
    try {
      await leaveGroup(replaceChapterId);
      const res = await joinGroup(replaceTarget.id);
      if (res.status === 'pending_rejoin') {
        setPendingRejoinByGroup(prev => ({ ...prev, [replaceTarget.id]: res.accepted_at ?? null }));
        Toast.show({ type: 'info', text1: res.message ?? 'Rejoin scheduled' });
      } else {
        Toast.show({ type: 'success', text1: `Switched to ${replaceTarget.name}` });
      }
      refetch(true);
      setReplaceTarget(null);
      setDetailChapter(null);
    } catch {
      Toast.show({ type: 'error', text1: 'Unable to switch chapters right now', text2: 'Please try again.' });
    } finally {
      setIsReplacing(false);
    }
  };

  const handleConfirmLeave = async () => {
    if (!leaveConfirmChapter) return;
    try {
      await leaveGroup(leaveConfirmChapter.id);
      refetch(true);
      setLeaveConfirmChapter(null);
      setDetailChapter(null);
      Toast.show({ type: 'success', text1: 'You have left this chapter', text2: 'Rejoining has a 30-day cooldown.' });
    } catch {
      // useEtaChapterMutations already shows an error toast.
    }
  };

  const emptyTitle = isActivelySearching ? 'No chapters found' : `No ${tab} chapters available yet.`;
  const emptyBody = isActivelySearching
    ? `Nothing matches "${trimmedQuery}". Try a country, or suggest a new chapter for your city.`
    : null;

  const totalForTab = tab === 'local' ? tabCounts.local : tabCounts.international;
  const countLabel = isActivelySearching
    ? `${shown.length} matching "${trimmedQuery}"`
    : `Showing ${chapters.length} of ${totalForTab ?? chapters.length} ${tab} chapters`;

  const chatThreadItems: ChatThreadItem[] = [];
  groupMessages(chatMessages).forEach((dateGroup, di) => {
    chatThreadItems.push({ key: `day-${di}`, kind: 'day', label: dateGroup.dateLabel });
    dateGroup.groups.forEach((group, gi) => {
      chatThreadItems.push({ key: `group-${di}-${gi}`, kind: 'group', group, senderName: group.senderName });
    });
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.pageBg }]}>
      {activeChatChapter ? (
        <View style={[styles.screen, { marginBottom: chatKeyboardHeight }]}>
          <ChapterChatHeader
            name={activeChatChapter.name}
            memberCount={chatMemberCount}
            isMember={isMember(activeChatChapter)}
            onBack={closeChat}
            onInvite={() => setInviteOpen(true)}
            onOptions={() => setOptionsOpen(true)}
          />

          {loadingChatMessages && chatThreadItems.length === 0 ? (
            <View style={styles.chatLoading}>
              <ActivityIndicator size="small" color={colors.gold} />
            </View>
          ) : (
            <FlatList
              ref={chatListRef}
              data={chatThreadItems}
              keyExtractor={item => item.key}
              contentContainerStyle={styles.chatListContent}
              onScroll={handleChatScroll}
              onContentSizeChange={handleChatContentSizeChange}
              scrollEventThrottle={32}
              keyboardDismissMode="none"
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <View style={styles.chatHeaderItems}>
                  <View style={[styles.welcomeBanner, { backgroundColor: colors.chip, borderRadius: radius.xl }]}>
                    <Text style={[fonts.regular, styles.welcomeText, { color: colors.goldDark }]}>
                      Welcome to {activeChatChapter.name} — connect with ETA professionals, share insights and build
                      your network.
                    </Text>
                  </View>
                  <ChapterAdBanner chapterId={activeChatChapter.id} onCreateAd={() => stackNavigation.navigate('CreateAdCampaign')} />
                </View>
              }
              renderItem={({ item }) =>
                item.kind === 'day' ? <DayDivider label={item.label} /> : <ThreadMessageGroup group={item.group} senderName={item.senderName} />
              }
            />
          )}

          <ChapterChatComposer value={chatInput} onChangeText={setChatInput} onSend={handleSendChat} canPost={isMember(activeChatChapter)} />
        </View>
      ) : (
        <>
          <EtaChaptersHeader
            onMenuPress={() => navigation.openDrawer()}
            onAddPress={() => setCreateChapterOpen(true)}
          />

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}
          >
            <ChapterHero myChaptersCount={myChapters.length} localCount={tabCounts.local} internationalCount={tabCounts.international} />

            <PrimaryMembershipsBanner usedCount={myChapters.length} onManage={() => setManageOpen(true)} />

            <MyChaptersCarousel
              chapters={myChapters}
              onOpenChatList={() => setChatListOpen(true)}
              onChat={openChatFlow}
              onSettings={chapter => setCardSettingsChapter(chapter)}
            />

            <ChapterListControls
              tab={tab}
              onTabChange={setTab}
              counts={tabCounts}
              localCountryName={localCountryName}
              query={query}
              onQueryChange={setQuery}
              view={view}
              onToggleView={() => setView(v => (v === 'grid' ? 'rows' : 'grid'))}
            />

            <View style={styles.listWrap}>
              {showingSkeleton && <ChapterListSkeleton view={view} />}

              {!showingSkeleton && shown.length === 0 && (
                <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl }]}>
                  <Text style={[fonts.display, styles.emptyTitle, { color: colors.ink }]}>{emptyTitle}</Text>
                  {emptyBody && (
                    <Text style={[fonts.regular, styles.emptyBody, { color: colors.ink3 }]}>{emptyBody}</Text>
                  )}
                  <Pressable
                    onPress={() => setCreateChapterOpen(true)}
                    style={[styles.emptyButton, { borderColor: colors.goldLight, backgroundColor: colors.chip, borderRadius: radius.lg }]}
                  >
                    <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.goldDark }]}>Suggest a chapter</Text>
                  </Pressable>
                </View>
              )}

              {!showingSkeleton && shown.length > 0 && (
                <View style={view === 'grid' ? styles.grid : styles.rows}>
                  {shown.map(chapter => (
                    <AllChapterCard
                      key={chapter.id}
                      chapter={chapter}
                      tab={tab}
                      view={view}
                      isMember={isMember(chapter)}
                      pendingAcceptedAt={pendingRejoinByGroup[chapter.id] ?? null}
                      isJoining={joiningId === chapter.id}
                      onOpen={() => setDetailChapter(chapter)}
                      onJoin={() => handleJoin(chapter)}
                      onPreview={() => setPreviewChapter(chapter)}
                    />
                  ))}
                </View>
              )}
            </View>

            {!isActivelySearching && !showingSkeleton && (
              <View style={styles.footerWrap}>
                {pagination?.hasNextPage && (
                  <Pressable
                    onPress={loadMore}
                    style={[styles.showMoreButton, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl }]}
                  >
                    <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.ink2 }]}>Show more chapters</Text>
                  </Pressable>
                )}

                <Text style={[fonts.regular, styles.countLabel, { color: colors.ink3 }]}>{countLabel}</Text>

                <Pressable
                  onPress={() => setCreateChapterOpen(true)}
                  style={[styles.suggestCard, { backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.xl }]}
                >
                  <View style={[styles.suggestIconWell, { backgroundColor: colors.chip, borderRadius: radius.lg }]}>
                    <Text style={[fonts.bold, { fontSize: fontSize.h3, color: colors.goldDark }]}>+</Text>
                  </View>
                  <View style={styles.suggestBody}>
                    <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink }]}>No chapter in your city?</Text>
                    <Text style={[fonts.regular, styles.suggestHint, { color: colors.ink3 }]}>
                      Suggest one — we open a chapter once 10 members sign up.
                    </Text>
                  </View>
                  <View style={[styles.suggestButton, { borderColor: colors.goldLight, backgroundColor: colors.chip, borderRadius: radius.lg }]}>
                    <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.goldDark }]}>Suggest</Text>
                  </View>
                </Pressable>
              </View>
            )}

            <View style={{ height: spacing.xxxl + insets.bottom }} />
          </ScrollView>
        </>
      )}

      <ChapterDetailView
        visible={!!detailChapter}
        chapter={detailChapter}
        tab={tab}
        isMember={detailChapter ? isMember(detailChapter) : false}
        primaryUsedCount={myChapters.length}
        pendingAcceptedAt={detailChapter ? pendingRejoinByGroup[detailChapter.id] ?? null : null}
        isJoining={joiningId === detailChapter?.id}
        isLeaving={isLeaving}
        onClose={() => setDetailChapter(null)}
        onJoin={() => detailChapter && handleJoin(detailChapter)}
        onOpenChat={() => detailChapter && openChatFlow(detailChapter)}
        onPreview={() => detailChapter && setPreviewChapter(detailChapter)}
        onLeave={() => setLeaveConfirmChapter(detailChapter)}
      />

      <ManageMembershipsSheet
        visible={manageOpen}
        chapters={myChapters}
        onClose={() => setManageOpen(false)}
        onSwitch={chapter => {
          setManageOpen(false);
          Toast.show({ type: 'info', text1: `Pick a chapter below to switch ${chapter.name}` });
        }}
      />

      <ChapterReplacePicker
        visible={!!replaceTarget}
        targetChapter={replaceTarget}
        myChapters={myChapters}
        isSubmitting={isReplacing}
        onConfirm={handleConfirmReplace}
        onCancel={() => setReplaceTarget(null)}
      />

      <ConfirmDialog
        visible={!!leaveConfirmChapter}
        title="Leave this chapter?"
        message="Leaving this ETA chapter will start a 30-day cooldown before you can rejoin."
        confirmLabel="Leave chapter"
        destructive
        onConfirm={handleConfirmLeave}
        onCancel={() => setLeaveConfirmChapter(null)}
      />

      <ConfirmDialog
        visible={!!joinConfirmChapter}
        title={`Join ${joinConfirmChapter?.name}?`}
        message={`Do you want to join ${joinConfirmChapter?.name}?`}
        confirmLabel="Join Chapter"
        confirmColor={colors.feedFill}
        onConfirm={handleConfirmJoin}
        onCancel={() => setJoinConfirmChapter(null)}
      />

      <ChapterChatListScreen
        visible={chatListOpen}
        myChapters={myChapters}
        availableChapters={chapters}
        onClose={() => setChatListOpen(false)}
        onOpenChapter={chapter => {
          setChatListOpen(false);
          openChatFlow(chapter);
        }}
        onJoinChapter={chapter => {
          setChatListOpen(false);
          handleJoin(chapter);
        }}
      />

      <CommunityGuidelinesSheet
        visible={!!guidelineChapter}
        viewOnly={guidelineViewOnly}
        onAccept={handleAcceptGuidelines}
        onClose={() => setGuidelineChapter(null)}
      />

      <CreateChapterScreen
        visible={createChapterOpen}
        isSubmitting={isRequestingCity}
        onSubmit={handleCreateChapterSubmit}
        onClose={() => setCreateChapterOpen(false)}
      />

      <ChapterPreviewSheet
        visible={!!previewChapter}
        chapter={previewChapter}
        isJoining={joiningId === previewChapter?.id}
        onClose={() => setPreviewChapter(null)}
        onJoin={() => {
          if (!previewChapter) return;
          const chapter = previewChapter;
          setPreviewChapter(null);
          handleJoin(chapter);
        }}
      />

      <ChapterOptionsSheet
        visible={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        onNotificationPrefs={() => setNotifPrefsChapter(activeChatChapter)}
        onSearchMessages={() => setChatSearchOpen(true)}
        onViewMembers={() => handleViewMemberDirectory(activeChatChapter)}
        onUpcomingEvents={() => setUpcomingEventsChapter(activeChatChapter)}
        onCommunityGuidelines={() => {
          setGuidelineViewOnly(true);
          setGuidelineChapter(activeChatChapter);
        }}
        onLeave={() => setLeaveConfirmChapter(activeChatChapter)}
      />

      <ChapterNotificationPrefsModal
        visible={!!notifPrefsChapter}
        chapterId={notifPrefsChapter?.id ?? null}
        chapterName={notifPrefsChapter?.name ?? ''}
        onClose={() => setNotifPrefsChapter(null)}
      />

      <InviteOthersScreen
        visible={inviteOpen}
        chapterId={activeChatChapter?.id ?? null}
        chapterName={activeChatChapter?.name ?? ''}
        onClose={() => setInviteOpen(false)}
      />

      <ChapterMessageSearchScreen
        visible={chatSearchOpen}
        chapterId={activeChatChapter?.id ?? null}
        onClose={() => setChatSearchOpen(false)}
      />

      <ChapterUpcomingEventsSheet
        visible={!!upcomingEventsChapter}
        chapterId={upcomingEventsChapter?.id ?? null}
        chapterName={upcomingEventsChapter?.name ?? ''}
        onClose={() => setUpcomingEventsChapter(null)}
      />

      <ActionSheet
        visible={!!cardSettingsChapter}
        onClose={() => setCardSettingsChapter(null)}
        title={cardSettingsChapter?.name}
        items={[
          {
            key: 'notif',
            label: 'Notification preferences',
            icon: <Bell size={17} color={colors.ink2} strokeWidth={1.6} />,
            onPress: () => setNotifPrefsChapter(cardSettingsChapter),
          },
          {
            key: 'members',
            label: 'View member directory',
            icon: <Users size={17} color={colors.ink2} strokeWidth={1.6} />,
            onPress: () => handleViewMemberDirectory(cardSettingsChapter),
          },
          {
            key: 'events',
            label: 'Upcoming events',
            icon: <Calendar size={17} color={colors.ink2} strokeWidth={1.6} />,
            onPress: () => setUpcomingEventsChapter(cardSettingsChapter),
          },
          {
            key: 'leave',
            label: 'Leave chapter',
            icon: <LogOut size={17} color={colors.danger} strokeWidth={1.6} />,
            danger: true,
            onPress: () => setLeaveConfirmChapter(cardSettingsChapter),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  chatLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatListContent: {
    padding: 16,
    gap: 10,
  },
  chatHeaderItems: {
    gap: 10,
    marginBottom: 10,
  },
  welcomeBanner: {
    padding: 12,
  },
  welcomeText: {
    fontSize: 11.5,
    lineHeight: 17,
  },
  listWrap: {
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rows: {
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    gap: 7,
    paddingVertical: 34,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 17,
  },
  emptyBody: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyButton: {
    height: 38,
    paddingHorizontal: 16,
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  footerWrap: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 11,
  },
  showMoreButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  countLabel: {
    fontSize: 10.5,
    textAlign: 'center',
  },
  suggestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    marginTop: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  suggestIconWell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestBody: {
    flex: 1,
    minWidth: 0,
  },
  suggestHint: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  suggestButton: {
    height: 34,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

export default EtaChaptersScreen;
