import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../theme';
import { Icon } from '../../icons/Icon';
import { formatTime } from '../eventVisuals';
import { WizardDraft } from './types';

/** Step 5 — final preview card, restyled from `EventListCard`'s visual language (accent-colored
 * date badge, type chip, title/description, When/Format tiles) rather than reusing that component
 * directly, since the review card composes from wizard draft fields, not a `MyEventItem`. */
export function StepReview({ draft }: { draft: WizardDraft }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  const dateParts = (() => {
    if (!draft.sdate) return { day: '—', month: 'TBD', long: 'Date to be confirmed' };
    const [y, m, d] = draft.sdate.split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    return {
      day: String(d || '—'),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      long: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    };
  })();

  const whenLine = [dateParts.long, draft.stime && formatTime(draft.stime), draft.etime && `– ${formatTime(draft.etime)}`, draft.tz]
    .filter(Boolean)
    .join(' ');

  const hostInitials =
    (draft.host.trim() || 'You')
      .split(' ')
      .filter(Boolean)
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return (
    <View style={styles.wrap}>
      <View style={[styles.noticeRow, { backgroundColor: colors.surface, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}>
        <View style={[styles.checkBadge, { backgroundColor: colors.successSurface, borderRadius: radius.pill }]}>
          <Icon name="checkmark" size={13} color={colors.success} />
        </View>
        <Text style={[fonts.regular, styles.noticeText, { color: colors.ink2 }]}>Final check — this is how the community will see your event.</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.xxl }]}>
        <View style={styles.cover}>
          {draft.coverFile ? (
            <Image source={{ uri: draft.coverFile.uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[colors.hero1, colors.hero2]} style={StyleSheet.absoluteFillObject} />
          )}
          <View style={[styles.typeBadge, { backgroundColor: colors.goldLight, borderRadius: radius.sm }]}>
            <Icon name="calendar" size={11} color="#182E43" />
            <Text style={[fonts.bold, styles.typeBadgeText]}>ETA Event</Text>
          </View>
          <View style={[styles.dateBadge, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
            <Text style={[fonts.bold, styles.dateMonth, { color: colors.goldDark }]}>{dateParts.month}</Text>
            <Text style={[fonts.display, styles.dateDay, { color: colors.ink }]}>{dateParts.day}</Text>
          </View>
        </View>

        <View style={[styles.hostRow, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
          <View style={[styles.hostAvatar, { backgroundColor: colors.accentSolid, borderRadius: radius.md }]}>
            <Text style={[fonts.bold, styles.hostInitials, { color: colors.onAccent }]}>{hostInitials}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[fonts.bold, styles.hostedByLabel, { color: colors.ink3 }]}>HOSTED BY</Text>
            <Text style={[fonts.semibold, styles.hostName, { color: colors.ink }]} numberOfLines={1}>
              {draft.host.trim() || 'You'}
            </Text>
          </View>
          <View style={[styles.typeChip, { backgroundColor: colors.chip, borderRadius: radius.sm }]}>
            <Text style={[fonts.bold, styles.typeChipText, { color: colors.goldDark }]}>{draft.etype}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={[fonts.display, styles.title, { color: colors.ink }]}>{draft.title || 'Untitled event'}</Text>
          {!!draft.desc && (
            <Text style={[fonts.regular, styles.desc, { color: colors.ink2 }]} numberOfLines={3}>
              {draft.desc}
            </Text>
          )}

          <View style={[styles.tileRow, { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}>
            <View style={[styles.tile, { backgroundColor: colors.surface2, borderRightColor: colors.border, borderRightWidth: borderWidth.thin }]}>
              <Text style={[fonts.bold, styles.tileLabel, { color: colors.ink3 }]}>WHEN</Text>
              <Text style={[fonts.semibold, styles.tileValue, { color: colors.ink }]} numberOfLines={2}>
                {whenLine}
              </Text>
            </View>
            <View style={[styles.tile, { backgroundColor: colors.surface2 }]}>
              <Text style={[fonts.bold, styles.tileLabel, { color: colors.ink3 }]}>FORMAT</Text>
              <Text style={[fonts.semibold, styles.tileValue, { color: colors.ink }]} numberOfLines={2}>
                {draft.fmt}{draft.venue ? ` · ${draft.venue}` : draft.link ? ` · ${draft.link}` : ''}
              </Text>
            </View>
          </View>

          {draft.roles.length > 0 && (
            <View style={styles.rolesRow}>
              <Text style={[fonts.bold, styles.forLabel, { color: colors.gold }]}>FOR</Text>
              {draft.roles.map(role => (
                <View key={role} style={[styles.roleChip, { backgroundColor: colors.chip, borderColor: colors.goldLight, borderWidth: borderWidth.thin, borderRadius: radius.sm }]}>
                  <Text style={[fonts.semibold, styles.roleChipText, { color: colors.goldDark }]}>{role}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={[styles.footNotice, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}>
        <Icon name="check" size={14} color={colors.ink3} />
        <Text style={[fonts.regular, styles.footNoticeText, { color: colors.ink2, fontSize: fontSize.small }]}>
          Tap "Create Event" to post this to your chapter feed and the TSB calendar. You can edit it any time from My Events.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 13,
    paddingTop: 17,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  checkBadge: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    overflow: 'hidden',
  },
  cover: {
    height: 152,
  },
  typeBadge: {
    position: 'absolute',
    top: 11,
    left: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 9.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#182E43',
  },
  dateBadge: {
    position: 'absolute',
    top: 11,
    right: 11,
    width: 46,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  dateDay: {
    fontSize: 20,
    lineHeight: 22,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  hostAvatar: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostInitials: {
    fontSize: 11,
  },
  hostedByLabel: {
    fontSize: 9,
    letterSpacing: 0.6,
  },
  hostName: {
    fontSize: 13,
    marginTop: 3,
  },
  typeChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  typeChipText: {
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  body: {
    padding: 14,
  },
  title: {
    fontSize: 21,
    lineHeight: 25,
  },
  desc: {
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: 7,
  },
  tileRow: {
    flexDirection: 'row',
    marginTop: 13,
    overflow: 'hidden',
  },
  tile: {
    flex: 1,
    padding: 11,
  },
  tileLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  tileValue: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  forLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  roleChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  roleChipText: {
    fontSize: 11,
  },
  footNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 11,
  },
  footNoticeText: {
    flex: 1,
    lineHeight: 16,
  },
});
