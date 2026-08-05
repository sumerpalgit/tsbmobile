import React from 'react';
import { Download, Pencil, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { ActionSheet } from './ActionSheet';

/** Thread header's "more" sheet — Rename / Bookmark / Export / Delete for the currently-open
 * conversation. Matches the mockup's `moreItems`. */
export function MoreSheet({
  visible,
  onClose,
  bookmarked,
  onRename,
  onToggleBookmark,
  onExport,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  bookmarked: boolean;
  onRename: () => void;
  onToggleBookmark: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      items={[
        { key: 'rename', label: 'Rename chat', icon: <Pencil size={16} color={colors.goldDark} strokeWidth={1.5} />, onPress: onRename },
        {
          key: 'bookmark',
          label: bookmarked ? 'Remove bookmark' : 'Bookmark chat',
          icon: <Icon name="bookmark" size={16} color={colors.goldDark} filled={bookmarked} />,
          onPress: onToggleBookmark,
        },
        { key: 'export', label: 'Export chat', icon: <Download size={16} color={colors.goldDark} strokeWidth={1.5} />, onPress: onExport },
        { key: 'delete', label: 'Delete chat', icon: <Trash2 size={16} color={colors.danger} strokeWidth={1.5} />, danger: true, onPress: onDelete },
      ]}
    />
  );
}
