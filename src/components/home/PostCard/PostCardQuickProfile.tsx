import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';
import { Avatar } from '../../Avatar';
import { Icon } from '../../icons/Icon';
import type { FeedProfile } from '../../../api/feed';

export type QuickProfileRow = { label: string; value: string };

export type QuickProfileContent = {
  sectionTitle: string;
  rows: QuickProfileRow[];
  chips: string[];
};

/**
 * The "quick profile" overlay that slides over a card's whole surface when its header's
 * quick-profile button is tapped — copied verbatim from `TSB Home FV.html`'s overlay markup
 * (`position:absolute;inset:0;display:flex;flex-direction:column`): a fixed header
 * (`flex:none`, `border-bottom:1px solid var(--line)` — the separator an earlier pass missed
 * entirely) above a scrollable content area (`flex:1;overflow-y:auto`, `ScrollView` here), with
 * each row getting its own `border-bottom` divider rather than just a gap between rows.
 */
export function PostCardQuickProfile({
  profile,
  isAnonymous,
  content,
  onClose,
}: {
  profile: FeedProfile;
  isAnonymous: boolean;
  content: QuickProfileContent;
  onClose: () => void;
}) {
  const { colors, fonts, fontSize, borderWidth, radius } = useTheme();

  const displayName = isAnonymous ? 'Anonymous' : profile.name;
  const roleLabel = isAnonymous ? null : profile.role_type;
  // `role_type · {sub_category or organization} · city` — confirmed against two real rendered
  // overlay screenshots: a searcher shows `sub_category` ("Searcher · Self Funded Searcher ·
  // Shanghai, China"), an employer with no `sub_category` shows `organization` instead ("Hiring
  // · Anchor Field Capital · Austin, TX"). Not one fixed field — whichever is populated.
  const metaLine = [roleLabel, profile.sub_category ?? profile.organization, profile.city]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.overlay, { backgroundColor: colors.surface }]}>
      <View style={[styles.header, { borderBottomColor: colors.feedCardLine, borderBottomWidth: borderWidth.thin }]}>
        <Avatar
          name={isAnonymous ? undefined : displayName}
          imageUri={isAnonymous ? null : profile.profile_img}
          size={44}
          fallbackColor={colors.feedFill}
          textColor={colors.feedOnFill}
        />
        <View style={styles.meta}>
          <Text style={[fonts.bold, { fontSize: fontSize.subtitle, color: colors.ink }]} numberOfLines={1}>
            {displayName}
          </Text>
          {!!metaLine && (
            <Text style={[fonts.regular, styles.metaLine, { fontSize: fontSize.caption, color: colors.ink3 }]}>
              {metaLine}
            </Text>
          )}
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close profile"
          style={[styles.closeButton, { backgroundColor: colors.surfaceSunken, borderRadius: 9 }]}
        >
          <Icon name="close" size={13} color={colors.ink2} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={styles.sectionLabel}>
          <View style={[styles.sectionBar, { backgroundColor: colors.gold }]} />
          <Text style={[fonts.bold, styles.sectionTitle, { color: colors.goldDark }]}>
            {content.sectionTitle.toUpperCase()}
          </Text>
        </View>

        <View>
          {content.rows.map(row => (
            <View key={row.label} style={[styles.row, { borderBottomColor: colors.feedCardLine, borderBottomWidth: borderWidth.thin }]}>
              <Text style={[fonts.regular, styles.rowLabel, { color: colors.ink3 }]}>{row.label}</Text>
              <Text style={[fonts.bold, styles.rowValue, { color: colors.ink }]} numberOfLines={2}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {content.chips.length > 0 && (
          <View style={styles.chipWrap}>
            {content.chips.map(chip => (
              <View
                key={chip}
                style={[
                  styles.chip,
                  { backgroundColor: colors.chip, borderRadius: radius.md, borderWidth: borderWidth.thin, borderColor: colors.homeCardBorder },
                ]}
              >
                <Text style={[fonts.semibold, styles.chipLabel, { color: colors.goldDark }]}>{chip}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 8,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 15,
    paddingBottom: 12,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  metaLine: {
    marginTop: 2,
    lineHeight: 16,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 15,
    paddingTop: 4,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 2,
  },
  sectionBar: {
    width: 3,
    height: 13,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 10.5,
    letterSpacing: 0.85,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 10,
  },
  rowLabel: {
    fontSize: 12.5,
  },
  rowValue: {
    fontSize: 12.5,
    lineHeight: 17.5,
    flex: 1,
    textAlign: 'right',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 14,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  chipLabel: {
    fontSize: 11,
  },
});
