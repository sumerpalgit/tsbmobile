/** Matches every `webSrc/app/dashboard/components/mini-cards/*.tsx` file's own `timeAgo()`
 * exactly — "just now"/"Xm ago"/"Xh ago"/"Xd ago" with NO cap and no fallback to a calendar date.
 * Deliberately not `src/utils/formatRelativeTime.ts` (this app's other, already-shipped feature
 * uses a different cutoff — it switches to "Jul 9" past a week), which is why the mini-cards'
 * "posted X ago" text was showing calendar dates ("May 29") instead of web's real "89d ago". */
export function cardTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
