import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Copy, X } from 'lucide-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme';

/** Centered modal showing `summariseAiMessage`'s output — same chrome family as
 * `ConfirmDialog`/`RenameDialog`, sized taller for prose and scrollable. Footer's "Copy summary"
 * matches webSrc's summary modal (`page.tsx:1781-1788`). */
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
            <>
              <ScrollView style={styles.scroll}>
                <Text style={[fonts.regular, styles.body, { fontSize: fontSize.body, color: colors.ink2 }]}>
                  {summary}
                </Text>
              </ScrollView>
              {summary ? (
                <View style={styles.footer}>
                  <Pressable
                    onPress={onClose}
                    style={({ pressed }) => [
                      styles.footerButton,
                      { backgroundColor: pressed ? colors.surfaceSunken : 'transparent' },
                    ]}
                  >
                    <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>Close</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Clipboard.setString(summary);
                      Toast.show({ type: 'success', text1: 'Summary copied ✓' });
                    }}
                    style={[styles.copyButton, { backgroundColor: colors.feedFill, borderRadius: radius.lg }]}
                  >
                    <Copy size={13} color={colors.feedOnFill} strokeWidth={1.6} />
                    <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.feedOnFill }]}>
                      Copy summary
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </>
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  footerButton: {
    height: 38,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
  },
});
