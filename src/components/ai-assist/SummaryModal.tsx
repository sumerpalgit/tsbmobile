import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme';

/** Centered modal showing `summariseAiMessage`'s output — same chrome family as
 * `ConfirmDialog`/`RenameDialog`, sized taller for prose and scrollable. */
export function SummaryModal({
  visible,
  loading,
  summary,
  onClose,
}: {
  visible: boolean;
  loading: boolean;
  summary: string;
  onClose: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth, elevation } = useTheme();

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.card,
            elevation('lg'),
            { backgroundColor: colors.surface, borderRadius: radius.xxl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin },
          ]}
        >
          <View style={styles.header}>
            <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Summary</Text>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              style={[styles.closeButton, { backgroundColor: colors.surfaceSunken, borderRadius: radius.md }]}
            >
              <X size={14} color={colors.ink3} strokeWidth={1.7} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={colors.gold} />
            </View>
          ) : (
            <ScrollView style={styles.scroll}>
              <Text style={[fonts.regular, styles.body, { fontSize: fontSize.body, color: colors.ink2 }]}>
                {summary}
              </Text>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(24,46,67,0.44)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 19,
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  scroll: {
    marginTop: 12,
  },
  body: {
    lineHeight: 20,
  },
});
