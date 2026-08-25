import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { useTheme } from '../../../theme';

/**
 * One "Profile Completion"-style section card — matches the mockup's `imSections` card chrome
 * exactly (decoded `profilelast_decoded_role.html:2505-2616`): an eyebrow label above the card,
 * a header row (icon box + title + description + status badge + a pencil "Edit section" icon
 * shown ONLY when already complete), the section's own body content (`children` — each card
 * composes its own rows/chips/stats shape, matching the mockup's own per-section body variety
 * rather than one over-generalized renderer), and a footer that's either a right-aligned
 * "Complete this section" button (incomplete) or a plain 12px spacer (complete) — both drive the
 * SAME `onEdit`, matching the mockup's own `sec.onCta` reuse for both the pencil and the CTA
 * button. This is the default mode (`showStatus` omitted/true), used by Intermediary and Searcher.
 *
 * `showStatus={false}` — Investor's real mode: web's `CardShell` never passes `complete`/
 * `incomplete` for ANY of Investor's 5 cards, which per its own logic means `alwaysShowEdit = true`
 * — every card ALWAYS shows the edit pencil and NEVER shows a status badge or a "Complete this
 * section" CTA, regardless of how much data exists. `complete` is ignored entirely in this mode
 * (omit it) — some individual Investor cards still show their OWN inline "Add X" button when
 * empty, but that's ordinary `children` content, not this component's built-in CTA system.
 *
 * Icon box color defaults to the mockup's own status-driven rule (`--fill` navy when incomplete,
 * `--chip` gold when complete) — `iconBg`/`iconColor` override that per-card when explicitly
 * passed. Seller Profile passes a fixed navy override (per explicit user direction) since its
 * gold "complete" state looked wrong against the mockup screenshot being matched.
 */
export function RoleThesisSectionCard({
  label,
  icon,
  title,
  description,
  complete = true,
  showStatus = true,
  onEdit,
  iconBg,
  iconColor,
  ctaHelperText,
  alwaysShowCta,
  extraBadge,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Ignored when `showStatus={false}` — defaults to `true` so callers in that mode can omit it. */
  complete?: boolean;
  /** `false` for Investor's "always editable, no badge, no CTA" mode — see the doc comment above. */
  showStatus?: boolean;
  onEdit: () => void;
  /** Overrides the default complete/incomplete-driven icon box background. */
  iconBg?: string;
  /** Overrides the default complete/incomplete-driven icon color. */
  iconColor?: string;
  /** Left-aligned helper copy shown next to the "Complete this section" button — matches web's real
   * `SectionFooter`/`!hasData` footer, which is a `justify-between` row (helper text + button), not
   * a button alone. Per-card text on web (e.g. "Help buyers understand your intent and timeline"),
   * so this is a caller-supplied prop rather than one fixed string. Omit to fall back to the
   * previous button-only layout (right-aligned) for any card that hasn't been given its real copy
   * yet. */
  ctaHelperText?: string;
  /** Student's 3 middle cards (Engagement Preferences/Availability & Logistics/Interest & Fit) call
   * web's `<SectionFooter/>` UNCONDITIONALLY — not gated behind `{!hasData &&}` like every other
   * card built so far. The pencil in the header still follows the real `complete` value as normal
   * (so both the pencil AND the CTA row can show together when complete) — only the CTA row's own
   * visibility is decoupled from `complete` here. Omit for the normal (mutually-exclusive) behavior. */
  alwaysShowCta?: boolean;
  /** Extra badge rendered before the normal Complete/Incomplete badge — matches web's real
   * `statusBadge` prop on `CardShell` (Student's Supporting Materials card passes a "Not yet
   * shared" pill here, shown ALONGSIDE the normal badge, not instead of it — web's header renders
   * `{statusBadge}` then `{complete && <CompleteBadge/>}` then `{incomplete && <IncompleteBadge/>}`
   * as three independent checks, so both can appear together). Omit for every other card. */
  extraBadge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { colors, fonts } = useTheme();
  const showEditPencil = !showStatus || complete;
  const showCtaRow = !showEditPencil || alwaysShowCta;
  const resolvedIconBg = iconBg ?? (complete ? colors.chip : colors.hero1);
  const resolvedIconColor = iconColor ?? (complete ? colors.goldDark : '#fff');

  return (
    <View>
      <Text style={[fonts.bold, styles.eyebrow, { color: colors.ink3 }]}>{label}</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.homeCardBorder }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, { backgroundColor: resolvedIconBg }]}>
            {React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, { color: resolvedIconColor })
              : icon}
          </View>
          <View style={styles.headerText}>
            <Text style={[fonts.display, styles.title, { color: colors.ink }]}>{title}</Text>
            <Text style={[fonts.regular, styles.description, { color: colors.ink3 }]}>{description}</Text>
          </View>
          {(showStatus || !!extraBadge) && (
            <View style={styles.badgeStack}>
              {showStatus && (
                <View style={[styles.badge, { backgroundColor: complete ? colors.successSurface : colors.dangerSurface }]}>
                  <Text style={[fonts.bold, styles.badgeText, { color: complete ? colors.success : colors.danger }]}>
                    {complete ? 'Complete' : 'Incomplete'}
                  </Text>
                </View>
              )}
              {!!extraBadge && extraBadge}
            </View>
          )}
          {showEditPencil && (
            <Pressable
              onPress={onEdit}
              accessibilityLabel="Edit section"
              style={[styles.editButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Pencil size={16} color={colors.ink2} strokeWidth={1.8} />
            </Pressable>
          )}
        </View>

        {children}

        {showCtaRow ? (
          <View style={[styles.ctaRow, ctaHelperText && styles.ctaRowWithHelper, { borderTopColor: colors.borderSoft }]}>
            {!!ctaHelperText && (
              <Text style={[fonts.regular, styles.ctaHelperText, { color: colors.ink3 }]}>{ctaHelperText}</Text>
            )}
            <Pressable onPress={onEdit} style={[styles.ctaButton, { backgroundColor: colors.hero1 }]}>
              <Text style={[fonts.bold, styles.ctaText]}>Complete this section</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase', marginHorizontal: 2, marginBottom: 7 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13 },
  badgeStack: { alignItems: 'flex-start', gap: 6, flexShrink: 0 },
  iconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontSize: 15.5, lineHeight: 19 },
  description: { fontSize: 11, marginTop: 3 },
  badge: { flexShrink: 0, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  badgeText: { fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase' },
  editButton: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  spacer: { height: 12 },
  ctaRow: { alignItems: 'flex-end', paddingHorizontal: 14, paddingBottom: 14, paddingTop: 12, marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth },
  ctaRowWithHelper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ctaHelperText: { flex: 1, minWidth: 0, fontSize: 11 },
  ctaButton: { height: 42, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ctaText: { fontSize: 12.5, color: '#fff' },
});
