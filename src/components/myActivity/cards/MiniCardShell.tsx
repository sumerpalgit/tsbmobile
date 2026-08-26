import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { Avatar } from '../../Avatar';
import { cardTimeAgo } from './cardTime';
import { roleColor } from './roleColors';
import { ActivityCardMenu } from './ActivityCardMenu';

export type MiniCardChip = { label: string; variant: 'gold' | 'muted' };

/**
 * The real web card shell every `webSrc/app/dashboard/components/mini-cards/*.tsx` file shares —
 * confirmed by reading `DealBuyerMiniCard.tsx` plus 9 sibling files directly, not the mockup
 * (which shows a different, invented card design) and not `PostCard.tsx` (Home feed's own card,
 * which never had this navy band at all — a pre-existing gap in an earlier phase, out of scope
 * to fix here; My Activity gets its own matching cards instead of reusing `PostCard`).
 *
 * White header (avatar/name/role/meta/3-dot menu) → dark navy band (pill + serif title + chips) →
 * white body (`children`, per-type content) → optional `statusBarSlot` → white footer (like/
 * comment + `ctaSlot`).
 *
 * `combinedRoleLine` matches the one real header layout split web itself has:
 * `BackSearcherMiniCard`/`InvestInADealMiniCard`/`FindMyMatchMiniCard` show `ROLE | subCategory`
 * on one line instead of a gold-dot subCategory badge next to the name, and their meta line
 * drops `company` (`city · postedAgo` only) — replicated as a prop, not silently unified away.
 *
 * The 3-dot menu (`ActivityCardMenu.tsx`, matching web's real `MiniCardMenu.tsx`) lives in the
 * header's top-right corner, same position as every web mini-card.
 */
export function MiniCardShell({
  feedId,
  username,
  isOwner,
  onHide,
  onDeleted,
  avatarName,
  avatarImg,
  roleType,
  subCategory,
  company,
  city,
  createdAt,
  combinedRoleLine = false,
  PillIcon,
  pillLabel,
  title,
  titleLines = 3,
  chips,
  children,
  statusBarSlot,
  liked,
  likeCount,
  onLike,
  commentCount,
  onComment,
  ctaSlot,
}: {
  feedId: string;
  username?: string | null;
  isOwner: boolean;
  onHide: () => void;
  onDeleted: () => void;
  avatarName: string;
  avatarImg?: string | null;
  roleType?: string | null;
  subCategory?: string | null;
  company?: string | null;
  city?: string | null;
  createdAt: string;
  combinedRoleLine?: boolean;
  PillIcon: LucideIcon;
  pillLabel: string;
  title: string;
  titleLines?: number;
  chips?: MiniCardChip[];
  children?: React.ReactNode;
  statusBarSlot?: React.ReactNode;
  liked: boolean;
  likeCount: number;
  onLike: () => void;
  commentCount: number;
  onComment: () => void;
  ctaSlot: React.ReactNode;
}) {
  const { colors, fonts } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const roleC = roleColor(roleType, colors.accentSolid);
  const postedAgo = cardTimeAgo(createdAt);
  const metaParts = combinedRoleLine ? [city, postedAgo] : [company, city, postedAgo];
  const meta = metaParts.filter(Boolean).join(' · ');

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar name={avatarName} imageUri={avatarImg} size={38} fallbackColor={colors.accentSolid} />
        <View style={styles.headerText}>
          {combinedRoleLine ? (
            <>
              <Text style={[fonts.bold, styles.name, { color: colors.ink }]} numberOfLines={1}>
                {avatarName}
              </Text>
              {(roleType || subCategory) && (
                <View style={styles.roleLineRow}>
                  {roleType && (
                    <Text style={[fonts.bold, styles.roleLineText, { color: roleC }]}>{capFirst(roleType)}</Text>
                  )}
                  {roleType && subCategory && <Text style={{ color: colors.creamBorderBold }}> | </Text>}
                  {subCategory && <Text style={[fonts.regular, styles.subCategoryInline, { color: colors.ink3 }]}>{subCategory}</Text>}
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.nameRow}>
                <Text style={[fonts.bold, styles.name, { color: colors.ink }]} numberOfLines={1}>
                  {avatarName}
                </Text>
                {subCategory && (
                  <View style={styles.subCategoryBadge}>
                    <View style={[styles.subCategoryDot, { backgroundColor: colors.gold }]} />
                    <Text style={[fonts.bold, styles.subCategoryText, { color: colors.goldDark }]}>{subCategory}</Text>
                  </View>
                )}
              </View>
              {roleType && <Text style={[fonts.bold, styles.roleText, { color: roleC }]}>{capFirst(roleType)}</Text>}
            </>
          )}
          {!!meta && (
            <Text style={[fonts.regular, styles.meta, { color: colors.ink3 }]} numberOfLines={1}>
              {meta}
            </Text>
          )}
        </View>
        <Pressable onPress={() => setMenuOpen(true)} accessibilityLabel="More options" style={styles.menuButton}>
          <MoreHorizontal size={17} color={colors.ink3} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ActivityCardMenu
        visible={menuOpen}
        feedId={feedId}
        username={username ?? undefined}
        displayName={avatarName}
        isOwner={isOwner}
        onClose={() => setMenuOpen(false)}
        onHide={onHide}
        onDeleted={onDeleted}
      />

      {/* Navy band */}
      <View style={[styles.band, { backgroundColor: colors.accentSolid }]}>
        <View style={styles.pill}>
          <PillIcon size={10} color={colors.goldLight} strokeWidth={2.2} />
          <Text style={styles.pillText}>{pillLabel}</Text>
        </View>
        <Text style={[fonts.display, styles.title]} numberOfLines={titleLines}>
          {title}
        </Text>
        {!!chips?.length && (
          <View style={styles.chipsRow}>
            {chips.map(chip => (
              <View
                key={chip.label}
                style={[
                  styles.chip,
                  chip.variant === 'gold'
                    ? { backgroundColor: colors.goldExtraLight, borderColor: 'rgba(176,138,46,0.25)' }
                    : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.35)' },
                ]}
              >
                <Text
                  style={[fonts.bold, styles.chipText, { color: chip.variant === 'gold' ? colors.goldDark : 'rgba(255,255,255,0.92)' }]}
                >
                  {chip.label.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* White body */}
      {children && <View style={styles.body}>{children}</View>}

      {statusBarSlot}

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.creamDark }]}>
        <View style={styles.footerLeft}>
          <Pressable onPress={onLike} style={({ pressed }) => [styles.footerButton, pressed && styles.footerButtonPressed]}>
            <Heart size={13} color={liked ? colors.goldDark : colors.ink3} fill={liked ? 'rgba(176,138,46,0.18)' : 'transparent'} strokeWidth={1.6} />
            <Text style={[fonts.semibold, styles.footerButtonText, { color: liked ? colors.goldDark : colors.ink3 }]}>{likeCount}</Text>
          </Pressable>
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <Pressable onPress={onComment} style={({ pressed }) => [styles.footerButton, pressed && styles.footerButtonPressed]}>
            <MessageCircle size={13} color={colors.ink3} strokeWidth={1.6} />
            <Text style={[fonts.semibold, styles.footerButtonText, { color: colors.ink3 }]}>{commentCount}</Text>
          </Pressable>
        </View>
        <View style={styles.ctaSlot}>{ctaSlot}</View>
      </View>
    </View>
  );
}

function capFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    paddingBottom: 11,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  menuButton: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  subCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subCategoryDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
  },
  subCategoryText: {
    fontSize: 8.5,
    letterSpacing: 0.5,
  },
  roleText: {
    fontSize: 10,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  roleLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  roleLineText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  subCategoryInline: {
    fontSize: 11,
  },
  meta: {
    fontSize: 10.5,
    marginTop: 2,
  },
  band: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,
    gap: 9,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
  },
  title: {
    fontSize: 17,
    lineHeight: 21,
    color: '#fff',
    letterSpacing: -0.25,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 8.5,
    letterSpacing: 0.4,
  },
  body: {
    padding: 14,
    paddingTop: 13,
    paddingBottom: 11,
    gap: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingTop: 9,
    paddingBottom: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  footerButtonPressed: {
    opacity: 0.5,
  },
  footerButtonText: {
    fontSize: 11,
  },
  dot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    marginHorizontal: 2,
  },
  ctaSlot: {
    marginLeft: 'auto',
  },
});
