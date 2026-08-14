import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Search, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../Avatar';
import { avatarColor } from '../../types/messages';
import { searchUsers } from '../../api/messages';
import type { UserSearchResult } from '../../api/messages';

const SEARCH_DEBOUNCE_MS = 300;

/** Full-screen right-side slide-in — same manual-`Animated.Value` translateX pattern as
 * `components/home/FilterPanel.tsx` / AI Assist's `HistoryDrawer.tsx`, not the narrow
 * left-anchored-drawer style. Debounced (300ms) member search via `/profile/search`, matching
 * webSrc's `startConversationWith` flow exactly.
 *
 * Nests its own `SafeAreaProvider` inside the `Modal` rather than trusting the app-root one
 * (`App.tsx`) — `Modal` renders in a separate native window on Android, so insets measured
 * against the main window aren't guaranteed to apply there too. Same root cause/fix as
 * `DirectoryFiltersPanel.tsx`. The insets-consuming content (and the state that only matters to
 * that content, like the search query/results) is split into `NewMessageOverlayContent` because a
 * component can't read a `Provider` it renders itself later in the same return —
 * `useSafeAreaInsets()` has to be called from *inside* the new nested provider's subtree. The
 * slide animation's `translateX` stays owned by this outer shell (it drives `Modal`'s own
 * `shouldRender` prop) and is passed down as a plain `Animated.Value` prop. */
export function NewMessageOverlay({
  visible,
  onClose,
  onSelectUser,
  excludeUsername,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (user: UserSearchResult) => void;
  excludeUsername?: string | null;
}) {
  const screenWidth = Dimensions.get('window').width;
  const [shouldRender, setShouldRender] = useState(visible);
  const translateX = useRef(new Animated.Value(visible ? 0 : screenWidth)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateX.setValue(screenWidth);
      Animated.timing(translateX, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateX, { toValue: screenWidth, duration: 220, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setShouldRender(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={shouldRender} animationType="none" transparent onRequestClose={onClose}>
      <SafeAreaProvider>
        <NewMessageOverlayContent
          visible={visible}
          onClose={onClose}
          onSelectUser={onSelectUser}
          excludeUsername={excludeUsername}
          translateX={translateX}
        />
      </SafeAreaProvider>
    </Modal>
  );
}

function NewMessageOverlayContent({
  visible,
  onClose,
  onSelectUser,
  excludeUsername,
  translateX,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (user: UserSearchResult) => void;
  excludeUsername?: string | null;
  translateX: Animated.Value;
}) {
  const { colors, fonts, fontSize, radius, borderWidth, letterSpacing } = useTheme();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setResults([]);
    }
  }, [visible]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers(query.trim(), 8);
        setResults(users.filter(u => u.username && u.username !== excludeUsername));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, excludeUsername]);

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.pageBg, paddingTop: insets.top, transform: [{ translateX }] }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.eyebrowRow}>
              <View style={[styles.eyebrowDash, { backgroundColor: colors.gold }]} />
              <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark, letterSpacing: letterSpacing.wider }]}>New</Text>
            </View>
            <Text style={[fonts.display, styles.title, { color: colors.ink }]}>New message</Text>
          </View>
          <Pressable onPress={onClose} accessibilityLabel="Close" style={[styles.closeButton, { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.lg }]}>
            <X size={14} color={colors.ink2} strokeWidth={1.7} />
          </Pressable>
        </View>

        <View style={[styles.searchRow, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}>
          <Text style={[fonts.semibold, { fontSize: fontSize.small + 1, color: colors.ink3 }]}>To:</Text>
          <Search size={14} color={colors.ink3} strokeWidth={1.6} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search members…"
            placeholderTextColor={colors.ink3}
            autoFocus
            style={[fonts.regular, styles.searchInput, { fontSize: fontSize.ui, color: colors.ink }]}
          />
          {searching ? <ActivityIndicator size="small" color={colors.gold} /> : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {results.map(person => (
          <Pressable
            key={person.id}
            onPress={() => onSelectUser(person)}
            style={({ pressed }) => [styles.row, { borderRadius: radius.xl, backgroundColor: pressed ? colors.surfaceSunken : 'transparent' }]}
          >
            <Avatar name={person.name} imageUri={person.profile_img} size={42} fallbackColor={avatarColor(person.name)} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={[fonts.bold, { fontSize: fontSize.title - 2, color: colors.ink }]}>
                {person.name}
              </Text>
              <Text numberOfLines={1} style={[fonts.regular, { fontSize: fontSize.small + 1, color: colors.ink2, marginTop: 2 }]}>
                @{person.username}
              </Text>
            </View>
            <ChevronRight size={13} color={colors.gold} strokeWidth={1.6} />
          </Pressable>
        ))}
        {!query.trim() ? (
          <View style={styles.empty}>
            <Text style={[fonts.regular, { fontSize: fontSize.small + 1, color: colors.ink3 }]}>
              Start typing to search for people
            </Text>
          </View>
        ) : null}

        {query.trim() && !searching && results.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[fonts.bold, { fontSize: fontSize.subtitle, color: colors.ink }]}>No members found</Text>
            <Text style={[fonts.regular, { fontSize: fontSize.small + 1, color: colors.ink2, marginTop: 6 }]}>Try a different name.</Text>
          </View>
        ) : null}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowDash: {
    width: 16,
    height: 2,
    borderRadius: 2,
  },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    marginTop: 6,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    paddingHorizontal: 13,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  list: {
    padding: 10,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  empty: {
    padding: 34,
    alignItems: 'center',
  },
});
