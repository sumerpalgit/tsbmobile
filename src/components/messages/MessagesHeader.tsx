import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { Logo } from '../Logo';

const INBOX_HEADER_HEIGHT = 58;

/** Messages' own header, replacing the shared `TopBar` for this tab (see
 * `DrawerNavigator.tsx`'s `focusedTabName` check, extended from AI Assist's to also cover
 * `'Messages'`). Two states matching the mockup: inbox (menu/logo left, theme+bell right, same
 * leading-group layout as `AiHeader.tsx`'s empty state) and thread (hero-gradient bar — back,
 * avatar+name+role+presence, view-profile). No "more"/options button here — the only real action
 * it exposed (mark as read) is already handled on open, and the rest duplicated the row-level
 * swipe menu, so it was dropped rather than kept as dead chrome.
 *
 * The leading hamburger opens the app's main side Drawer (`onOpenMenu`) — same convention
 * `AiHeader.tsx` established, not repurposed for anything else here either. */
export function MessagesHeader(
  props:
    | {
        view: 'inbox';
        onOpenMenu: () => void;
        onBellPress: () => void;
      }
    | {
        view: 'thread';
        name: string;
        role: string;
        presence: string;
        initials: string;
        avatarColor: string;
        onBack: () => void;
        onViewProfile: () => void;
      },
) {
  const { colors, fonts, fontSize, borderWidth, radius, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  if (props.view === 'inbox') {
    return (
      <View
        style={[
          styles.inboxContainer,
          {
            paddingTop: insets.top,
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderSoft,
            borderBottomWidth: borderWidth.thin,
          },
        ]}
      >
        <View style={[styles.inboxBar, { height: INBOX_HEADER_HEIGHT }]}>
          <View style={styles.leading}>
            <IconButton accessibilityLabel="Open menu" onPress={props.onOpenMenu}>
              <Icon name="menu" size={20} color={colors.ink} />
            </IconButton>
            <View style={{ marginLeft: 2 }}>
              <Logo size="small" showTagline />
            </View>
          </View>
          <View style={styles.trailing}>
            <IconButton
              accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onPress={toggleTheme}
              chip
            >
              <Icon name={isDark ? 'sun' : 'moon'} size={17} color={colors.ink2} />
            </IconButton>
            <IconButton accessibilityLabel="Notifications" onPress={props.onBellPress} chip>
              <Bell size={17} color={colors.ink2} strokeWidth={1.6} />
            </IconButton>
          </View>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.hero1, colors.hero2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: insets.top + 9, paddingHorizontal: 8, paddingBottom: 15 }}
    >
      <View style={styles.threadTopRow}>
        <IconButton accessibilityLabel="Back to inbox" onPress={props.onBack} light>
          <ChevronLeft size={22} color="#fff" strokeWidth={1.9} />
        </IconButton>
        <View style={{ flex: 1 }} />
        <IconButton accessibilityLabel="View profile" onPress={props.onViewProfile} light>
          <Icon name="account" size={18} color="rgba(255,255,255,0.85)" />
        </IconButton>
      </View>

      <View style={styles.threadIdentityRow}>
        <View
          style={[
            styles.threadAvatar,
            { backgroundColor: props.avatarColor, borderRadius: radius.pill },
          ]}
        >
          <Text style={[fonts.bold, { fontSize: 18, color: '#fff' }]}>{props.initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowDash} />
            <Text style={[fonts.bold, styles.eyebrow]}>Direct message</Text>
          </View>
          <Text numberOfLines={1} style={[fonts.display, styles.threadName]}>
            {props.name}
          </Text>
          <Text numberOfLines={1} style={[fonts.regular, styles.threadSub, { fontSize: fontSize.small + 1 }]}>
            {props.role} · {props.presence}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function IconButton({
  onPress,
  accessibilityLabel,
  chip = false,
  light = false,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  chip?: boolean;
  light?: boolean;
  children: React.ReactNode;
}) {
  const { colors, sizes, radius, borderWidth } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: sizes.iconButton,
          height: sizes.iconButton,
          borderRadius: chip ? 12 : radius.pill,
          borderWidth: chip ? borderWidth.thin : 0,
          borderColor: colors.border,
          backgroundColor: light
            ? pressed
              ? 'rgba(255,255,255,0.14)'
              : 'transparent'
            : chip
            ? pressed
              ? colors.cream
              : colors.surfaceSunken
            : pressed
            ? colors.cream
            : 'transparent',
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inboxContainer: {
    width: '100%',
  },
  inboxBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 4,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  threadIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingTop: 2,
  },
  threadAvatar: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowDash: {
    width: 14,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#C9A84C',
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: '#C9A84C',
  },
  threadName: {
    fontSize: 22,
    lineHeight: 25,
    color: '#fff',
    letterSpacing: -0.2,
    marginTop: 6,
  },
  threadSub: {
    color: 'rgba(255,255,255,0.66)',
    marginTop: 3,
  },
});
