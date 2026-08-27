import React, { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { Icon, IconName } from '../../../icons/Icon';
import { ImageViewerModal } from '../../../messages/ImageViewerModal';
import type { EventItem } from '../../../../types/home';
import type { QuickProfileContent } from '../PostCardQuickProfile';

/** `"2026-06-13"` + `"05:57:00"` → `"Jun 13, 2026 · 05:57"` — confirmed against a real rendered
 * overlay screenshot; the time stays in 24-hour `HH:MM` (trimmed from the raw `HH:MM:SS`) rather
 * than converting to 12-hour, matching that reference exactly. */
function formatEventDateTime(dateStr: string, timeStr: string | undefined): string {
  const date = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = timeStr?.slice(0, 5);
  return time ? `${date} · ${time}` : date;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getDurationLabel(start: string, end: string): string {
  const days = Math.round((new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000));
  return days <= 1 ? '1 day' : `${days} days`;
}

/** Ported verbatim from web's `EventCard.tsx`'s own `IMAGE_POOL`/`hashId`/`getStockCover` — both
 * of web's card modes use this deterministic Unsplash pick as the visible card image (a user's
 * real `cover_image`, when present, only ever appears via the "View flyer" lightbox, never as the
 * card's own banner/background — a real, confirmed web quirk, not a mobile simplification). Same
 * feed id in → same photo out on both platforms. */
const IMAGE_POOL = [
  '1518770660439-4636190af475', '1611162617213-7d7a39e9b1d7', '1593642632559-0c6d3fc62b89',
  '1554224155-6726b3ff858f', '1450101499163-c8848c66ca85', '1573497019940-1c28c88b4f3e',
  '1517245386807-bb43f82c33c4', '1454165804606-c3d57bc86b40', '1498050108023-c5249f4df085',
  '1497366216548-37526070297c', '1444723121867-7a241cacace9', '1559136555-9303baea8ebd',
  '1540575467063-178a50c2df87', '1456513080510-7bf3a84b82f8', '1523050854058-8df90110c9f1',
  '1543269664-7eef42226a21', '1505373877841-8d25f7d46678', '1542744173-8e7e53415bb0',
  '1573164574572-cb89e39749b4', '1517248135467-4c7edcad34c4', '1591115765373-5207764f72e7',
  '1475721027785-f74eccf877e2', '1517457373958-b7bdd4587205', '1530023367847-a683933f4172',
];

function hashId(id: string): number {
  let h = 0;
  // `>>> 0` is required here, not stylistic — it's what keeps the hash a non-negative 32-bit
  // integer, exactly matching web's own `hashId` bit-for-bit (same feed id must pick the same
  // stock photo on both platforms).
  // eslint-disable-next-line no-bitwise
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function getStockCover(feedId: string): string {
  const photoId = IMAGE_POOL[hashId(feedId) % IMAGE_POOL.length];
  return `https://images.unsplash.com/photo-${photoId}?w=1200&h=680&fit=crop&crop=entropy&q=80&fm=jpg`;
}

/** Builds the quick-profile overlay's content for Events (`PostCard.tsx`'s
 * `getQuickProfileContent` dispatches here) — confirmed against a real rendered overlay
 * screenshot: section title is `event_type` (not `format` — that's a separate "Format" row),
 * rows are Start/End/Timezone/Format/Visibility exactly, and chips (`audience_roles`) render
 * lowercase/unmodified, not capitalized. */
export function getEventQuickProfile(item: EventItem): QuickProfileContent {
  const rows = [
    { label: 'Start', value: formatEventDateTime(item.start_date, item.start_time) },
    { label: 'End', value: formatEventDateTime(item.end_date, item.end_time) },
    { label: 'Timezone', value: item.timezone },
    { label: 'Format', value: item.format },
    { label: 'Visibility', value: item.visibility ? capitalize(item.visibility) : undefined },
  ].filter((row): row is { label: string; value: string } => !!row.value);

  return {
    sectionTitle: item.event_type || item.format,
    rows,
    chips: item.audience_roles ?? [],
  };
}

/**
 * Events — ported field-for-field and mode-for-mode from web's real `EventCard.tsx`
 * (`webSrc/app/dashboard/components/cards/EventCard.tsx`), not the separate mobile mockup this
 * body was originally built against (that version omitted the poster header entirely, showed the
 * user's real `cover_image` as the banner instead of web's deterministic stock photo, and had no
 * "Event Details"/"Schedule & Access" content at all). `PostCard.tsx` now renders the shared
 * `PostCardHeader` for events too (web's `FeedCardHeader` always shows one), so this only owns
 * the two body layouts web itself has:
 *  - **`hasCover`** (`item.cover_image` set): a 160px stock-photo banner (event type + visibility
 *    pills top-right, date tile bottom-left), then a cream content panel (type pill + "View
 *    flyer" → opens the REAL `cover_image` in `ImageViewerModal`, headline, chips, description,
 *    metrics strip).
 *  - **no cover**: one continuous dark panel — the stock photo as a full background with a
 *    gradient scrim, white text throughout, the same pill/date row, headline anchored toward the
 *    bottom, chips, description, metrics strip.
 * Both modes end in the same dark `EventDetailsPanel` (When/Where/Hosted By, always visible) which
 * expands into "Schedule & Access" (Start/End/Timezone/Format/Event link/Visibility) + audience
 * role chips when `expanded` (lifted to `PostCard.tsx`, toggled by `EventFooter`'s "View more" —
 * the SAME toggle also controls the description's line-clamp, matching web's single `expanded`
 * state driving both, not two independent toggles). Web's persistent two-column grid (content
 * beside the Event Details panel) is stacked vertically here — there's no room for two columns on
 * a phone — but every field and every color web uses is the same.
 */
export function EventBody({ item, feedId, expanded }: { item: EventItem; feedId: string; expanded: boolean }) {
  const { colors, fonts } = useTheme();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const hasCover = !!item.cover_image;
  const stockUri = getStockCover(feedId);
  const startDate = new Date(item.start_date);
  const month = startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = startDate.getDate();
  const eventType = item.event_type || item.format || 'Event';
  const visibilityLabel = item.visibility ? capitalize(item.visibility) : 'Public';
  const durationLabel = item.end_date && item.start_date ? getDurationLabel(item.start_date, item.end_date) : '—';

  const metrics = [
    { label: 'Format', value: item.format || '—', gold: false },
    { label: 'Visibility', value: visibilityLabel, gold: true },
    { label: 'Duration', value: durationLabel, gold: false },
    { label: 'Hosted By', value: item.hosted_by || '—', gold: true },
  ];

  return (
    <View style={styles.container}>
      {hasCover ? (
        <>
          <View style={styles.banner}>
            <Image source={{ uri: stockUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            <View style={styles.bannerPillsRow}>
              <DarkPill label={eventType} />
              <DarkPill label={visibilityLabel} />
            </View>
            <DateTile month={month} day={day} size={54} style={styles.bannerDateTile} />
          </View>

          <View style={[styles.creamPanel, { backgroundColor: colors.cream, borderColor: colors.creamBorder }]}>
            <View style={styles.pillRow}>
              <GoldPill icon="calendar" label={eventType} />
              <Pressable
                onPress={() => setLightboxOpen(true)}
                style={[styles.flyerButton, { backgroundColor: colors.goldExtraLight, borderColor: 'rgba(167,133,45,.4)' }]}
              >
                <Icon name="link" size={10} color={colors.goldDark} />
                <Text style={[fonts.semibold, styles.flyerButtonText, { color: colors.goldDark }]}>View flyer</Text>
              </Pressable>
            </View>

            <Text style={[fonts.display, styles.headlineDark, { color: colors.ink }]}>{item.title}</Text>

            <View style={styles.chipsRow}>
              <PillChip label={item.event_type || 'Event'} bg={colors.goldExtraLight} fg={colors.goldDark} border="rgba(167,133,45,.3)" />
              {!!item.rsvp_required && (
                <PillChip label="RSVP Open" bg={colors.accentSolidHover} fg="#fff" border="transparent" />
              )}
            </View>

            <Text style={[fonts.regular, styles.descriptionDark, { color: colors.ink2 }]} numberOfLines={expanded ? undefined : 2}>
              {item.event_description}
            </Text>

            <MetricsStrip metrics={metrics} dark={false} />
          </View>
        </>
      ) : (
        <View style={styles.darkPanel}>
          <Image source={{ uri: stockUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(24,46,67,.15)', 'rgba(24,46,67,.45)', 'rgba(24,46,67,.92)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.darkPanelContent}>
            <View style={styles.topRow}>
              <LightPill label={eventType} />
              <DateTile month={month} day={day} size={48} />
            </View>

            <View style={{ flex: 1 }} />

            <Text style={[fonts.display, styles.headlineLight]}>{item.title}</Text>

            <View style={styles.chipsRow}>
              {!!item.rsvp_required && <PillChip label="RSVP Open" bg="rgba(224,200,120,.9)" fg="#182E43" border="rgba(167,133,45,.5)" />}
              <PillChip label={visibilityLabel} bg="rgba(255,255,255,.18)" fg="#fff" border="rgba(255,255,255,.28)" />
            </View>

            <Text style={styles.descriptionLight} numberOfLines={expanded ? undefined : 3}>
              {item.event_description}
            </Text>

            <MetricsStrip metrics={metrics} dark />
          </View>
        </View>
      )}

      <EventDetailsPanel item={item} expanded={expanded} />

      {hasCover && (
        <ImageViewerModal visible={lightboxOpen} imageUrl={item.cover_image} onClose={() => setLightboxOpen(false)} />
      )}
    </View>
  );
}

function DarkPill({ label }: { label: string }) {
  return (
    <View style={[styles.smallPill, { backgroundColor: 'rgba(24,46,67,.7)' }]}>
      <Text style={styles.smallPillText}>{label.toUpperCase()}</Text>
    </View>
  );
}

function LightPill({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.eventTypePill, { backgroundColor: 'rgba(255,255,255,.96)' }]}>
      <Icon name="calendar" size={10} color={colors.accentSolid} />
      <Text style={[styles.eventTypePillText, { color: colors.accentSolid }]}>{label}</Text>
    </View>
  );
}

function GoldPill({ icon, label }: { icon: IconName; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.eventTypePill, { backgroundColor: colors.accentSolid }]}>
      <Icon name={icon} size={10} color="rgba(255,255,255,.9)" />
      <Text style={[styles.eventTypePillText, { color: 'rgba(255,255,255,.9)' }]}>{label}</Text>
    </View>
  );
}

function PillChip({ label, bg, fg, border }: { label: string; bg: string; fg: string; border: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.chipText, { color: fg }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

function DateTile({ month, day, size, style }: { month: string; day: number; size: number; style?: object }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[styles.dateTile, { width: size }, style]}>
      <View style={[styles.dateTileMonth, { backgroundColor: colors.gold }]}>
        <Text style={styles.dateTileMonthText}>{month}</Text>
      </View>
      <Text style={[fonts.display, styles.dateTileDay]}>{day}</Text>
    </View>
  );
}

function MetricsStrip({ metrics, dark }: { metrics: { label: string; value: string; gold: boolean }[]; dark: boolean }) {
  const { colors, fonts } = useTheme();
  return (
    <View
      style={[
        styles.metricsStrip,
        { borderTopColor: dark ? 'rgba(255,255,255,.18)' : colors.creamBorder },
      ]}
    >
      {metrics.map((m, idx) => (
        <View
          key={m.label}
          style={[
            styles.metricCell,
            idx > 0 && { borderLeftColor: dark ? 'rgba(255,255,255,.15)' : colors.creamBorder, borderLeftWidth: StyleSheet.hairlineWidth },
          ]}
        >
          <View style={[styles.metricMark, { backgroundColor: m.gold ? colors.gold : dark ? 'rgba(255,255,255,.4)' : `${colors.ink}40` }]} />
          <Text style={[fonts.bold, styles.metricLabel, { color: dark ? 'rgba(255,255,255,.6)' : colors.ink3 }]}>
            {m.label.toUpperCase()}
          </Text>
          <Text
            style={[fonts.semibold, styles.metricValue, { color: dark ? '#fff' : colors.ink }]}
            numberOfLines={1}
          >
            {m.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Matches web's `rightPanel` exactly — persistent When/Where/Hosted By, plus (when `expanded`)
 * "Schedule & Access": Start/End/Timezone/Format/Event link (tappable)/Visibility, then
 * audience-role chips. Always dark (`accentSolid`), bleeding to the card's full width below
 * whichever mode rendered above it — web places this beside its content in a 2-column grid;
 * stacking it here is the only real layout adaptation, every field/color is otherwise identical. */
function EventDetailsPanel({ item, expanded }: { item: EventItem; expanded: boolean }) {
  const { colors, fonts } = useTheme();
  const locationValue = item.location || (item.event_type === 'Online' ? 'Online' : '—');
  const whenSub = [item.start_time?.slice(0, 5), item.end_time?.slice(0, 5)].filter(Boolean).join(' – ') + (item.timezone ? ` ${item.timezone}` : '');

  const scheduleRows: { label: string; value: string; onPress?: () => void }[] = [
    { label: 'Start', value: formatEventDateTime(item.start_date, item.start_time) },
    { label: 'End', value: formatEventDateTime(item.end_date, item.end_time) },
  ];
  if (item.timezone) scheduleRows.push({ label: 'Timezone', value: item.timezone });
  if (item.format) scheduleRows.push({ label: 'Format', value: item.format });
  if (item.event_link) {
    scheduleRows.push({
      label: 'Event link',
      value: item.event_link.replace(/^https?:\/\//, '').split('/')[0],
      onPress: () => Linking.openURL(item.event_link!).catch(() => Toast.show({ type: 'error', text1: 'Could not open link' })),
    });
  }
  scheduleRows.push({ label: 'Visibility', value: item.visibility ? capitalize(item.visibility) : 'Public' });

  return (
    <View style={[styles.detailsPanel, { backgroundColor: colors.accentSolid }]}>
      <SectionEyebrow label="EVENT DETAILS" />
      <View style={{ gap: 7 }}>
        <WbBlock icon="calendar" label="When" val={fmtDate(item.start_date)} sub={whenSub.trim() || undefined} />
        <WbBlock icon="pin" label="Where" val={locationValue} />
        <WbBlock icon="people" label="Hosted By" val={item.hosted_by || '—'} />
      </View>

      {expanded && (
        <View style={styles.scheduleSection}>
          <SectionEyebrow label="SCHEDULE & ACCESS" small />
          {scheduleRows.map((row, index) => (
            <Pressable
              key={row.label}
              onPress={row.onPress}
              disabled={!row.onPress}
              style={[styles.scheduleRow, index < scheduleRows.length - 1 && styles.scheduleRowDivider]}
            >
              <Text style={styles.scheduleLabel}>{row.label}</Text>
              <Text
                style={[
                  fonts.semibold,
                  styles.scheduleValue,
                  { color: row.onPress ? colors.goldLight : '#fff' },
                  row.onPress && styles.scheduleLink,
                ]}
                numberOfLines={1}
              >
                {row.value}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {expanded && item.audience_roles.length > 0 && (
        <View style={styles.audienceRow}>
          {item.audience_roles.map((role, i) => (
            <View key={i} style={[styles.audienceChip, { borderColor: 'rgba(167,133,45,.3)' }]}>
              <Text style={[styles.audienceChipText, { color: colors.goldLight }]}>{role}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function SectionEyebrow({ label, small }: { label: string; small?: boolean }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={styles.eyebrowRow}>
      <View style={[styles.eyebrowBar, small && { height: 10 }, { backgroundColor: colors.gold }]} />
      <Text style={[fonts.bold, styles.eyebrowText, { color: colors.goldLight }]}>{label}</Text>
    </View>
  );
}

function WbBlock({ icon, label, val, sub }: { icon: IconName; label: string; val: string; sub?: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={styles.wbBlock}>
      <View style={styles.wbBlockHead}>
        <Icon name={icon} size={12} color={colors.goldLight} />
        <Text style={styles.wbBlockLabel}>{label.toUpperCase()}</Text>
      </View>
      <Text style={[fonts.semibold, styles.wbBlockVal]} numberOfLines={2}>
        {val}
      </Text>
      {!!sub && <Text style={styles.wbBlockSub}>{sub}</Text>}
    </View>
  );
}

/**
 * Event's bespoke footer — kept as its own component, rendered by `PostCard.tsx` *after*
 * `PostCardActions`, not returned from `EventBody` itself. An earlier version returned this
 * footer as the last element inside `EventBody`, which put it in the "body" slot — before
 * `PostCardActions` renders — so Events ended up with buttons-then-actions while every other
 * type (whose footer comes from the separate `PostCardFooter`, rendered after actions in
 * `PostCard.tsx`) correctly shows actions-then-buttons. This fixes that ordering to match.
 *
 * The left button used to be a "View Details" that called `onPrimaryPress` — but
 * `dispatchFeedPrimaryPress` has no `event` case, so it only ever showed a dead "Coming soon"
 * toast, and web's real `EventCard.tsx` has no such button at all. Replaced with web's actual
 * "View more"/"View less" toggle (`EventFooter`'s own `expanded`/`onToggleExpanded`), which
 * reveals `EventBody`'s description in full plus its `EventDetailsPanel`'s "Schedule & Access"
 * section — the SAME toggle drives both, matching web's single `expanded` state exactly.
 *
 * The right-hand slot has 4 real states in web's own `EventFooter` (`isOwnEvent` → "Your event" /
 * `isPastEvent` → "Event has passed" / already RSVPed → a non-interactive green "RSVP: Going"
 * pill with a checkmark / otherwise the gold "RSVP" button) — a prior pass here only had 2
 * (past-pill and a solid gold button whose label just swapped to "You're going" once RSVPed,
 * which reads as a still-tappable button, not web's confirmed/settled state). All 4 are ported
 * here now, literal colors matched (`#16a34a`/`rgba(22,163,74,...)` — web hardcodes these inline,
 * not a CSS var, so they're hardcoded here too rather than substituted with this app's own
 * `success` token, which is a different shade). Web's RSVP button also opens a modal to choose
 * Going/Maybe/Not attending; mobile's `onRsvp` only ever submits "attending" (no modal) — that's
 * a separate, larger scope not addressed here, but every *state this footer can display* now
 * matches web exactly, including "Your event" (`isOwnEvent`, previously missing entirely). */
export function EventFooter({
  item,
  isOwnEvent,
  expanded,
  onToggleExpanded,
  onRsvp,
}: {
  item: EventItem;
  isOwnEvent: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onRsvp?: () => void;
}) {
  const { colors, fonts } = useTheme();
  const isPast = new Date(item.end_date || item.start_date).getTime() < Date.now();

  return (
    <View style={styles.footerRow}>
      <Pressable
        onPress={onToggleExpanded}
        accessibilityRole="button"
        style={[styles.viewMoreButton, { backgroundColor: colors.surfaceSunken }]}
      >
        <Text style={[fonts.bold, styles.footerLabel, { fontSize: 12.5, color: colors.goldDark }]}>
          {expanded ? 'View less' : 'View more'}
        </Text>
        <View style={{ transform: [{ rotate: expanded ? '-90deg' : '90deg' }] }}>
          <Icon name="chevronRight" size={10} color={colors.goldDark} />
        </View>
      </Pressable>

      {isOwnEvent ? (
        <View style={[styles.pastPill, { backgroundColor: 'rgba(10,22,40,.04)', borderColor: 'rgba(10,22,40,.08)' }]}>
          <Text style={[fonts.semibold, styles.footerLabel, { fontSize: 12, color: 'rgba(10,22,40,.4)' }]}>Your event</Text>
        </View>
      ) : isPast ? (
        <View style={[styles.pastPill, { backgroundColor: colors.surfaceSunken, borderColor: colors.homeCardBorder }]}>
          <Text style={[fonts.semibold, styles.footerLabel, { fontSize: 12, color: colors.ink3 }]}>Event passed</Text>
        </View>
      ) : item.user_rsvped ? (
        <View style={[styles.rsvpedPill, { backgroundColor: 'rgba(22,163,74,.08)', borderColor: 'rgba(22,163,74,.25)' }]}>
          <Icon name="checkmark" size={12} color="#16a34a" />
          <Text style={[fonts.semibold, styles.footerLabel, { fontSize: 12.5, color: '#16a34a' }]}>RSVP: Going</Text>
        </View>
      ) : (
        <Pressable
          onPress={onRsvp}
          accessibilityRole="button"
          style={[styles.detailsButton, { backgroundColor: colors.gold }]}
        >
          <Text style={[fonts.bold, styles.footerLabel, { color: '#fff' }]}>RSVP</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Bleeds left/right to the card's true edges (cancelling `PostCard`'s own 15px padding) so the
  // image/dark sections sit flush against the card's rounded border, matching web exactly — but
  // NOT upward, unlike the old mockup-only version: `PostCardHeader` now renders above this for
  // events too (see `PostCard.tsx`'s doc comment), so pulling this up would overlap it. The small
  // gap between them is `PostCard`'s own `gap:11` between every child, same as every other type.
  container: {
    gap: 0,
    marginHorizontal: -15,
  },
  banner: {
    height: 160,
    overflow: 'hidden',
  },
  bannerPillsRow: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    gap: 6,
  },
  smallPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  smallPillText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#fff',
  },
  bannerDateTile: {
    position: 'absolute',
    left: 18,
    bottom: 14,
  },
  dateTile: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  dateTileMonth: {
    paddingVertical: 3,
    alignItems: 'center',
  },
  dateTileMonthText: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#fff',
  },
  dateTileDay: {
    fontSize: 20,
    color: '#182E43',
    textAlign: 'center',
    paddingVertical: 4,
  },
  creamPanel: {
    padding: 18,
    gap: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  eventTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 20,
  },
  eventTypePillText: {
    fontSize: 10,
    fontWeight: '500',
  },
  flyerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  flyerButtonText: {
    fontSize: 10,
  },
  headlineDark: {
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  descriptionDark: {
    fontSize: 12,
    lineHeight: 18.5,
  },
  metricsStrip: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 9,
    marginTop: 2,
  },
  metricCell: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 9,
  },
  metricMark: {
    width: 18,
    height: 2,
    borderRadius: 2,
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 8.5,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 12,
    marginTop: 2,
  },
  darkPanel: {
    minHeight: 320,
    overflow: 'hidden',
  },
  darkPanelContent: {
    padding: 18,
    gap: 10,
    minHeight: 320,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headlineLight: {
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.3,
    color: '#fff',
  },
  descriptionLight: {
    fontSize: 12,
    lineHeight: 18.5,
    color: 'rgba(255,255,255,.92)',
  },
  detailsPanel: {
    padding: 16,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  eyebrowBar: {
    width: 3,
    height: 11,
    borderRadius: 2,
  },
  eyebrowText: {
    fontSize: 8.5,
    letterSpacing: 1.2,
  },
  wbBlock: {
    backgroundColor: 'rgba(255,255,255,.08)',
    borderColor: 'rgba(255,255,255,.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9,
    padding: 11,
  },
  wbBlockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  wbBlockLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,.4)',
  },
  wbBlockVal: {
    fontSize: 12.5,
    color: '#fff',
    lineHeight: 17,
  },
  wbBlockSub: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,.65)',
    marginTop: 2,
  },
  scheduleSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopColor: 'rgba(255,255,255,.08)',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  scheduleRowDivider: {
    borderBottomColor: 'rgba(255,255,255,.06)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scheduleLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,.4)',
  },
  scheduleValue: {
    fontSize: 11,
    flexShrink: 1,
    textAlign: 'right',
  },
  scheduleLink: {
    textDecorationLine: 'underline',
  },
  audienceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 12,
    paddingTop: 12,
    borderTopColor: 'rgba(255,255,255,.08)',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  audienceChip: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  audienceChipText: {
    fontSize: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  viewMoreButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  detailsButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  // `flex: none`, not `flex: 1` — sized to its own content, not equal-width with the button
  // beside it (confirmed against the source: `flex:none;padding:0 14px`).
  pastPill: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpedPill: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  footerLabel: {
    fontSize: 13.5,
  },
});
