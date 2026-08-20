import { apiClient } from './client';
import { ANALYTICS_ENDPOINTS } from './endpoints';

/** Matches `webSrc/app/dashboard/my-profile/page.tsx`'s `CompleteProfileTab` section rows —
 * `editPath` is real on web (each row is a clickable `<a href={sec.editPath}>`) but its exact
 * value/shape wasn't confirmed by research, so it's intentionally NOT modeled or navigated to
 * here — same "leave inert rather than guess a destination" precedent as Phase 1's disabled Edit
 * Profile button and Phase 2's originally-non-interactive Profile Insights ring. */
export type AnalyticsSection = {
  label: string;
  description: string;
  percentage: number;
};

/** Matches `fetchAnalyticsSummary`'s real response shape (web reads it defensively as `any`, with
 * `?? 0` fallbacks — mirrored here). `inboundViews`/`outboundReach`/`matchCount`/`postCount` are
 * confirmed real backend fields powering web's "Match Score Facts" stat grid, not fabricated
 * demo-only values despite superficially resembling the kind of invented metric this project has
 * caught elsewhere. */
export type AnalyticsSummary = {
  inboundViews: number;
  outboundReach: number;
  matchCount: number;
  postCount: number;
  completionPercentage: number | null;
  sections: AnalyticsSection[];
};

function normalizeSection(item: unknown): AnalyticsSection {
  const r = item as Record<string, unknown>;
  return {
    label: String(r?.label ?? ''),
    description: String(r?.description ?? ''),
    percentage: Number(r?.percentage ?? 0),
  };
}

/** `GET /profile/analytics/summary` — matches web's `fetchAnalyticsSummary()`, no params. */
export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const data = await apiClient.get(ANALYTICS_ENDPOINTS.SUMMARY).then(res => res.data).catch(() => null);
  const sections: unknown[] = Array.isArray(data?.sections) ? data.sections : [];
  return {
    inboundViews: Number(data?.inbound_views ?? 0),
    outboundReach: Number(data?.outbound_reach ?? 0),
    matchCount: Number(data?.match_count ?? 0),
    postCount: Number(data?.post_count ?? 0),
    completionPercentage: data?.completion_percentage != null ? Number(data.completion_percentage) : null,
    sections: sections.map(normalizeSection),
  };
}
