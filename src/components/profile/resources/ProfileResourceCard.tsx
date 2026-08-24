import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bookmark, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import type { ResourceItem } from '../../../types/resources';

/** Matches web's real `BADGE_STYLES` map (`ResourcesSection.tsx`) exactly — literal one-off hex
 * values, not this app's theme tokens, since web itself has no dark-mode variant for these (they're
 * static regardless of theme there either). Ported as-is rather than mapped onto existing tokens,
 * same "port literal values web itself doesn't adapt" precedent as the mini-cards' `ROLE_COLORS`. */
const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  Articles: { bg: '#F5F0E1', color: '#B08A2E' },
  Article: { bg: '#F5F0E1', color: '#B08A2E' },
  Document: { bg: '#F5F0E1', color: '#B08A2E' },
  Templates: { bg: '#F5F0E1', color: '#B08A2E' },
  Template: { bg: '#DBEAFE', color: '#1D4ED8' },
  Presentation: { bg: '#EDE9FE', color: '#6D28D9' },
  Guide: { bg: '#D1FAE5', color: '#065F46' },
  Checklists: { bg: '#E0F2FE', color: '#075985' },
  Tools: { bg: '#FCE7F3', color: '#9D174D' },
  'Case Studies': { bg: '#FEF3C7', color: '#92400E' },
  Spreadsheet: { bg: '#FEF9C3', color: '#854D0E' },
};

function badgeStyle(type?: string | null) {
  return (type && BADGE_STYLES[type]) || { bg: '#E7E2D7', color: '#5A4B34' };
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

/**
 * Matches web's REAL `ContributedCard`/`SavedCard` (`webSrc/app/dashboard/components/
 * ResourcesSection.tsx`) — the components actually rendered on THIS page (`my-profile/page.tsx`'s
 * Resources tab), confirmed by reading their source directly. An earlier pass reused this app's
 * own `ResourceCard.tsx` instead (built for the unrelated My Resources browsing screen's own
 * mockup) — visually much more elaborate (per-type colored top border, an icon well, a views/
 * downloads metric row, an author avatar) — none of which exist in either real `ContributedCard`
 * or `SavedCard`. Same "assumed a similarly-named component matches without checking" mistake
 * already made once on this feature's Posts tab, caught again here by the user.
 *
 * Web's real cards have no click-to-open affordance at all (no `onClick` on either card, no
 * `resource_link` referenced in either component) — `onOpen` is kept here anyway as a reasonable,
 * minimal functional addition (a completely inert card would be worse UX), but no separate
 * download button/icon is added back, since that genuinely isn't part of either real design.
 */
export function ProfileResourceCard({
  item,
  variant,
  onOpen,
  onDelete,
  deleting,
  onUnsave,
}: {
  item: ResourceItem;
  variant: 'contributed' | 'saved';
  onOpen: () => void;
  /** Contributed only. */
  onDelete?: () => void;
  deleting?: boolean;
  /** Saved only. */
  onUnsave?: () => void;
}) {
  const { colors, fonts, elevation } = useTheme();
  const badge = badgeStyle(item.content_type);
  const dateLabel = fmtDate(item.created_at);

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        elevation('sm'),
        pressed && styles.pressed,
      ]}
    >
      {variant === 'contributed' && onDelete && (
        <Pressable
          onPress={e => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={deleting}
          accessibilityLabel="Delete resource"
          hitSlop={8}
          style={[styles.deleteButton, { opacity: deleting ? 0.4 : 0.6 }]}
        >
          <Trash2 size={14} color={colors.danger} strokeWidth={1.8} />
        </Pressable>
      )}

      <Text
        style={[fonts.semibold, styles.title, { color: colors.ink }, variant === 'contributed' && onDelete && styles.titleWithDelete]}
        numberOfLines={2}
      >
        {item.title}
      </Text>

      <Text style={[fonts.regular, styles.description, { color: colors.ink3 }]} numberOfLines={3}>
        {item.description || ''}
      </Text>

      {variant === 'contributed' ? (
        <View style={styles.footerRow}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[fonts.medium, styles.badgeText, { color: badge.color }]}>{item.content_type || 'Article'}</Text>
          </View>
          <Text style={[fonts.regular, styles.metaText, { color: colors.ink3 }]}>{dateLabel} · by You</Text>
        </View>
      ) : (
        <View style={styles.savedFooterRow}>
          <View style={styles.savedFooterLeft}>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[fonts.medium, styles.badgeText, { color: badge.color }]}>{item.content_type || 'Article'}</Text>
            </View>
            <View>
              <Text style={[fonts.regular, styles.metaText, { color: colors.ink3 }]}>{dateLabel}</Text>
              {!!item.author_name && (
                <Text style={[fonts.regular, styles.metaText, { color: colors.ink3 }]}>by {item.author_name}</Text>
              )}
            </View>
          </View>
          <Pressable
            onPress={e => {
              e.stopPropagation();
              onUnsave?.();
            }}
            accessibilityLabel="Unsave resource"
            hitSlop={8}
            style={styles.unsaveButton}
          >
            <Bookmark size={16} color={colors.ink2} fill={colors.ink2} strokeWidth={1.4} />
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  pressed: { opacity: 0.85 },
  deleteButton: { position: 'absolute', top: 12, right: 12, zIndex: 1 },
  title: { fontSize: 14, lineHeight: 19.6, marginBottom: 8 },
  titleWithDelete: { paddingRight: 20 },
  description: { fontSize: 12, lineHeight: 18, marginBottom: 14 },
  footerRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  savedFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  savedFooterLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  badgeText: { fontSize: 11 },
  metaText: { fontSize: 11 },
  unsaveButton: { flexShrink: 0, padding: 2 },
});
