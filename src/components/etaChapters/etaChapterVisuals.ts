/** Deterministic per-chapter cover gradient + initials, ported verbatim from web's
 * `getChapterGradientIdx`/`getChapterInitials`/`CHAPTER_GRADIENTS` (`my-eta-chapters/page.tsx:
 * 149-168`) — real `Group` has no color/accent field, so both web and this port derive one from
 * the chapter's real `name`, same reasoning already applied to Messages' avatar-fallback colors. */
export const CHAPTER_GRADIENTS: { from: string; to: string }[] = [
  { from: '#1A2B3C', to: '#2D4A6B' },
  { from: '#C4982A', to: '#7A5E18' },
  { from: '#2D6A4F', to: '#1B4332' },
  { from: '#6B2D6A', to: '#3D1A3C' },
  { from: '#3A5A8B', to: '#1E3459' },
  { from: '#8B3A3A', to: '#5C2020' },
  { from: '#4A6B3A', to: '#2B4A1B' },
  { from: '#5A4A7A', to: '#332B52' },
];

export function getChapterGradientIdx(name: string): number {
  return (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % 8;
}

export function getChapterInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** "{city} · {countryCode}" / "{city}" / `fallbackLocality` chain, matching web's `group.city ||
 * group.description?.split(',')[0]?.trim() || (activeTab==='international' ? 'International' :
 * 'Local')` — the last branch is genuinely tab-scoped on web since it only ever renders inside
 * the tab-filtered "All Chapters" grid. A joined chapter in "My chapters" isn't tied to either
 * tab, so callers there should pass a tab-agnostic fallback (e.g. `'Chapter'`) instead of
 * guessing local/international. */
export function getChapterPlace(
  group: { city?: string | null; description?: string | null; countryCode?: string | null },
  fallbackLocality: string,
): string {
  const locality = group.city || group.description?.split(',')[0]?.trim() || fallbackLocality;
  return group.countryCode ? `${locality} · ${group.countryCode}` : locality;
}

export function getEventsLabel(eventCount: number | undefined): string {
  const n = eventCount ?? 0;
  return n > 0 ? `${n} upcoming` : 'No meetups yet';
}

/** Mockup's inline status chip on each `AllChapterCard` row (`statusOf()`, ~ETAChapters mockup
 * script) — real fields only: web's own version also branches on `growth`/`lead` (fake demo
 * fields the real `Group` type doesn't have), so that "Seeking lead" branch is dropped here,
 * leaving the two real-data-derived states. */
export function getChapterStatus(chapter: { memberCount?: number; eventCount?: number }): { label: string; tone: 'ok' | 'neutral' } {
  if ((chapter.memberCount ?? 0) >= 100) return { label: 'ACTIVE', tone: 'ok' };
  if ((chapter.eventCount ?? 0) > 0) return { label: 'MEETUPS ON', tone: 'ok' };
  return { label: 'FORMING', tone: 'neutral' };
}
