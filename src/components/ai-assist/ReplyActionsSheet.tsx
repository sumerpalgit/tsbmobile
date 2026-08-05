import React from 'react';
import { AlignLeft, Download, RefreshCw, Share2 } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { ActionSheet } from './ActionSheet';

/** A message's "more" sheet — Summarise (real, `summariseAiMessage`) / Regenerate (toast-only
 * stub — neither webSrc nor the mockup implements this for real) / Export / Share. Matches the
 * mockup's `replyMenuItems`. */
export function ReplyActionsSheet({
  visible,
  onClose,
  onSummarise,
  onRegenerate,
  onExport,
  onShare,
}: {
  visible: boolean;
  onClose: () => void;
  onSummarise: () => void;
  onRegenerate: () => void;
  onExport: () => void;
  onShare: () => void;
}) {
  const { colors } = useTheme();

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      title="This answer"
      items={[
        { key: 'summarise', label: 'Summarise this answer', icon: <AlignLeft size={16} color={colors.goldDark} strokeWidth={1.6} />, onPress: onSummarise },
        { key: 'regenerate', label: 'Regenerate answer', icon: <RefreshCw size={15} color={colors.goldDark} strokeWidth={1.6} />, onPress: onRegenerate },
        { key: 'export', label: 'Export as text', icon: <Download size={15} color={colors.goldDark} strokeWidth={1.5} />, onPress: onExport },
        { key: 'share', label: 'Share answer', icon: <Share2 size={15} color={colors.goldDark} strokeWidth={1.4} />, onPress: onShare },
      ]}
    />
  );
}
