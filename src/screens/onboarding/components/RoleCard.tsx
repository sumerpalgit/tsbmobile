import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Banknote,
  Briefcase,
  Building2,
  Check,
  GraduationCap,
  Settings,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { ROLES } from '../constants';

/** Per-role glyph, matching the design's Category grid — keyed by name since `ROLES` itself is
 * plain data (name/desc only), and icon components don't belong in a constants file. */
const ROLE_ICONS: Record<(typeof ROLES)[number]['name'], typeof Target> = {
  Searcher: Target,
  Investor: TrendingUp,
  Lender: Banknote,
  Advisor: Briefcase,
  'Business Owner': Building2,
  Operator: Settings,
  Intermediary: Users,
  Student: GraduationCap,
};

/** One role card inside `RoleSheet`. Its own file, same reasoning as `CategoryTrigger` — keeps the 8-item `.map` in `RoleSheet` from re-creating this JSX inline on every render. */
export function RoleCard({
  role,
  selected,
  onPress,
}: {
  role: (typeof ROLES)[number];
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, fonts } = useTheme();
  const RoleIcon = ROLE_ICONS[role.name];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.roleCard,
        { backgroundColor: selected ? colors.obChip : colors.obSurface2, borderColor: selected ? colors.obGold : colors.obLine2 },
      ]}
    >
      <View style={[styles.roleIcon, { backgroundColor: selected ? colors.obGold : colors.obSunken }]}>
        <RoleIcon size={17} color={selected ? colors.onAccent : colors.obInk2} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[fonts.authDisplay, styles.triggerTitle, { color: colors.obInk }]}>{role.name}</Text>
        <Text style={[fonts.regular, styles.roleDesc, { color: colors.obInk3 }]}>{role.desc}</Text>
      </View>
      <View
        style={[
          styles.tick,
          selected
            ? { backgroundColor: colors.obGold, borderColor: colors.obGold }
            : { backgroundColor: 'transparent', borderColor: colors.obLine2 },
        ]}
      >
        {selected && <Check size={11} color={colors.onAccent} strokeWidth={2.5} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 11,
    borderRadius: 15,
    borderWidth: 1,
  },
  roleIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerTitle: {
    fontSize: 14.5,
  },
  roleDesc: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  tick: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
