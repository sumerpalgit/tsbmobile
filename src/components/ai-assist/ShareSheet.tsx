import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Copy, Share2, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Switch } from '../Switch';

type ShareToggleKey = 'comments' | 'followups';

/** Bottom sheet — shareable link + copy, access toggles, Cancel/Copy & close. `link` is real
 * (`shareAiConversation`); `comments`/`followups` mirror the mockup's toggle labels but have no
 * backing endpoint on web either — kept as local UI state, same "toast-only stub" treatment as
 * `MoreSheet`'s regenerate button. */
export function ShareSheet({
  visible,
  onClose,
  shareUrl,
  loading,
  onCopy,
}: {
  visible: boolean;
  onClose: () => void;
  shareUrl: string;
  loading: boolean;
  onCopy: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const [toggles, setToggles] = useState<Record<ShareToggleKey, boolean>>({ comments: false, followups: true });

  const rows: { key: ShareToggleKey; label: string; sub: string }[] = [
    { key: 'comments', label: 'Allow comments', sub: 'Viewer can add annotations' },
    { key: 'followups', label: 'Include follow-up prompts', sub: 'Show suggested questions at the bottom' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 18),
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xxl + 6,
              borderTopRightRadius: radius.xxl + 6,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: colors.gold, borderRadius: radius.lg }]}>
              <Share2 size={16} color="#fff" strokeWidth={1.4} />
            </View>
            <Text style={[fonts.display, styles.headerTitle, { color: colors.ink }]}>Share this chat</Text>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              style={[styles.closeButton, { backgroundColor: colors.surfaceSunken, borderRadius: radius.md }]}
            >
              <X size={13} color={colors.ink3} strokeWidth={1.7} />
            </Pressable>
          </View>

          <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>Shareable link</Text>
          <View style={styles.linkRow}>
            <View
              style={[
                styles.linkField,
                { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, backgroundColor: colors.surfaceSunken },
              ]}
            >
              <Text numberOfLines={1} style={[fonts.regular, { fontSize: fontSize.small + 1, color: colors.ink2 }]}>
                {loading ? 'Generating link…' : shareUrl || 'Link unavailable'}
              </Text>
            </View>
            <Pressable
              onPress={onCopy}
              disabled={!shareUrl}
              style={[
                styles.copyButton,
                { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, opacity: shareUrl ? 1 : 0.5 },
              ]}
            >
              <Copy size={13} color={colors.ink} strokeWidth={1.5} />
              <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink }]}>Copy</Text>
            </Pressable>
          </View>

          <Text style={[fonts.bold, styles.sectionLabel, { marginTop: 18, color: colors.ink3 }]}>
            Access settings
          </Text>
          {rows.map(r => (
            <View key={r.key} style={[styles.toggleRow, { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
              <View style={{ flex: 1 }}>
                <Text style={[fonts.semibold, { fontSize: fontSize.ui, color: colors.ink }]}>{r.label}</Text>
                <Text style={[fonts.regular, styles.toggleSub, { color: colors.ink3 }]}>{r.sub}</Text>
              </View>
              <Switch value={toggles[r.key]} onValueChange={v => setToggles(prev => ({ ...prev, [r.key]: v }))} />
            </View>
          ))}

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[styles.cancelButton, { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}
            >
              <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onCopy();
                onClose();
              }}
              disabled={!shareUrl}
              style={[styles.confirmButton, { backgroundColor: colors.gold, borderRadius: radius.lg, opacity: shareUrl ? 1 : 0.5 }]}
            >
              <Copy size={15} color="#fff" strokeWidth={1.6} />
              <Text style={[fonts.bold, { fontSize: fontSize.ui, color: '#fff' }]}>Copy &amp; close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10,16,24,0.5)',
  },
  sheet: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  iconBadge: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 10.5,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 9,
  },
  linkField: {
    flex: 1,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 46,
    paddingHorizontal: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  toggleSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    height: 48,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
