import type { ComponentType } from 'react';
import {
  BarChart3,
  Briefcase,
  Calendar,
  DollarSign,
  HelpCircle,
  Home,
  Star,
  TrendingUp,
  Users2,
} from 'lucide-react-native';
import type { FeedEngagement, FeedItem } from '../../../api/feed';
import { formatMoney, formatMoneyRange } from '../../home/PostCard/primitives/formatMoney';
import { isRaisingCapital } from '../../home/PostCard/bodies/DealBody';

export type PostStat = { label: string; value: string };
export type PostCardChip = { text: string; variant: 'gold' | 'muted' };
export type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export type PostCardContent = {
  pillIcon: IconType;
  pillLabel: string;
  /** 'pill' = gold pill-bg badge next to the name (ATC/Poll subCategory). 'dot' = plain gold dot +
   * text, no bg (Deal/SearchCapital subCategory, Job's unconditional "Hiring"). 'none' = no
   * name-row badge — used together with `roleRowCombo` instead. */
  headerBadge: { kind: 'pill' | 'dot' | 'none'; text: string };
  /** true = role row reads "ROLE | subCategory" on one line (BackSearcher/InvestInADeal/
   * FindAConnection's real pattern); false = role label alone. */
  roleRowCombo: boolean;
  roleColor: string;
  metaParts: string[];
  title: string;
  titleClampLines: number;
  chips: PostCardChip[];
  bodyKind: 'description' | 'event' | 'atc' | 'poll';
  description?: string;
  event?: { dateLabel: string; timeLabel: string; location: string };
  atc?: { hasReply: boolean; text: string; author: string; role: string; upvotes: number };
  poll?: { options: { label: string; pct: number }[]; totalVotes: number; hasVoted: boolean };
  metrics: PostStat[];
  footerNote: string;
};

const ROLE_COLORS: Record<string, string> = {
  investor: '#4c1d95',
  seller: '#155c38',
  advisor: '#92400e',
  lender: '#0369a1',
  operator: '#065f46',
  student: '#1e40af',
};

function roleColorFor(roleType: string | null | undefined, fallback: string): string {
  return ROLE_COLORS[(roleType ?? '').toLowerCase()] ?? fallback;
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function fmtMonthYear(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Per-`feed_type` content for View Profile's Posts tab card — matches web's REAL mini-card
 * components (`webSrc/app/dashboard/components/mini-cards/*.tsx`), read directly (not the earlier
 * pass's research-summary paraphrase, and not the mockup's own fake `POST_DEFS` demo copy). Every
 * pill icon/label, chip pair, metric-strip label set, and header-badge style below is copied
 * field-for-field from that source, not approximated from a screenshot.
 *
 * `JobOperatorMiniCard` (a near-duplicate of `JobMiniCard` for exec/operator hires) is
 * DELIBERATELY not modeled as a separate variant — the real dispatch condition between the two
 * lives in whatever parent component orchestrates My Activity's card list, which wasn't in scope
 * to research here, and the two are close enough (same shell, same "Hiring" badge, same chip
 * shape) that `JobMiniCard`'s own internal `is_internship` branch covers this tab's needs without
 * guessing at an unconfirmed selection rule.
 *
 * `footerNote` is always shown instead of the real per-type CTA button (Reply/RSVP/Request Memo/
 * Apply Now/Cast Vote/Express Interest/...) — View Profile's Posts tab only ever shows the
 * signed-in user's OWN posts, and none of those CTAs make sense on your own post (web itself
 * static-pills 5 of the 8 real card types to "Your post"/"Your event" when `isOwner` is true; the
 * other 3 don't have an `isOwner` branch in the card itself, but showing a live-looking CTA that
 * calls nothing would be dead UI — so all 8 render the same static pill here for consistency,
 * matching the project's existing Posts-tab-is-read-only decision).
 */
export function getPostCardContent(item: FeedItem, engagement: FeedEngagement | undefined): PostCardContent {
  const roleType = item.profile.role_type;
  const commentCount = engagement?.comments.length ?? 0;

  switch (item.feed_type) {
    case 'atc': {
      const firstComment = engagement?.comments.find(c => !c.is_ai);
      const targetRoles = item.item.atc_role_types ?? [];
      const askingVal = targetRoles.length > 1 ? `${targetRoles.length} roles` : targetRoles[0] ? capitalize(targetRoles[0]) : 'All roles';
      return {
        pillIcon: HelpCircle,
        pillLabel: 'Ask the Community',
        headerBadge: item.profile.sub_category ? { kind: 'pill', text: item.profile.sub_category } : { kind: 'none', text: '' },
        roleRowCombo: false,
        roleColor: roleColorFor(roleType, '#182E43'),
        metaParts: [item.profile.organization, item.profile.city].filter((v): v is string => !!v),
        title: item.item.question_description || item.item.question_title,
        titleClampLines: 3,
        chips: [{ text: 'Open Question', variant: 'gold' }],
        bodyKind: 'atc',
        atc: {
          hasReply: !!firstComment,
          text: firstComment?.content ?? '',
          author: firstComment?.profile.name ?? '',
          role: firstComment?.profile.role_type ? capitalize(firstComment.profile.role_type) : '',
          upvotes: 0,
        },
        metrics: [
          { label: 'Replies', value: String(commentCount) },
          { label: 'Views', value: '—' },
          { label: 'Asking', value: askingVal },
        ],
        footerNote: 'Your post',
      };
    }

    case 'poll': {
      const options = item.item.options ?? [];
      const results = item.item.poll_results ?? [];
      const totalVotes = results.reduce((sum, o) => sum + o.votes, 0);
      const hasVoted = item.item.user_voted_index != null;
      return {
        pillIcon: BarChart3,
        pillLabel: 'Community Poll',
        headerBadge: item.profile.sub_category ? { kind: 'pill', text: item.profile.sub_category } : { kind: 'none', text: '' },
        roleRowCombo: false,
        roleColor: roleColorFor(roleType, '#182E43'),
        metaParts: [item.profile.organization, item.profile.city].filter((v): v is string => !!v),
        title: item.item.question,
        titleClampLines: 3,
        chips: [],
        bodyKind: 'poll',
        poll: {
          options: options.map((label, i) => ({ label, pct: totalVotes > 0 ? Math.round(((results[i]?.votes ?? 0) / totalVotes) * 100) : 0 })),
          totalVotes,
          hasVoted,
        },
        metrics: [],
        footerNote: 'Your post',
      };
    }

    case 'event': {
      const start = new Date(item.item.start_date);
      const dateLabel = Number.isNaN(start.getTime())
        ? item.item.start_date
        : start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeLabel = [item.item.start_time, item.item.end_time].filter(Boolean).join(' – ');
      return {
        pillIcon: Calendar,
        pillLabel: 'Event',
        headerBadge: { kind: 'none', text: '' },
        roleRowCombo: false,
        roleColor: roleColorFor(roleType, '#182E43'),
        metaParts: [item.profile.city].filter((v): v is string => !!v),
        title: item.item.title,
        titleClampLines: 4,
        chips: [{ text: 'RSVP Open', variant: 'muted' }],
        bodyKind: 'event',
        event: {
          dateLabel: dateLabel || '—',
          timeLabel,
          location: item.item.location || (item.item.format === 'Online' ? 'Online' : '—'),
        },
        metrics: [
          { label: 'Format', value: item.item.format || item.item.event_type || 'Event' },
          { label: 'Visibility', value: item.item.visibility ? capitalize(item.item.visibility) : 'Public' },
          { label: 'Hosted By', value: item.item.hosted_by || item.profile.name || '—' },
        ],
        footerNote: 'Your event',
      };
    }

    case 'job': {
      const isEarlyCareer = !!item.item.is_internship;
      const compVal = formatMoneyRange(item.item.fixed_compensation, item.item.currency) ?? formatMoneyRange(item.item.hourly_rate, item.item.currency) ?? item.item.compensation_type ?? '—';
      const levelVal = item.item.experience_level || '—';
      const locationVal = item.item.location || '—';
      const startVal = fmtMonthYear(item.item.preferred_start_date);
      return {
        pillIcon: Briefcase,
        pillLabel: isEarlyCareer ? 'Hiring — Early Career' : 'Hiring',
        headerBadge: { kind: 'dot', text: 'Hiring' },
        roleRowCombo: false,
        roleColor: roleColorFor(roleType, '#182E43'),
        metaParts: [item.item.company_name, item.profile.city, item.item.location].filter((v): v is string => !!v),
        title: item.item.role_title || (isEarlyCareer ? 'Internship Opportunity' : 'Role Opening'),
        titleClampLines: 4,
        chips: [
          { text: isEarlyCareer ? item.item.role_type : item.item.role_needed || item.item.role_type, variant: 'gold' as const },
          ...(item.item.role_mode ? [{ text: item.item.role_mode, variant: 'muted' as const }] : []),
        ].filter(c => !!c.text),
        bodyKind: 'description',
        description: item.item.role_description,
        metrics: isEarlyCareer
          ? [
              { label: 'Comp', value: compVal },
              { label: 'Level', value: levelVal },
              { label: 'Start', value: startVal },
            ]
          : [
              { label: 'Level', value: levelVal },
              { label: 'Comp', value: compVal },
              { label: 'Location', value: locationVal },
            ],
        footerNote: 'Your post',
      };
    }

    case 'deal': {
      const raising = isRaisingCapital(item.item);
      if (raising) {
        const hasEquity = item.item.equity_financing_status === 'Yes' || !!item.item.equity_financing_amount || !!item.item.equity_financing_min;
        const hasDebt = item.item.debt_financing_status === 'Yes' || !!item.item.debt_financing_min;
        const structureVal = hasEquity && hasDebt ? 'Equity + Debt' : hasEquity ? 'Equity Only' : hasDebt ? 'Debt Only' : '';
        const isExclusive = item.item.exclusivity_status === 'Yes' || (item.item.exclusivity_status || '').toLowerCase().includes('exclu');
        return {
          pillIcon: TrendingUp,
          pillLabel: 'Raising Capital',
          headerBadge: item.profile.sub_category ? { kind: 'dot', text: item.profile.sub_category } : { kind: 'none', text: '' },
          roleRowCombo: false,
          roleColor: roleColorFor(roleType, '#182E43'),
          metaParts: [item.profile.organization, item.profile.city].filter((v): v is string => !!v),
          title: item.item.post_title || 'Raising Capital',
          titleClampLines: 4,
          chips: [
            { text: isExclusive ? 'Exclusive' : 'Open Round', variant: 'gold' },
            ...(structureVal ? [{ text: structureVal, variant: 'muted' as const }] : []),
          ],
          bodyKind: 'description',
          description: item.item.opportunity_description,
          metrics: [
            {
              label: 'Total Raise',
              value: (item.item.equity_financing_min != null ? formatMoney(item.item.equity_financing_min, item.item.currency) : undefined) ?? item.item.total_capital_status ?? '—',
            },
            {
              label: 'Equity',
              value: (item.item.equity_financing_amount != null ? formatMoney(item.item.equity_financing_amount, item.item.currency) : undefined) ?? item.item.equity_financing_status ?? '—',
            },
            { label: 'Debt', value: formatMoneyRange({ min: item.item.debt_financing_min, max: item.item.debt_financing_max }, item.item.currency) ?? item.item.debt_financing_status ?? '—' },
          ],
          footerNote: 'Your post',
        };
      }
      const isSba = item.item.sba_eligibility_status === 'Yes';
      const isUnderLoi = item.item.deal_stage?.some(s => s.toLowerCase().includes('loi'));
      const isOffMarket = !item.item.exclusivity_status || item.item.exclusivity_status.toLowerCase().includes('off');
      return {
        pillIcon: Home,
        pillLabel: 'Looking for a Buyer',
        headerBadge: item.profile.sub_category ? { kind: 'dot', text: item.profile.sub_category } : { kind: 'none', text: '' },
        roleRowCombo: false,
        roleColor: roleColorFor(roleType, '#182E43'),
        metaParts: [item.profile.organization, item.profile.city].filter((v): v is string => !!v),
        title: item.item.post_title || 'Deal Opportunity',
        titleClampLines: 4,
        chips: [
          ...(isSba ? [{ text: 'SBA Eligible', variant: 'gold' as const }] : []),
          { text: isUnderLoi ? 'Under LOI' : isOffMarket ? 'Off-Market' : item.item.exclusivity_status, variant: 'muted' as const },
        ].filter(c => !!c.text),
        bodyKind: 'description',
        description: item.item.opportunity_description,
        metrics: [
          { label: 'Asking', value: formatMoneyRange({ min: item.item.asking_price_min, max: item.item.asking_price_max }, item.item.currency) ?? item.item.tentative_deal_value ?? '—' },
          { label: 'Revenue', value: formatMoneyRange({ min: item.item.revenue_min, max: item.item.revenue_max }, item.item.currency) ?? item.item.revenue_range ?? '—' },
          { label: 'EBITDA', value: formatMoneyRange({ min: item.item.ebitda_min, max: item.item.ebitda_max }, item.item.currency) ?? item.item.ebitda_range ?? '—' },
        ],
        footerNote: 'Your post',
      };
    }

    case 'search_capital': {
      const equityVal = item.item.equity_financing_amount != null
        ? formatMoneyRange({ min: item.item.equity_financing_amount }, item.item.currency) ?? '—'
        : item.item.equity_financing_required === 'No' ? 'Not required' : '—';
      return {
        pillIcon: DollarSign,
        pillLabel: 'Search Capital',
        headerBadge: item.profile.sub_category ? { kind: 'dot', text: item.profile.sub_category } : { kind: 'none', text: '' },
        roleRowCombo: false,
        roleColor: roleColorFor(roleType, '#182E43'),
        metaParts: [item.profile.organization, item.profile.city].filter((v): v is string => !!v),
        title: item.item.post_title || 'Raising Search Capital',
        titleClampLines: 4,
        chips: [
          ...(item.item.type_of_searcher ? [{ text: item.item.type_of_searcher, variant: 'gold' as const }] : []),
          ...(item.item.current_status ? [{ text: item.item.current_status, variant: 'muted' as const }] : []),
        ],
        bodyKind: 'description',
        description: item.item.post_description,
        metrics: [
          { label: 'Equity', value: equityVal },
          { label: 'Target EBITDA', value: formatMoneyRange({ min: item.item.target_ebitda_min, max: item.item.target_ebitda_max }, item.item.currency) ?? '—' },
          { label: 'Sectors', value: item.item.sectors || '—' },
        ],
        footerNote: 'Your post',
      };
    }

    case 'investor_corner': {
      const icItem = item.item;
      const metaParts = [item.profile.city].filter((v): v is string => !!v);
      if (icItem.scenario_type === 'Back a Searcher') {
        return {
          pillIcon: Star,
          pillLabel: 'Back a Searcher',
          headerBadge: { kind: 'none', text: '' },
          roleRowCombo: true,
          roleColor: roleColorFor(roleType, '#182E43'),
          metaParts,
          title: icItem.investment_mandate_title || 'Backing Self-Funded Searchers',
          titleClampLines: 4,
          chips: [
            ...(icItem.investment_stage_preference ? [{ text: icItem.investment_stage_preference, variant: 'gold' as const }] : []),
            ...(icItem.preferred_searcher_type ? [{ text: icItem.preferred_searcher_type, variant: 'muted' as const }] : []),
          ],
          bodyKind: 'description',
          description: icItem.mandate_description,
          metrics: [
            { label: 'Ticket', value: formatMoneyRange({ min: icItem.ticket_size_min, max: icItem.ticket_size_max }, icItem.currency) ?? '—' },
            { label: 'Deal Size', value: formatMoneyRange({ min: icItem.revenue_min, max: icItem.revenue_max }, icItem.currency) ?? '—' },
            { label: 'EBITDA', value: formatMoneyRange({ min: icItem.ebitda_min, max: icItem.ebitda_max }, icItem.currency) ?? '—' },
          ],
          footerNote: 'Your post',
        };
      }
      return {
        pillIcon: TrendingUp,
        pillLabel: 'Invest in a Deal',
        headerBadge: { kind: 'none', text: '' },
        roleRowCombo: true,
        roleColor: roleColorFor(roleType, '#182E43'),
        metaParts,
        title: icItem.investment_mandate_title || 'Looking to Invest in a Deal',
        titleClampLines: 4,
        chips: [
          ...(icItem.preferred_deal_type ? [{ text: icItem.preferred_deal_type, variant: 'gold' as const }] : []),
          ...(icItem.process_stage?.toLowerCase().includes('under loi') ? [{ text: 'Under LOI', variant: 'muted' as const }] : icItem.process_stage ? [{ text: icItem.process_stage, variant: 'muted' as const }] : []),
        ],
        bodyKind: 'description',
        description: icItem.mandate_description,
        metrics: [
          { label: 'Ticket', value: formatMoneyRange({ min: icItem.ticket_size_min, max: icItem.ticket_size_max }, icItem.currency) ?? '—' },
          { label: 'Deal Size', value: formatMoneyRange({ min: icItem.deal_size_min, max: icItem.deal_size_max }, icItem.currency) ?? '—' },
          { label: 'EBITDA', value: formatMoneyRange({ min: icItem.ebitda_min, max: icItem.ebitda_max }, icItem.currency) ?? '—' },
        ],
        footerNote: 'Your post',
      };
    }

    case 'find_a_connection':
      return {
        pillIcon: Users2,
        pillLabel: 'Looking to Connect',
        headerBadge: { kind: 'none', text: '' },
        roleRowCombo: true,
        roleColor: roleColorFor(roleType, '#182E43'),
        metaParts: [item.profile.city].filter((v): v is string => !!v),
        title: item.item.post_title || 'Connection Request',
        titleClampLines: 4,
        chips: [
          ...(item.item.urgency ? [{ text: item.item.urgency, variant: 'gold' as const }] : []),
          ...(item.item.visibility ? [{ text: item.item.visibility, variant: 'muted' as const }] : []),
        ],
        bodyKind: 'description',
        description: item.item.post_description,
        metrics: [
          { label: 'Focus', value: item.item.industry_focus ?? '—' },
          { label: 'Geography', value: item.item.geography_focus ?? '—' },
          { label: 'Size', value: formatMoneyRange(item.item.deal_size, item.item.currency) ?? '—' },
        ],
        footerNote: 'Your post',
      };

    default:
      return {
        pillIcon: HelpCircle,
        pillLabel: 'Post',
        headerBadge: { kind: 'none', text: '' },
        roleRowCombo: false,
        roleColor: '#182E43',
        metaParts: [],
        title: '',
        titleClampLines: 3,
        chips: [],
        bodyKind: 'description',
        description: '',
        metrics: [],
        footerNote: 'Your post',
      };
  }
}
