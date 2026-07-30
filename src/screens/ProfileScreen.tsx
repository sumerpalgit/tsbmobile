import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useAuth } from '../store/AuthContext';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/icons/Icon';

/**
 * Profile — opened from the top-bar avatar. Phase 5 Part A builds the real one.
 */
function ProfileScreen() {
  const { logout } = useAuth();
  const { colors, fonts, fontSize, spacing, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.pageBg, paddingTop: insets.top + spacing.xxxl },
      ]}
    >
      <Avatar name="User" size={72} />

      <Text
        style={[
          fonts.display,
          { fontSize: fontSize.h3, color: colors.ink, marginTop: spacing.xl },
        ]}
      >
        Profile
      </Text>
      <Text
        style={[
          fonts.regular,
          { fontSize: fontSize.body, color: colors.ink3, marginTop: spacing.xs },
        ]}
      >
        Coming soon.
      </Text>

      <View
        style={[
          styles.phasePill,
          {
            backgroundColor: colors.goldExtraLight,
            borderRadius: radius.sm,
            marginTop: spacing.lg,
          },
        ]}
      >
        <Text style={[fonts.bold, styles.phaseText, { color: colors.goldDark }]}>
          Phase 5
        </Text>
      </View>

      <Pressable
        onPress={logout}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.signOut,
          {
            marginTop: spacing.xxxl,
            borderRadius: radius.lg,
            borderWidth: borderWidth.thin,
            borderColor: colors.border,
            backgroundColor: pressed ? colors.dangerSurface : colors.surface,
          },
        ]}
      >
        <Icon name="signOut" size={18} color={colors.danger} />
        <Text
          style={[
            fonts.semibold,
            {
              fontSize: fontSize.ui,
              color: colors.danger,
              marginLeft: spacing.sm,
            },
          ]}
        >
          Sign Out
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  phasePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  phaseText: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
});

export default ProfileScreen;
