import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { Eye, EyeOff, Link2, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { BottomSheet } from '../../BottomSheet';
import { ConfirmDialog } from '../../events/ConfirmDialog';
import { deleteFeedItem } from '../../../api/feed';
import type { AppStackParamList } from '../../../navigation/types';

/**
 * Own-post 3-dot menu — matches web's `MiniCardMenu.tsx` functionally, scoped down to what
 * actually applies here: View Profile's Posts tab only ever shows the signed-in user's OWN posts
 * (`isOwner` is hardcoded `true` on web's own call sites for this exact page), so
 * Follow/Unfollow (gated non-owner) and Report (web's own `isOwner ? Delete : Report` branch)
 * never apply and are omitted rather than built unreachable.
 *
 * "View full post" pushes `FeedPostDetailScreen` — it was a "coming soon" toast stub while no
 * single-post detail screen existed anywhere in this app; that screen landed later
 * (Notifications Phase 3) and Notifications has been routing into it since, so this menu just
 * needed pointing at the same destination.
 * "Copy link" and "Delete post" are both real, matching web's `DELETE /feed/delete/:feedId`
 * exactly. "Hide this post" is real but client-side-only/session-only, matching web's own
 * `tsb:hidepost` event (no backend persistence on web either).
 */
export function PostCardMenuSheet({
  visible,
  feedId,
  onClose,
  onHide,
  onDeleted,
}: {
  visible: boolean;
  feedId: string;
  onClose: () => void;
  onHide: () => void;
  onDeleted: () => void;
}) {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleViewPost = () => {
    onClose();
    navigation.navigate('FeedPostDetail', { feedId });
  };

  const handleCopyLink = () => {
    onClose();
    Clipboard.setString(`https://tsb.testdevurl.com/dashboard/feed/${feedId}`);
    Toast.show({ type: 'success', text1: 'Link copied to clipboard' });
  };

  const handleHide = () => {
    onClose();
    onHide();
    Toast.show({ type: 'success', text1: 'Post hidden' });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFeedItem(feedId);
      setConfirmDeleteOpen(false);
      onClose();
      onDeleted();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not delete post', text2: 'Please try again.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose}>
        <MenuItem icon={<Eye size={14} color={colors.ink3} strokeWidth={1.8} />} label="View full post" onPress={handleViewPost} />
        <MenuItem icon={<Link2 size={14} color={colors.ink3} strokeWidth={1.8} />} label="Copy link" onPress={handleCopyLink} />
        <View style={[styles.divider, { backgroundColor: colors.borderSoft }]} />
        <MenuItem icon={<EyeOff size={14} color={colors.ink3} strokeWidth={1.8} />} label="Hide this post" onPress={handleHide} />
        <MenuItem
          icon={<Trash2 size={14} color={colors.danger} strokeWidth={1.8} />}
          label="Delete post"
          danger
          onPress={() => {
            onClose();
            setConfirmDeleteOpen(true);
          }}
        />
      </BottomSheet>

      <ConfirmDialog
        visible={confirmDeleteOpen}
        eyebrow="DELETE POST"
        title="Are you sure?"
        message="This post will be permanently deleted and cannot be recovered."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirmDeleteOpen(false)}
      />
    </>
  );
}

function MenuItem({ icon, label, danger, onPress }: { icon: React.ReactNode; label: string; danger?: boolean; onPress: () => void }) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}>
      {icon}
      <Text style={[fonts.semibold, styles.itemLabel, { color: danger ? colors.danger : colors.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 11, height: 46, paddingHorizontal: 4 },
  itemLabel: { fontSize: 13.5 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
});
