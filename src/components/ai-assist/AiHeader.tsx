import React from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ChevronLeft, Clock, MoreHorizontal, Plus, Share2 } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { Logo } from '../Logo';

const HEADER_HEIGHT = 58;

/** AI Assist's own header, replacing the shared `TopBar` for this tab (see
 * `DrawerNavigator.tsx`'s `focusedTabName` check). Two states, matching the mockup exactly:
 * empty (menu / logo / history / theme toggle / bell) and thread (back / title+meta / new chat /
 * bookmark / share / more).
 *
 * Leading group is [Menu, Logo] left-aligned in a row, matching `TopBar`'s own leading group
 * exactly (flush left, not centered in the bar). The hamburger opens the app's main side Drawer
 * (`onOpenMenu`) — same icon/position/behavior as every other screen's `TopBar`, since this
 * header fully replaces `TopBar` here and must not drop that convention. Trailing group is
 * [Theme, Notifications, History] — History is a distinct clock-icon button, rightmost, so it
 * doesn't collide with the hamburger's app-wide "open main Drawer" meaning. */
export function AiHeader(
  props:
    | {
        view: 'empty';
        onOpenMenu: () => void;
        onOpenHistory: () => void;
        onBellPress: () => void;
      }
    | {
        view: 'thread';
        threadTitle: string;
        threadMeta: string;
        bookmarked: boolean;
        onBack: () => void;
        onNewChat: () => void;
        onToggleBookmark: () => void;
        onShare: () => void;
        onMore: () => void;
      },
) {
  const { colors, fonts, fontSize, borderWidth, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderSoft,
          borderBottomWidth: borderWidth.thin,
        },
      ]}
    >
      <View style={[styles.bar, { height: HEADER_HEIGHT }]}>
        {props.view === 'empty' ? (
          <>
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
              <IconButton accessibilityLabel="Chat history" onPress={props.onOpenHistory} chip>
                <Clock size={17} color={colors.ink2} strokeWidth={1.6} />
              </IconButton>
            </View>
          </>
        ) : (
          <>
            <IconButton accessibilityLabel="Back" onPress={props.onBack}>
              <ChevronLeft size={22} color={colors.ink} strokeWidth={1.9} />
            </IconButton>
            <View style={styles.threadTitleBlock}>
              <Text
                numberOfLines={1}
                style={[fonts.bold, { fontSize: fontSize.body + 0.5, color: colors.ink }]}
              >
                {props.threadTitle}
              </Text>
              <Text style={[fonts.semibold, styles.threadMeta, { color: colors.ink3 }]}>
                {props.threadMeta}
              </Text>
            </View>
            <View style={styles.trailing}>
              <IconButton accessibilityLabel="New chat" onPress={props.onNewChat}>
                <Plus size={17} color={colors.ink2} strokeWidth={1.7} />
              </IconButton>
              <IconButton accessibilityLabel="Bookmark chat" onPress={props.onToggleBookmark}>
                <Icon name="bookmark" size={16} color={props.bookmarked ? colors.gold : colors.ink2} filled={props.bookmarked} />
              </IconButton>
              <IconButton accessibilityLabel="Share chat" onPress={props.onShare}>
                <Share2 size={16} color={colors.ink2} strokeWidth={1.4} />
              </IconButton>
              <IconButton accessibilityLabel="More" onPress={props.onMore}>
                <MoreHorizontal size={17} color={colors.ink2} strokeWidth={1.7} />
              </IconButton>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function IconButton({
  onPress,
  accessibilityLabel,
  chip = false,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  chip?: boolean;
  children: React.ReactNode;
}) {
  const { colors, sizes, radius, borderWidth } = useTheme();

  return (
    <Pressable
      // None of the header's actions (menu, history, theme, bell, back, new chat, bookmark,
      // share, more) need the keyboard — but tapping a plain `Pressable` doesn't blur a focused
      // `TextInput` on its own (that's normal RN behavior, not specific to this button), so a
      // composer left focused from typing kept the keyboard open/reappearing under any header
      // tap. Dismissing it first here covers every header button in one place.
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
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
          backgroundColor: chip
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
  container: {
    width: '100%',
  },
  bar: {
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
  threadTitleBlock: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
  },
  threadMeta: {
    fontSize: 10.5,
    marginTop: 1,
  },
});
