import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronLeft, MoreVertical, Plus } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { Avatar } from '../Avatar';

const INBOX_HEADER_HEIGHT = 58;

/** Messages' own header, replacing the shared `TopBar` for this tab (see
 * `DrawerNavigator.tsx`'s `focusedTabName` check, extended from AI Assist's to also cover
 * `'Messages'`). Two states matching the redesigned mockup (`Messages New.html`): inbox
 * (menu + plain "Messages" title on the left, theme toggle + new-message compose button on the
 * right — replaces the earlier logo+tagline title and the fake "3 new notifications" bell, which
 * is dropped entirely rather than kept as dead chrome) and thread (hero-gradient bar — back,
 * avatar+name+role+presence, view-profile, conversation options).
 *
 * The leading hamburger opens the app's main side Drawer (`onOpenMenu`) — same convention
 * `AiHeader.tsx` established, not repurposed for anything else here either. */
export function MessagesHeader(
  props:
    | {
        view: 'inbox';
        onOpenMenu: () => void;
        onNewMessage: () => void;
      }
    | {
        view: 'thread';
        name: string;
        role: string;
        presence: string;
        avatarColor: string;
        profileImg?: string | null;
        isOnline: boolean;
        onBack: () => void;
        onViewProfile: () => void;
        onOptions: () => void;
      },
) {
  const { colors, fonts, fontSize, borderWidth, isDark, toggleTheme } = useTheme();
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
            <Text style={[fonts.display, styles.inboxTitle, { color: colors.ink }]}>Messages</Text>
          </View>
          <View style={styles.trailing}>
            <IconButton
              accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onPress={toggleTheme}
              chip
            >
              <Icon name={isDark ? 'sun' : 'moon'} size={17} color={colors.ink2} />
            </IconButton>
            <IconButton accessibilityLabel="New message" onPress={props.onNewMessage} chip>
              <Plus size={17} color={colors.ink2} strokeWidth={1.7} />
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
      style={{ paddingTop: insets.top + 8, paddingHorizontal: 6, paddingBottom: 8 }}
    >
      <View style={styles.threadRow}>
        <IconButton accessibilityLabel="Back to inbox" onPress={props.onBack} light>
          <ChevronLeft size={20} color="#fff" strokeWidth={1.9} />
        </IconButton>

        <View style={styles.threadAvatarWrap}>
          <Avatar name={props.name} imageUri={props.profileImg} size={34} fallbackColor={props.avatarColor} />
          {props.isOnline && (
            <View style={[styles.threadPresenceDot, { backgroundColor: colors.success, borderColor: colors.hero1 }]} />
          )}
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[fonts.bold, styles.threadName]}>
            {props.name}
          </Text>
          <Text numberOfLines={1} style={[fonts.regular, styles.threadSub, { fontSize: fontSize.small }]}>
            {props.role} · {props.presence}
          </Text>
        </View>

        {/* Temporarily disabled — same reason as `ConversationOptionsSheet`'s "View profile" row:
            `resolveParticipantUsername` (`MessagesScreen.tsx`) fails with "Could not open this
            profile" whenever the thread has no message yet from the other participant. */}
        {/* <IconButton accessibilityLabel="View profile" onPress={props.onViewProfile} light>
          <Icon name="account" size={17} color="rgba(255,255,255,0.85)" />
        </IconButton> */}
        <IconButton accessibilityLabel="Conversation options" onPress={props.onOptions} light>
          <MoreVertical size={17} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
        </IconButton>
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
    gap: 4,
  },
  inboxTitle: {
    fontSize: 22,
    letterSpacing: -0.4,
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
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 4,
  },
  threadAvatarWrap: {
    position: 'relative',
  },
  threadPresenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  threadName: {
    fontSize: 15,
    lineHeight: 18,
    color: '#fff',
    letterSpacing: -0.1,
  },
  threadSub: {
    color: 'rgba(255,255,255,0.66)',
    marginTop: 1,
  },
});
