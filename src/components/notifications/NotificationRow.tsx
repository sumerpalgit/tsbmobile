import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BarChart3,
  BookOpen,
  Calendar,
  Heart,
  Info,
  MessageCircle,
  MessageSquare,
  Star,
  UserPlus,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../Avatar';
import type { NotificationItem, NotificationType } from '../../api/notifications';
import {
  getNotificationMessage,
  isMatchType,
  notificationTimeAgo,
  TYPE_CATEGORY_LABEL,
} from '../../utils/notificationDisplay';

/** Ported from web's `TYPE_CFG` — 14 types collapse to 7 real color pairs there (several types
 * share an identical bg/color, e.g. `comment` and `deal` are both the same blue, `follow` and
 * `community` are both the same green) — grouped here the same way rather than inventing 14
 * distinct palettes web itself doesn't have. Icon glyphs are the nearest `lucide-react-native`
 * equivalent to web's own hand-drawn SVG shape (this app's established convention — see
 * `ResourceCard.tsx`'s `typeConfig` — is a matching icon set, not pixel-identical custom paths).
 * Web defines no dark-mode variant for these (literal hex, not CSS vars) — dark values below
 * follow this file's own invert-lightness-keep-hue convention used for `indigo`/`toolsAccent`/etc. */
function getTypeVisual(type: NotificationType, isDark: boolean): { Icon: typeof Star; bg: string; fg: string } {
  const key = isMatchType(type) ? 'match' : type === 'post_recommendation' ? 'match' : type;
  switch (key) {
    case 'match':
      return { Icon: Star, bg: isDark ? 'rgba(146,64,14,.28)' : '#fef9e7', fg: isDark ? '#f0c869' : '#92400e' };
    case 'deal':
      return { Icon: BarChart3, bg: isDark ? 'rgba(44,90,160,.28)' : '#e6f0fb', fg: isDark ? '#7fb0f0' : '#2c5aa0' };
    case 'comment':
      return { Icon: MessageSquare, bg: isDark ? 'rgba(44,90,160,.28)' : '#e6f0fb', fg: isDark ? '#7fb0f0' : '#2c5aa0' };
    case 'community':
      return { Icon: MessageCircle, bg: isDark ? 'rgba(26,122,72,.26)' : '#e8f5ee', fg: isDark ? '#5fcf94' : '#1a7a48' };
    case 'follow':
      return { Icon: UserPlus, bg: isDark ? 'rgba(26,122,72,.26)' : '#e8f5ee', fg: isDark ? '#5fcf94' : '#1a7a48' };
    case 'eta_invitation':
      return { Icon: BookOpen, bg: isDark ? 'rgba(192,97,42,.26)' : '#fdeee6', fg: isDark ? '#e89a63' : '#c0612a' };
    case 'event':
      return { Icon: Calendar, bg: isDark ? 'rgba(192,57,43,.24)' : '#fbe9ec', fg: isDark ? '#e5847a' : '#c0392b' };
    case 'like':
      return { Icon: Heart, bg: isDark ? 'rgba(192,57,43,.24)' : '#fbe9ec', fg: isDark ? '#e5847a' : '#c0392b' };
    case 'message':
      return { Icon: MessageCircle, bg: isDark ? 'rgba(91,75,189,.28)' : '#eae7f7', fg: isDark ? '#a99ce0' : '#5b4bbd' };
    default:
      return { Icon: Info, bg: isDark ? 'rgba(107,114,128,.28)' : '#f0ede8', fg: isDark ? '#a9adb5' : '#6b7280' };
  }
}

/** Matches web's real full-page `NCard` exactly: the Accept/Decline row's only condition is
 * `type === 'eta_invitation' && eta_chapter_id` — it does NOT hide once `action_required` flips
 * to false after a successful action, so the buttons stay visible even after accepting/declining
 * (a real quirk of this page, not a bug to "fix" — the loading/settled "Joining…"/"Joined chapter"
 * state machine only exists on the OTHER component, the navbar's dropdown panel, which isn't part
 * of this build). `pending` here is a harmless mobile-only addition (dims + disables the buttons
 * mid-request so a slow network can't be double-tapped) — it changes no visible copy. */
type EtaInvitePending = 'idle' | 'accepting' | 'declining';

export function NotificationRow({
  item,
  onPress,
  onDismiss,
  onAcceptInvite,
  onDeclineInvite,
  etaInvitePending = 'idle',
}: {
  item: NotificationItem;
  onPress: () => void;
  onDismiss: () => void;
  onAcceptInvite: () => void;
  onDeclineInvite: () => void;
  etaInvitePending?: EtaInvitePending;
}) {
  const { colors, fonts, radius, borderWidth, isDark } = useTheme();
  const unread = !item.is_read;
  const { Icon, bg, fg } = getTypeVisual(item.type, isDark);
  const message = getNotificationMessage(item);
  const categoryLabel = TYPE_CATEGORY_LABEL[item.type];
  const time = notificationTimeAgo(item.created_at);

  const showEtaActions = item.type === 'eta_invitation' && !!item.eta_chapter_id;
  const showMatchCta = isMatchType(item.type);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderRadius: radius.lg,
          borderWidth: borderWidth.thin,
          borderColor: unread ? 'rgba(167,133,45,.32)' : colors.border,
          backgroundColor: unread ? (isDark ? 'rgba(167,133,45,.10)' : 'rgba(167,133,45,.07)') : colors.surface,
        },
        pressed && styles.pressed,
      ]}
    >
      {item.actor ? (
        <View style={styles.avatarWrap}>
          <Avatar name={item.actor.name} imageUri={item.actor.profile_img} size={42} />
          <View style={[styles.typeBadge, { backgroundColor: bg, borderColor: colors.surface }]}>
            <Icon size={9} color={fg} strokeWidth={1.8} />
          </View>
        </View>
      ) : (
        <View style={[styles.typeIconWell, { backgroundColor: bg, borderRadius: radius.md }]}>
          <Icon size={19} color={fg} strokeWidth={1.8} />
        </View>
      )}

      <View style={styles.body}>
        {item.action_required && (
          <View style={[styles.needsResponsePill, { backgroundColor: isDark ? 'rgba(180,131,31,.18)' : '#fffbeb', borderColor: isDark ? 'rgba(180,131,31,.4)' : '#fde68a' }]}>
            <Text style={[fonts.bold, styles.needsResponseText, { color: isDark ? '#e0b84a' : '#b45309' }]}>NEEDS RESPONSE</Text>
          </View>
        )}

        <Text style={[unread ? fonts.semibold : fonts.regular, styles.message, { color: unread ? colors.ink : colors.ink2 }]}>
          {message}
        </Text>

        <View style={styles.metaRow}>
          <Text style={[fonts.bold, styles.category, { color: colors.gold }]}>{categoryLabel}</Text>
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <Text style={[fonts.regular, styles.time, { color: colors.ink3 }]}>{time}</Text>
        </View>

        {showEtaActions && (
          <View style={styles.actionsRow}>
            <ActionButton label="Accept" primary disabled={etaInvitePending !== 'idle'} onPress={onAcceptInvite} />
            <ActionButton label="Decline" disabled={etaInvitePending !== 'idle'} onPress={onDeclineInvite} />
          </View>
        )}

        {showMatchCta && (
          <View style={styles.actionsRow}>
            {item.type === 'match_mutual' && <ActionButton label="View Match →" primary onPress={onPress} />}
            {item.type === 'match_nda_request' && <ActionButton label="Review NDA →" primary onPress={onPress} />}
            {(item.type === 'match_interest' || item.type === 'match_nda_signed') && (
              <ActionButton label="View in Matches →" onPress={onPress} />
            )}
          </View>
        )}
      </View>

      {unread && <View style={[styles.unreadDot, { backgroundColor: colors.gold, shadowColor: colors.gold }]} />}

      {/* Web reveals this on row-hover — no hover state on touch, so it's always visible here,
       * a deliberate mobile adaptation rather than a hidden/undiscoverable action. */}
      <Pressable
        onPress={e => {
          e.stopPropagation();
          onDismiss();
        }}
        accessibilityLabel="Dismiss notification"
        hitSlop={6}
        style={[styles.dismissButton, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}
      >
        <X size={12} color={colors.ink3} strokeWidth={1.8} />
      </Pressable>
    </Pressable>
  );
}

function ActionButton({ label, primary, disabled, onPress }: { label: string; primary?: boolean; disabled?: boolean; onPress: () => void }) {
  const { colors, fonts, radius, borderWidth } = useTheme();
  return (
    <Pressable
      onPress={e => {
        e.stopPropagation();
        if (!disabled) onPress();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        {
          borderRadius: radius.md,
          borderWidth: borderWidth.thin,
          backgroundColor: primary ? colors.accentSolid : colors.surface,
          borderColor: primary ? colors.accentSolid : colors.border,
          opacity: disabled ? 0.55 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={[fonts.semibold, styles.actionButtonText, { color: primary ? '#fff' : colors.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 13,
    paddingRight: 34,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  avatarWrap: {
    position: 'relative',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconWell: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  needsResponsePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  needsResponseText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
  },
  category: {
    fontSize: 11,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  time: {
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontSize: 11.5,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginTop: 6,
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  dismissButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
