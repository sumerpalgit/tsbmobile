import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { Eye, EyeOff, Flag, Link2, Trash2, UserCheck, UserPlus } from 'lucide-react-native';
import { WEB_BASE_URL } from '@env';
import { useTheme } from '../../../theme';
import { BottomSheet } from '../../BottomSheet';
import { ConfirmDialog } from '../../events/ConfirmDialog';
import { deleteFeedItem, hideFeedItem, reportFeedItem } from '../../../api/feed';
import { fetchFollowStatus, toggleFollow } from '../../../api/follow';

/** The 3-dot card menu — matches web's real `MiniCardMenu.tsx` (View full post/Copy link/Follow-
 * Unfollow/Hide/Delete-or-Report), which was missing entirely from My Activity's mini-cards.
 * Follows the same shell/copy `PostCardMenuSheet.tsx` (View Profile's own-post-only version)
 * already established, extended with the Follow/Unfollow and Report branches that page didn't
 * need (it only ever shows the signed-in user's own posts). "View full post" has no destination
 * screen anywhere in this app yet — a toast stub, same convention `PostCardMenuSheet.tsx` already
 * uses, not a guess. */
export function ActivityCardMenu({
  visible,
  feedId,
  username,
  displayName,
  isOwner,
  onClose,
  onHide,
  onDeleted,
}: {
  visible: boolean;
  feedId: string;
  username?: string;
  displayName: string;
  isOwner: boolean;
  onClose: () => void;
  onHide: () => void;
  onDeleted: () => void;
}) {
  const { colors } = useTheme();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (visible && username && !isOwner) {
      fetchFollowStatus(username).then(setFollowing);
    }
    if (!visible) setFollowing(null);
  }, [visible, username, isOwner]);

  const handleViewPost = () => {
    onClose();
    Toast.show({ type: 'info', text1: 'Post details coming soon' });
  };

  const handleCopyLink = () => {
    onClose();
    Clipboard.setString(`${WEB_BASE_URL}/dashboard/feed/${feedId}`);
    Toast.show({ type: 'success', text1: 'Link copied to clipboard' });
  };

  const handleFollow = async () => {
    if (!username || following === null || followLoading) return;
    setFollowLoading(true);
    try {
      await toggleFollow(username, following);
      const nowFollowing = !following;
      setFollowing(nowFollowing);
      Toast.show({ type: 'success', text1: nowFollowing ? `Following ${displayName}` : `Unfollowed ${displayName}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not update follow status' });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleHide = () => {
    onClose();
    hideFeedItem(feedId).catch(() => {});
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
        {!!username && !isOwner && (
          <MenuItem
            icon={
              following ? (
                <UserCheck size={14} color={colors.ink3} strokeWidth={1.8} />
              ) : (
                <UserPlus size={14} color={colors.ink3} strokeWidth={1.8} />
              )
            }
            label={following === null ? 'Loading…' : following ? `Unfollow @${username}` : `Follow @${username}`}
            disabled={followLoading || following === null}
            onPress={handleFollow}
          />
        )}
        <View style={[styles.divider, { backgroundColor: colors.borderSoft }]} />
        <MenuItem icon={<EyeOff size={14} color={colors.ink3} strokeWidth={1.8} />} label="Hide this post" onPress={handleHide} />
        {isOwner ? (
          <MenuItem
            icon={<Trash2 size={14} color={colors.danger} strokeWidth={1.8} />}
            label="Delete post"
            danger
            onPress={() => {
              onClose();
              setConfirmDeleteOpen(true);
            }}
          />
        ) : (
          <MenuItem
            icon={<Flag size={14} color={colors.danger} strokeWidth={1.8} />}
            label="Report this post"
            danger
            onPress={() => {
              onClose();
              setReportOpen(true);
            }}
          />
        )}
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

      <ReportReasonSheet visible={reportOpen} feedId={feedId} onClose={() => setReportOpen(false)} />
    </>
  );
}

const REPORT_REASONS = [
  "It's spam",
  'Misleading or false information',
  'Inappropriate or offensive content',
  'Harassment or hate speech',
  'Intellectual property violation',
  'Other',
];

/** Matches `MiniCardMenu.tsx`'s report modal exactly: 6 reasons, "Other" reveals a free-text box. */
function ReportReasonSheet({ visible, feedId, onClose }: { visible: boolean; feedId: string; onClose: () => void }) {
  const { colors, fonts, radius } = useTheme();
  const [reason, setReason] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setReason(null);
      setOtherText('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      await reportFeedItem(feedId, reason === 'Other' ? otherText.trim() || 'Other' : reason);
      Toast.show({ type: 'success', text1: 'Report submitted', text2: 'Thank you for helping keep our community safe.' });
      onClose();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not submit report', text2: 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissable={!submitting}>
      <Text style={[fonts.display, styles.reportTitle, { color: colors.ink }]}>Report this post</Text>
      <View style={styles.reasonList}>
        {REPORT_REASONS.map(option => {
          const selected = reason === option;
          return (
            <Pressable key={option} onPress={() => setReason(option)} style={styles.reasonRow}>
              <View style={[styles.radio, { borderColor: selected ? colors.gold : colors.border }, selected && { backgroundColor: colors.gold }]} />
              <Text style={[fonts.regular, styles.reasonLabel, { color: colors.ink2 }]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      {reason === 'Other' && (
        <TextInput
          value={otherText}
          onChangeText={setOtherText}
          placeholder="Tell us more…"
          placeholderTextColor={colors.ink3}
          multiline
          maxLength={300}
          style={[styles.otherInput, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
        />
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={!reason || submitting}
        style={[styles.submitButton, { backgroundColor: !reason ? colors.surfaceSunken : colors.danger, borderRadius: radius.lg }]}
      >
        <Text style={[fonts.bold, styles.submitText, { color: !reason ? colors.ink3 : '#fff' }]}>
          {submitting ? 'Submitting…' : 'Submit Report'}
        </Text>
      </Pressable>
    </BottomSheet>
  );
}

function MenuItem({
  icon,
  label,
  danger,
  disabled,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.item, (pressed || disabled) && { opacity: 0.6 }]}
    >
      {icon}
      <Text style={[fonts.semibold, styles.itemLabel, { color: danger ? colors.danger : colors.ink2 }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 11, height: 46, paddingHorizontal: 4 },
  itemLabel: { fontSize: 13.5, flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  reportTitle: { fontSize: 18, letterSpacing: -0.2, marginBottom: 14 },
  reasonList: { gap: 2 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.6 },
  reasonLabel: { fontSize: 13.5, flex: 1 },
  otherInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  submitButton: { height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 18, marginBottom: 4 },
  submitText: { fontSize: 13.5 },
});
