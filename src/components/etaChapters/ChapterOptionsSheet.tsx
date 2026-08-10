import React from 'react';
import { Bell, BookOpen, Calendar, LogOut, Search, Users } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { ActionSheet } from '../ai-assist/ActionSheet';

/** Chapter chat's "⋯" options menu — matches web's real 5-item menu (Notification prefs /
 * Search messages / View member directory / Upcoming events / Leave) plus the mockup's own 6th
 * item, "Community guidelines" (reopens the static guidelines sheet, view-only) — purely static
 * content, zero backend risk, kept per the plan's decision to include it. Reuses `ActionSheet`,
 * the same shared bottom-sheet chrome AI Assist and Messages both already use. */
export function ChapterOptionsSheet({
  visible,
  onClose,
  onNotificationPrefs,
  onSearchMessages,
  onViewMembers,
  onUpcomingEvents,
  onCommunityGuidelines,
  onLeave,
}: {
  visible: boolean;
  onClose: () => void;
  onNotificationPrefs: () => void;
  onSearchMessages: () => void;
  onViewMembers: () => void;
  onUpcomingEvents: () => void;
  onCommunityGuidelines: () => void;
  onLeave: () => void;
}) {
  const { colors } = useTheme();

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      title="Chapter"
      items={[
        { key: 'notif', label: 'Notification preferences', icon: <Bell size={17} color={colors.ink2} strokeWidth={1.6} />, onPress: onNotificationPrefs },
        { key: 'search', label: 'Search messages', icon: <Search size={17} color={colors.ink2} strokeWidth={1.6} />, onPress: onSearchMessages },
        { key: 'members', label: 'View member directory', icon: <Users size={17} color={colors.ink2} strokeWidth={1.6} />, onPress: onViewMembers },
        { key: 'events', label: 'Upcoming events', icon: <Calendar size={17} color={colors.ink2} strokeWidth={1.6} />, onPress: onUpcomingEvents },
        { key: 'guidelines', label: 'Community guidelines', icon: <BookOpen size={17} color={colors.ink2} strokeWidth={1.6} />, onPress: onCommunityGuidelines },
        { key: 'leave', label: 'Leave chapter', icon: <LogOut size={17} color={colors.danger} strokeWidth={1.6} />, danger: true, onPress: onLeave },
      ]}
    />
  );
}
