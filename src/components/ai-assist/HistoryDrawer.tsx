import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, MessageSquare, MoreVertical, Plus, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import type { Conversation } from '../../types/ai-assist';

/** `updated_at`/`created_at` → compact relative label ("10h", "2d", "1w"), matching the
 * mockup's timestamp treatment on each history row. */
function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

/** Full-screen right-side slide-in panel — same pattern as `components/home/FilterPanel.tsx`
 * (manual `Animated.Value` translateX from `screenWidth` to `0`, `animationType="none"` +
 * `transparent` Modal, `shouldRender` keeps it mounted through the exit animation). Not a
 * partial-width left-anchored drawer with a dimmed backdrop — that read as a second copy of the
 * app's own main navigation Drawer, which opens from the left via the header's hamburger.
 *
 * Header content (icon badge + "AI Assist" + close, one compact row) matches the `AIAssist.html`
 * mockup's history panel exactly — NOT `FilterPanel`'s own eyebrow-dash + big-serif-title header,
 * which is that component's content, not part of the shared right-slide chrome being reused here.
 * Real `conversations` list (Recent/Saved), replacing web's always-visible sidebar.
 *
 * Nests its own `SafeAreaProvider` inside the `Modal` rather than trusting the app-root one
 * (`App.tsx`) — `Modal` renders in a separate native window on Android, so insets measured
 * against the main window aren't guaranteed to apply there too. The insets-consuming content is
 * split into `HistoryDrawerContent` because a component can't read a `Provider` it renders itself
 * later in the same return — `useSafeAreaInsets()` has to be called from *inside* the new nested
 * provider's subtree. */
export function HistoryDrawer({
  visible,
  onClose,
  conversations,
  loading,
  activeConversationId,
  onSelect,
  onNewChat,
  onOpenMenu,
  onOpenLibrary,
}: {
  visible: boolean;
  onClose: () => void;
  conversations: Conversation[];
  loading: boolean;
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onOpenMenu: (conversation: Conversation) => void;
  onOpenLibrary: () => void;
}) {
  const { colors } = useTheme();

  const screenWidth = Dimensions.get('window').width;
  const [shouldRender, setShouldRender] = useState(visible);
  const translateX = useRef(new Animated.Value(visible ? 0 : screenWidth)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateX.setValue(screenWidth);
      Animated.timing(translateX, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateX, { toValue: screenWidth, duration: 220, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) setShouldRender(false);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={shouldRender} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.container, { backgroundColor: colors.pageBg, transform: [{ translateX }] }]}>
        <SafeAreaProvider>
          <HistoryDrawerContent
            onClose={onClose}
            conversations={conversations}
            loading={loading}
            activeConversationId={activeConversationId}
            onSelect={onSelect}
            onNewChat={onNewChat}
            onOpenMenu={onOpenMenu}
            onOpenLibrary={onOpenLibrary}
          />
        </SafeAreaProvider>
      </Animated.View>
    </Modal>
  );
}

function HistoryDrawerContent({
  onClose,
  conversations,
  loading,
  activeConversationId,
  onSelect,
  onNewChat,
  onOpenMenu,
  onOpenLibrary,
}: {
  onClose: () => void;
  conversations: Conversation[];
  loading: boolean;
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onOpenMenu: (conversation: Conversation) => void;
  onOpenLibrary: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const recent = conversations.filter(c => !c.is_saved);
  const saved = conversations.filter(c => c.is_saved);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={[styles.brandBadge, { backgroundColor: colors.gold, borderRadius: radius.lg }]}>
            <Sparkles size={16} color="#fff" strokeWidth={1.8} />
          </View>
          <Text style={[fonts.bold, styles.title, { color: colors.ink }]}>AI Assist</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.closeButton, { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.lg }]}
          >
            <Icon name="close" size={14} color={colors.ink2} />
          </Pressable>
        </View>

        <Pressable
          onPress={onNewChat}
          style={({ pressed }) => [
            styles.newChatButton,
            { backgroundColor: colors.feedFill, borderRadius: radius.xl, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Plus size={15} color={colors.feedOnFill} strokeWidth={1.8} />
          <Text style={[fonts.semibold, styles.newChatText, { color: colors.feedOnFill }]}>New chat</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Section
          icon={<Clock size={12} color={colors.ink3} strokeWidth={1.4} />}
          label="Recent"
          items={recent}
          loading={loading}
          activeConversationId={activeConversationId}
          onSelect={onSelect}
          onOpenMenu={onOpenMenu}
        />
        <Section
          icon={<Icon name="bookmark" size={12} color={colors.ink3} />}
          label="Saved"
          items={saved}
          loading={false}
          activeConversationId={activeConversationId}
          onSelect={onSelect}
          onOpenMenu={onOpenMenu}
          collapsible
        />
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin, paddingBottom: 16 + insets.bottom },
        ]}
      >
        <Pressable
          onPress={onOpenLibrary}
          style={[styles.libraryButton, { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, backgroundColor: colors.surfaceSunken }]}
        >
          <Icon name="aiAssist" size={15} color={colors.goldDark} />
          <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink }]}>Prompt library</Text>
        </Pressable>
      </View>
    </View>
  );
}

const SAVED_COLLAPSE_THRESHOLD = 3;

function Section({
  icon,
  label,
  items,
  loading,
  activeConversationId,
  onSelect,
  onOpenMenu,
  collapsible = false,
}: {
  icon: React.ReactNode;
  label: string;
  items: Conversation[];
  loading: boolean;
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onOpenMenu: (conversation: Conversation) => void;
  /** Caps the list to `SAVED_COLLAPSE_THRESHOLD` with a "See all"/"Less" toggle once it exceeds
   * that — matches webSrc's Saved section (`page.tsx:1079-1090`, `isShowAllSavedChats`). */
  collapsible?: boolean;
}) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const [showAll, setShowAll] = useState(false);

  if (!loading && items.length === 0) return null;

  const isCollapsed = collapsible && !showAll && items.length > SAVED_COLLAPSE_THRESHOLD;
  const visibleItems = isCollapsed ? items.slice(0, SAVED_COLLAPSE_THRESHOLD) : items;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>{label}</Text>
        {collapsible && items.length > SAVED_COLLAPSE_THRESHOLD && (
          <Pressable onPress={() => setShowAll(p => !p)} style={styles.seeAllButton} hitSlop={8}>
            <Text style={[fonts.semibold, styles.seeAllText, { color: colors.ink3 }]}>
              {showAll ? 'Less' : 'See all'}
            </Text>
          </Pressable>
        )}
      </View>

      {loading
        ? [60, 80, 50].map((w, i) => (
            <View key={i} style={styles.skeletonRow}>
              <View style={[styles.skeletonIcon, { backgroundColor: colors.creamDark, borderRadius: radius.sm }]} />
              <View style={[styles.skeletonLine, { width: `${w}%`, backgroundColor: colors.creamDark, borderRadius: radius.sm }]} />
            </View>
          ))
        : visibleItems.map(conv => {
            const active = conv.id === activeConversationId;
            return (
              <View
                key={conv.id}
                style={[styles.row, { borderRadius: radius.lg, backgroundColor: active ? colors.chip : 'transparent' }]}
              >
                <Pressable onPress={() => onSelect(conv.id)} style={styles.rowMain}>
                  <MessageSquare size={15} color={colors.ink3} strokeWidth={1.4} />
                  <Text numberOfLines={1} style={[fonts.semibold, styles.rowTitle, { fontSize: fontSize.body, color: colors.ink }]}>
                    {conv.title}
                  </Text>
                  <Text style={[fonts.regular, styles.rowTime, { color: colors.ink3 }]}>
                    {formatRelativeTime(conv.updated_at || conv.created_at)}
                  </Text>
                </Pressable>
                <Pressable onPress={() => onOpenMenu(conv)} accessibilityLabel="Chat options" hitSlop={8} style={styles.rowMenu}>
                  <MoreVertical size={14} color={colors.ink3} strokeWidth={1.6} />
                </Pressable>
              </View>
            );
          })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  brandBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 15,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    marginTop: 15,
  },
  newChatText: {
    fontSize: 13.5,
  },
  body: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  seeAllButton: {
    marginLeft: 'auto',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  seeAllText: {
    fontSize: 9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 10,
  },
  rowTitle: {
    flex: 1,
  },
  rowTime: {
    flexShrink: 0,
    fontSize: 10.5,
  },
  rowMenu: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  skeletonIcon: {
    width: 20,
    height: 20,
  },
  skeletonLine: {
    height: 10,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  libraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
  },
});
