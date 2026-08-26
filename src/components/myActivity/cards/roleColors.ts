/** Matches every `webSrc/app/dashboard/components/mini-cards/*.tsx` file's own `ROLE_COLORS`
 * map exactly (all identical except `BackSearcherMiniCard`'s extra `intermediary` entry, folded
 * in here too) — the role-type text/avatar-fallback color on each mini-card's header. */
const ROLE_COLORS: Record<string, string> = {
  searcher: '#182E43',
  investor: '#4c1d95',
  seller: '#155c38',
  advisor: '#92400e',
  lender: '#0369a1',
  operator: '#065f46',
  intermediary: '#3d5472',
  student: '#1e40af',
};

export function roleColor(roleType: string | null | undefined, fallback = '#182E43'): string {
  return ROLE_COLORS[(roleType ?? '').toLowerCase()] ?? fallback;
}
