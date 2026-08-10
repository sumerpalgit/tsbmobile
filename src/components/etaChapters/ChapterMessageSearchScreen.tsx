import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { searchGroupMessages } from '../../api/eta';
import type { Message } from '../../types/messages';

/** Search-within-chapter-chat — matches web's search panel (`searchGroupMessages`, Enter-to-
 * search, no debounce — a deliberate lookup action, not live-as-you-type). Results are a flat
 * read-only list (sender, text, time) rather than jump-to-message-in-thread — web's own spec
 * doesn't describe scroll-linking either, just a results list. */
export function ChapterMessageSearchScreen({ visible, chapterId, onClose }: { visible: boolean; chapterId: string | null; onClose: () => void }) {
  const { colors, fonts, fontSize, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = () => {
    if (!chapterId || !query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    searchGroupMessages(chapterId, query.trim())
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={[styles.screen, { backgroundColor: colors.pageBg, paddingTop: insets.top }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
          <Pressable onPress={handleClose} accessibilityLabel="Back" style={styles.backButton}>
            <ArrowLeft size={18} color={colors.ink} strokeWidth={1.8} />
          </Pressable>
          <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
            <Search size={14} color={colors.ink3} strokeWidth={1.6} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={runSearch}
              returnKeyType="search"
              autoFocus
              placeholder="Search messages…"
              placeholderTextColor={colors.ink3}
              style={[fonts.regular, styles.input, { fontSize: fontSize.body, color: colors.ink }]}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={colors.gold} />
          </View>
        ) : hasSearched && results.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={[fonts.regular, { fontSize: fontSize.body, color: colors.ink3 }]}>No messages found.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.results} showsVerticalScrollIndicator={false}>
            {results.map(m => (
              <View key={m.id} style={[styles.resultRow, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
                <View style={styles.resultHeaderRow}>
                  <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.ink }]}>{m.sender.name}</Text>
                  <Text style={[fonts.regular, { fontSize: fontSize.small, color: colors.ink3 }]}>
                    {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <Text numberOfLines={2} style={[fonts.regular, styles.resultText, { color: colors.ink2 }]}>
                  {m.message}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 42,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  results: {
    padding: 16,
  },
  resultRow: {
    paddingVertical: 11,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
});
