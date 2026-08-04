/** `"2026-07-09T07:33:02..."` → `"3h ago"` / `"5d ago"` / `"Jul 9"` (falls back to a plain date
 * past a week out, matching how most feeds avoid ever-growing "N days ago" strings). */
export function formatRelativeTime(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) {
    return '';
  }

  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(then).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
