import React, { useState } from 'react';
import { Star, TrendingUp } from 'lucide-react-native';
import { MiniCardShell, MiniCardChip } from './MiniCardShell';
import { MetricStrip } from './MetricStrip';
import { MiniCardActionButton, ActionState } from './MiniCardActionButton';
import { resolveCardCta } from './resolveCardCta';
import { MiniCardDescription } from './MiniCardDescription';
import { formatMoneyRange } from '../../home/PostCard/primitives/formatMoney';
import type { InvestorCornerItem } from '../../../types/home';
import type { MiniCardCommonProps } from './cardProps';

/** Investor Corner — both scenarios (`BackSearcherMiniCard.tsx`/`InvestInADealMiniCard.tsx`),
 * matching their `ROLE | subCategory` combined header line (`combinedRoleLine` on the shell) and
 * pill/title/chips/metrics/CTA copy exactly. Field mapping reuses `InvestorCornerBody.tsx`'s own
 * `investment_mandate_title`/`mandate_description` fields. */
export function InvestorCornerMiniCard({
  item,
  handleInvestorCornerAction,
  ...common
}: MiniCardCommonProps & { item: InvestorCornerItem; handleInvestorCornerAction: () => Promise<void> }) {
  const [state, setState] = useState<ActionState>(common.interacted ? 'done' : 'idle');
  const isBackSearcher = item.scenario_type === 'Back a Searcher';

  const chips: MiniCardChip[] = [];
  if (isBackSearcher) {
    if (item.investment_stage_preference) chips.push({ label: item.investment_stage_preference, variant: 'gold' });
    if (item.preferred_searcher_type) chips.push({ label: item.preferred_searcher_type, variant: 'muted' });
  } else {
    if (item.preferred_deal_type) chips.push({ label: item.preferred_deal_type, variant: 'gold' });
    const stage = item.process_stage?.toLowerCase().includes('loi') ? 'Under LOI' : item.process_stage;
    if (stage) chips.push({ label: stage, variant: 'muted' });
  }

  const metrics = isBackSearcher
    ? [
        { label: 'Ticket', value: formatMoneyRange({ min: item.ticket_size_min, max: item.ticket_size_max }, item.currency) ?? '—' },
        // "Deal Size" reads `revenue_min/max` in this scenario — matches web's real
        // `BackSearcherMiniCard.tsx` exactly (no separate `deal_size` field exists for it).
        { label: 'Deal Size', value: formatMoneyRange({ min: item.revenue_min, max: item.revenue_max }, item.currency) ?? '—' },
        { label: 'EBITDA', value: formatMoneyRange({ min: item.ebitda_min, max: item.ebitda_max }, item.currency) ?? '—' },
      ]
    : [
        { label: 'Ticket', value: formatMoneyRange({ min: item.ticket_size_min, max: item.ticket_size_max }, item.currency) ?? '—' },
        { label: 'Deal Size', value: formatMoneyRange({ min: item.deal_size_min, max: item.deal_size_max }, item.currency) ?? '—' },
        { label: 'EBITDA', value: formatMoneyRange({ min: item.ebitda_min, max: item.ebitda_max }, item.currency) ?? '—' },
      ];

  const handlePress = async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      await handleInvestorCornerAction();
    } catch {
      // Toast already shown by the mutation's onError.
    }
    setState('done');
  };

  return (
    <MiniCardShell
      feedId={common.feedId}
      username={common.profile.username}
      isOwner={common.isOwner}
      onHide={common.onHide}
      onDeleted={common.onDeleted}
      avatarName={common.profile.name}
      avatarImg={common.profile.profile_img}
      roleType={common.profile.role_type}
      subCategory={common.profile.sub_category}
      city={common.profile.city}
      createdAt={common.createdAt}
      combinedRoleLine
      PillIcon={isBackSearcher ? Star : TrendingUp}
      pillLabel={item.scenario_type}
      title={item.investment_mandate_title || (isBackSearcher ? 'Backing Self-Funded Searchers' : 'Looking to Invest in a Deal')}
      chips={chips}
      statusBarSlot={common.statusBarSlot}
      liked={common.liked}
      likeCount={common.likeCount}
      onLike={common.onLike}
      commentCount={common.commentCount}
      onComment={common.onComment}
      ctaSlot={resolveCardCta({
        activeTab: common.activeTab,
        isOwner: common.isOwner,
        totalRequestCount: common.totalRequestCount,
        onViewRequests: common.onViewRequests,
        onViewRequest: common.onViewRequest,
        nativeAction: (
          <MiniCardActionButton
            label="Express Interest"
            loadingLabel="Sending…"
            doneLabel="Interest Sent ✓"
            state={state}
            onPress={handlePress}
          />
        ),
      })}
    >
      {!!item.mandate_description && <MiniCardDescription text={item.mandate_description} />}
      <MetricStrip metrics={metrics} />
    </MiniCardShell>
  );
}
