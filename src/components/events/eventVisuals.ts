import type { MyEventItem } from '../../types/events';
import type { ThemeColors } from '../../theme';

/**
 * Shared visual mapping for My Events cards/detail/review — event type → accent color, and the
 * RSVP-state → status badge. Matches the mockup's own per-event `accent` values and its `badge()`
 * helper (`myevents_decoded.html`'s `events()`/`renderVals()`), not web's `getAccentGradient`/
 * `getStatusBadge` (`my-events/page.tsx`) — the mockup uses 6 event types with distinct accents
 * and collapses status to 3 states (Registered / RSVP open / Past event), simpler than web's
 * 4-state badge. UI follows the mockup, so this follows the mockup.
 */
const TYPE_ACCENTS: Record<string, string> = {
  'Chapter Event': '#2F7A5B',
  Webinar: '#1F5A55',
  Workshop: '#7A6020',
  Networking: '#6B4A7A',
  Conference: '#1F3A57',
  Technical: '#3A5A8C',
};

export function getEventTypeLabel(event: MyEventItem): string {
  if (event.event_type) return event.event_type;
  const format = (event.format ?? '').toLowerCase();
  if (format.includes('webinar')) return 'Webinar';
  if (format.includes('network') || format.includes('mixer')) return 'Networking';
  if (format.includes('workshop') || format.includes('roundtable') || format.includes('seminar')) return 'Workshop';
  if (format.includes('conference')) return 'Conference';
  return 'Chapter Event';
}

export function getEventAccent(event: MyEventItem, colors: ThemeColors): string {
  return TYPE_ACCENTS[getEventTypeLabel(event)] ?? colors.gold;
}

export function isVirtualEvent(event: MyEventItem): boolean {
  const type = (event.event_type ?? '').toLowerCase();
  const format = (event.format ?? '').toLowerCase();
  return type === 'online' || format.includes('virtual') || format.includes('webinar');
}

export function isEventPast(event: MyEventItem): boolean {
  const end = event.end_date ?? event.start_date;
  if (!end) return false;
  return new Date(end).getTime() < Date.now();
}

export type EventBadgeKind = 'registered' | 'open' | 'past';

export function getEventBadge(event: MyEventItem, isRsvped: boolean): { label: string; kind: EventBadgeKind } {
  if (isEventPast(event)) return { label: 'Past event', kind: 'past' };
  if (isRsvped) return { label: 'Registered', kind: 'registered' };
  return { label: 'RSVP open', kind: 'open' };
}

export function badgeColors(kind: EventBadgeKind, colors: ThemeColors): { bg: string; fg: string } {
  if (kind === 'registered') return { bg: colors.successSurface, fg: colors.success };
  if (kind === 'past') return { bg: colors.surfaceSunken, fg: colors.ink3 };
  return { bg: colors.chip, fg: colors.goldDark };
}

export function getEventDateParts(event: MyEventItem): { day: string; month: string } {
  if (!event.start_date) return { day: '—', month: '—' };
  const date = new Date(event.start_date);
  return {
    day: String(date.getDate()),
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  };
}

export function getEventMonthLabel(event: MyEventItem): string {
  if (!event.start_date) return 'Undated';
  return new Date(event.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** `"05:57:00"` → `"5:57 AM"`. */
export function formatTime(time: string | null): string {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${mStr ?? '00'} ${period}`;
}

export function formatTimeRange(event: MyEventItem): string {
  const start = formatTime(event.start_time);
  const end = formatTime(event.end_time);
  if (start && end) return `${start} – ${end}`;
  return start || end || '';
}

export function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
