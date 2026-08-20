import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bookmark, Briefcase, CheckSquare, Download, Eye, FileText, LayoutTemplate, Trash2, Wrench } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../Avatar';
import { isHotResource } from '../../types/resources';
import type { ResourceItem } from '../../types/resources';
import type { ThemeColors } from '../../theme/colors';

/** Content-type → icon/color mapping. The mockup's own `iconFor` (~line 499) only has 3 real
 * branches (Templates/Checklists/else-as-Articles) — extended here to cover all 5 real content
 * types using the mockup's own filter-chip color choices for Tools/Case Studies (see the plan's
 * mismatch #4), not invented colors. */
function typeConfig(contentType: string, colors: ThemeColors) {
  switch (contentType) {
    case 'Templates':
      return { Icon: LayoutTemplate, fg: colors.indigo, bg: colors.indigoSurface };
    case 'Checklists':
      return { Icon: CheckSquare, fg: colors.success, bg: colors.successSurface };
    case 'Tools':
      return { Icon: Wrench, fg: colors.toolsAccent, bg: colors.toolsAccentSurface };
    case 'Case Studies':
      return { Icon: Briefcase, fg: colors.caseStudyAccent, bg: colors.caseStudyAccentSurface };
    default:
      return { Icon: FileText, fg: colors.goldDark, bg: colors.chip };
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function ResourceCard({
  item,
  saved,
  onOpen,
  onToggleSave,
  onDownload,
  onDelete,
}: {
  item: ResourceItem;
  saved: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
  onDownload: () => void;
  /** Only View Profile's Resources tab (Phase 5) passes this — matches web's `showDeleteButton`
   * prop on `ResourcesSection`, shown only for the signed-in user's OWN contributed resources.
   * `MyResourcesScreen`'s own usage never passes it, so its cards render unchanged. */
  onDelete?: () => void;
}) {
  const { colors, fonts, radius, borderWidth } = useTheme();
  const { Icon, fg, bg } = typeConfig(item.content_type, colors);
  const hot = isHotResource(item);
  const authorName = item.author_name || item.author_username || 'Member';
  const date = formatDate(item.created_at);

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderTopColor: fg, borderRadius: radius.xl, borderWidth: borderWidth.thin, borderTopWidth: 3 },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: bg, borderRadius: radius.lg }]}>
          <Icon size={19} color={fg} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.titleRow}>
            <Text style={[fonts.display, styles.title, { color: colors.ink }]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: bg, borderRadius: radius.sm }]}>
              <Text style={[fonts.bold, styles.typeBadgeText, { color: fg }]}>{item.content_type}</Text>
            </View>
            {onDelete && (
              <Pressable
                onPress={e => {
                  e.stopPropagation();
                  onDelete();
                }}
                accessibilityLabel="Delete resource"
                hitSlop={6}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              >
                <Trash2 size={14} color={colors.danger} strokeWidth={1.8} />
              </Pressable>
            )}
          </View>
          {!!item.description && (
            <Text style={[fonts.regular, styles.description, { color: colors.ink3 }]}>{item.description}</Text>
          )}
        </View>
      </View>

      <View style={[styles.metaRow, { borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
        <View style={styles.metaItem}>
          <Eye size={12} color={colors.ink3} strokeWidth={1.7} />
          <Text style={[fonts.regular, styles.metaText, { color: colors.ink3 }]}>{item.view_count} views</Text>
        </View>
        <View style={styles.metaItem}>
          <Download size={12} color={hot ? colors.gold : colors.ink3} strokeWidth={1.7} />
          <Text style={[hot ? fonts.bold : fonts.regular, styles.metaText, { color: hot ? colors.gold : colors.ink3 }]}>
            {item.download_count} downloads
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Avatar name={authorName} imageUri={item.author_img} size={22} fallbackColor={colors.feedFill} textColor={colors.feedOnFill} />
        <Text style={[fonts.semibold, styles.authorText, { color: colors.ink2 }]} numberOfLines={1}>
          {authorName}
          {!!date && ` · ${date}`}
        </Text>
        {!!item.file_url && (
          <Pressable
            onPress={e => {
              e.stopPropagation();
              onDownload();
            }}
            accessibilityLabel="Download"
            hitSlop={6}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Download size={15} color={colors.ink3} strokeWidth={1.7} />
          </Pressable>
        )}
        <Pressable
          onPress={e => {
            e.stopPropagation();
            onToggleSave();
          }}
          accessibilityLabel="Save resource"
          hitSlop={6}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Bookmark size={15} color={saved ? colors.gold : colors.ink3} fill={saved ? colors.gold : 'transparent'} strokeWidth={1.7} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 13,
    gap: 11,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16.5,
    lineHeight: 20,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  authorText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11.5,
  },
  iconButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
