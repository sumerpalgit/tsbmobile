import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Megaphone, Settings as SettingsIcon, UserRound, Users } from 'lucide-react-native';
import { useTheme } from '../../theme';

type MenuItem = {
  key: string;
  title: string;
  subtitle: string;
  Icon: typeof UserRound;
  /** "Create Dual Profile" uses the dark navy tile (`--fill`/`--onfill`) instead of the usual
   * gold-tinted chip — matches `Profile.html`'s `menuDefs` (`bg: 'dark'`). */
  darkTile?: boolean;
  badge?: string;
};

/** Matches `Profile.html`'s `menuDefs` (~line 2091) exactly — titles, subtitles, badge, and tile
 * treatment. All 4 items are real now: Ad Management, Create Dual Profile, and Settings from
 * earlier work; View Profile (`ViewProfileScreen`) is Phase 1 of the plan at
 * `delightful-seeking-snowglobe.md`, see `ProfileScreen`'s `onItemPress`. */
const MENU_ITEMS: MenuItem[] = [
  { key: 'view', title: 'View Profile', subtitle: 'See how others view you', Icon: UserRound },
  { key: 'ads', title: 'Ad Management', subtitle: 'Manage your active listings', Icon: Megaphone },
  { key: 'dual', title: 'Create Dual Profile', subtitle: 'Add a second role to this account', Icon: Users, darkTile: true, badge: 'NEW' },
  { key: 'settings', title: 'Settings', subtitle: 'Privacy, billing, notifications', Icon: SettingsIcon },
];

export function ProfileMenuList({ onItemPress }: { onItemPress: (key: string, title: string) => void }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
      {MENU_ITEMS.map((item, index) => (
        <Pressable
          key={item.key}
          onPress={() => onItemPress(item.key, item.title)}
          style={({ pressed }) => [
            styles.row,
            index < MENU_ITEMS.length - 1 && { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin },
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.iconWell,
              { borderRadius: radius.md, backgroundColor: item.darkTile ? colors.feedFill : colors.chip },
            ]}
          >
            <item.Icon size={18} color={item.darkTile ? colors.feedOnFill : colors.goldDark} strokeWidth={1.7} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.titleRow}>
              <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink }]} numberOfLines={1}>
                {item.title}
              </Text>
              {!!item.badge && (
                <View style={[styles.badge, { backgroundColor: colors.gold, borderRadius: radius.sm }]}>
                  <Text style={[fonts.bold, styles.badgeText, { color: colors.onGold }]}>{item.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 2 }]} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
          <ChevronRight size={15} color={colors.ink3} strokeWidth={1.8} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.6,
  },
  iconWell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 8.5,
    letterSpacing: 0.4,
  },
});
