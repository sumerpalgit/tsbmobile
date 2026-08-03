import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { ROLES } from '../constants';

/** Trigger button for the "Category" field — opens `RoleSheet`. Its own file so it doesn't get re-created as part of the main screen's JSX every render. */
export function CategoryTrigger({ role, onPress }: { role: string; onPress: () => void }) {
  const { colors, fonts } = useTheme();
  const selectedRole = ROLES.find(r => r.name === role);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.trigger,
        { backgroundColor: role ? colors.obChip : colors.obSurface2, borderColor: role ? colors.obGold : colors.obLine2 },
      ]}
    >
      <View style={[styles.triggerIcon, { backgroundColor: role ? colors.obGold : colors.obSunken }]}>
        <Text style={[fonts.authDisplay, styles.triggerIconText, { color: role ? colors.onAccent : colors.obInk2 }]}>
          {role ? role.charAt(0) : '?'}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={[fonts.authDisplay, styles.triggerTitle, { color: role ? colors.obInk : colors.obInk3 }]}
          numberOfLines={1}
        >
          {role || 'Select your category'}
        </Text>
        <Text style={[fonts.regular, styles.triggerDesc, { color: colors.obInk3 }]} numberOfLines={1}>
          {selectedRole ? selectedRole.desc : 'Searcher, investor, advisor and more'}
        </Text>
      </View>
      <ChevronDown size={14} color={colors.obInk3} strokeWidth={1.6} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 11,
    borderRadius: 15,
    borderWidth: 1,
  },
  triggerIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerIconText: {
    fontSize: 15,
  },
  triggerTitle: {
    fontSize: 14.5,
  },
  triggerDesc: {
    fontSize: 11.5,
  },
});
