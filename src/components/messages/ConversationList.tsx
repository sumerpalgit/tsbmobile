import React, { useEffect, useMemo, useRef } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { ConversationRow } from './ConversationRow';
import { ConversationListSkeleton } from './ConversationRowSkeleton';
import type { ConversationRowHandle } from './ConversationRow';
import type { Conversation } from '../../types/messages';

/** Inbox list body — a flat list (the mockup has no Unread/Earlier section dividers, just rows
 * straight after the swipe hint) and the three empty-state copy variants webSrc conditions on
 * (nothing-unread / no-search-results / no-conversations-at-all). `FlatList` (not `ScrollView`
 * + map, unlike `HistoryDrawer.tsx`'s short AI-chat lists) since a DM inbox can realistically
 * grow long and benefits from virtualization. */
export function ConversationList({
  conversations,
  isLoading = false,
  refreshing = false,
  onRefresh,
  search,
  segment,
  onlineUserIds,
  onOpen,
  onMore,
  onStartConversation,
}: {
  conversations: Conversation[];
  isLoading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  search: string;
  segment: 'all' | 'unread';
  onlineUserIds: string[];
  onOpen: (conversation: Conversation) => void;
  onMore: (conversation: Conversation) => void;
  onStartConversation: () => void;
}) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const onlineSet = useMemo(() => new Set(onlineUserIds), [onlineUserIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations
      .filter(c => (q ? c.name.toLowerCase().includes(q) : true))
      .filter(c => (segment === 'unread' ? c.unreadCount > 0 : true));
  }, [conversations, search, segment]);

  const firstRowKey = filtered[0]?.id;
  const firstRowRef = useRef<ConversationRowHandle>(null);
  const hasPlayedHintRef = useRef(false);

  // Auto-demos the swipe gesture on the first row (swipe open, then closed) once each time the
  // inbox finishes loading with at least one conversation — most users never discover a
  // swipe-to-reveal action exists without ever being shown it once, and the static text hint
  // above the list (`swipeHint`) alone doesn't make that obvious enough on its own.
  useEffect(() => {
    if (isLoading || filtered.length === 0 || hasPlayedHintRef.current) return;
    hasPlayedHintRef.current = true;
    const timer = setTimeout(() => firstRowRef.current?.playHint(), 600);
    return () => clearTimeout(timer);
  }, [isLoading, filtered.length]);

  if (isLoading) {
    return <ConversationListSkeleton />;
  }

  if (filtered.length === 0) {
    const q = search.trim();
    const title = segment === 'unread' ? 'Nothing unread' : q ? 'No conversations found' : 'No messages yet';
    const desc =
      segment === 'unread'
        ? "You're all caught up — every conversation has been read."
        : q
        ? 'Try a different name, or start a new conversation.'
        : 'Reach out to a searcher, investor or advisor from the directory.';

    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIconWell, { backgroundColor: colors.chip, borderRadius: radius.xl }]}>
          <Icon name="messages" size={26} color={colors.goldDark} />
        </View>
        <Text style={[fonts.bold, { fontSize: fontSize.title, color: colors.ink }]}>{title}</Text>
        <Text style={[fonts.regular, styles.emptyDesc, { fontSize: fontSize.body, color: colors.ink2 }]}>{desc}</Text>
        {segment === 'all' && (
          <Pressable
            onPress={onStartConversation}
            style={[styles.emptyButton, { backgroundColor: colors.feedFill, borderRadius: radius.lg }]}
          >
            <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.feedOnFill }]}>
              Start a conversation
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
      ListHeaderComponent={
        <View style={styles.swipeHint}>
          <ChevronLeft size={14} color={colors.ink3} strokeWidth={1.8} />
          <Text style={[fonts.semibold, styles.swipeHintText, { color: colors.ink3 }]}>
            Swipe a conversation for more options
          </Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
      renderItem={({ item }) => (
        <ConversationRow
          ref={item.id === firstRowKey ? firstRowRef : undefined}
          conversation={item}
          isOnline={onlineSet.has(item.participantId)}
          onOpen={() => onOpen(item)}
          onMore={() => onMore(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 6,
    paddingTop: 3,
    paddingBottom: 9,
  },
  swipeHintText: {
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 30,
    paddingVertical: 48,
  },
  emptyIconWell: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 230,
  },
  emptyButton: {
    height: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
