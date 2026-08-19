import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../theme';
import { Measurable, OTHER_SPECIFY_SUB, ROLES, SUB_CATEGORIES } from '../../../screens/onboarding/constants';
import { FieldDropdown } from '../../../screens/onboarding/components/FieldDropdown';

/** Step 2 — a 2-column role grid (not `RoleSheet`'s bottom sheet, and not `RoleCard`'s row shape
 * either — the mockup's Choose Role cards are their own layout: no icon, badge+title stacked at
 * top, description below, 2-up grid, `grid-template-columns:1fr 1fr` in the decoded source) +
 * sub-category select (`FieldDropdown` reused as-is from onboarding). */
function RoleGridCard({
  name,
  desc,
  selected,
  isCurrent,
  onPress,
}: {
  name: string;
  desc: string;
  selected: boolean;
  isCurrent: boolean;
  onPress: () => void;
}) {
  const { colors, fonts } = useTheme();

  return (
    <Pressable
      onPress={isCurrent ? () => Toast.show({ type: 'info', text1: 'This is your current role' }) : onPress}
      style={[
        styles.card,
        isCurrent
          ? { borderColor: colors.obLine2, backgroundColor: colors.obSunken, borderStyle: 'dashed' }
          : selected
          ? { borderColor: colors.obGold, backgroundColor: colors.obChip }
          : { borderColor: colors.obLine2, backgroundColor: colors.obSurface2 },
      ]}
    >
      {isCurrent ? (
        <View style={[styles.badge, { backgroundColor: colors.obLine2 }]}>
          <Text style={[fonts.bold, styles.badgeText, { color: colors.obInk2 }]}>Current role</Text>
        </View>
      ) : null}
      <Text style={[fonts.bold, styles.cardTitle, { color: colors.obInk }]}>{name}</Text>
      <Text style={[fonts.regular, styles.cardDesc, { color: colors.obInk3 }]}>{desc}</Text>
    </Pressable>
  );
}

export function StepChooseRole({
  currentRoleLabel,
  roleType,
  subCategory,
  subCategoryOther,
  onRoleChange,
  onSubCategoryChange,
  onSubCategoryOtherChange,
  onSubCategoryFieldFocus,
  onSubCategoryFieldBlur,
}: {
  /** Disables that role's card (shows "Current role" instead, tapping it just toasts) — can't
   * pick your existing role again. */
  currentRoleLabel?: string;
  roleType: string;
  subCategory: string;
  subCategoryOther: string;
  onRoleChange: (role: string) => void;
  onSubCategoryChange: (value: string) => void;
  onSubCategoryOtherChange: (value: string) => void;
  /** Scrolls the field into view before its popup opens — it's the last field after the 8-card
   * role grid, so it often lands close to the footer once scrolled to. See `FieldDropdown.tsx`'s
   * `onFieldFocus` doc comment. */
  onSubCategoryFieldFocus?: (ref: React.RefObject<Measurable | null>) => Promise<void>;
  /** Fires when the popup closes, so the wizard can shrink the extra scroll space it grew back
   * down. See `FieldDropdown.tsx`'s `onFieldBlur` doc comment. */
  onSubCategoryFieldBlur?: () => void;
}) {
  const { colors, fonts, fontSize } = useTheme();

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text style={[fonts.display, styles.headline, { color: colors.obInk }]}>What brings you to The Search Bridge?</Text>
        <Text style={[fonts.regular, styles.body, { color: colors.obInk2 }]}>
          Choose the role for your second profile. Your current role can&apos;t be selected again.
        </Text>
      </View>

      <View style={{ gap: 7 }}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk2 }]}>
          Category <Text style={{ color: colors.obRequired }}>*</Text>
        </Text>
        <View style={styles.grid}>
          {ROLES.map(role => (
            <RoleGridCard
              key={role.name}
              name={role.name}
              desc={role.desc}
              selected={role.name === roleType}
              isCurrent={role.name === currentRoleLabel}
              onPress={() => onRoleChange(role.name)}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk2 }]}>
          Sub category <Text style={{ color: colors.obRequired }}>*</Text>
        </Text>
        <FieldDropdown
          value={subCategory}
          placeholder="Select sub category"
          options={SUB_CATEGORIES[roleType] ?? []}
          onChange={onSubCategoryChange}
          disabled={!roleType}
          onFieldFocus={onSubCategoryFieldFocus}
          onFieldBlur={onSubCategoryFieldBlur}
        />
        {subCategory === OTHER_SPECIFY_SUB ? (
          <TextInput
            value={subCategoryOther}
            onChangeText={onSubCategoryOtherChange}
            placeholder="Please specify"
            placeholderTextColor={colors.obInk3}
            style={[
              fonts.regular,
              styles.otherInput,
              { backgroundColor: colors.obSurface2, borderColor: colors.obLine2, color: colors.obInk, fontSize: fontSize.ui },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headline: { fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontSize: 12.5, lineHeight: 18 },
  fieldLabel: { fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { width: '48%', flexGrow: 1, padding: 11, borderRadius: 14, borderWidth: 1, gap: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5, marginBottom: 2 },
  badgeText: { fontSize: 8.5, letterSpacing: 0.3, textTransform: 'uppercase' },
  cardTitle: { fontSize: 12.5, lineHeight: 16 },
  cardDesc: { fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  otherInput: { height: 46, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1 },
});
