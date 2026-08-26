import React, { useState } from 'react';
import { Home, TrendingUp } from 'lucide-react-native';
import { MiniCardShell, MiniCardChip } from './MiniCardShell';
import { MetricStrip } from './MetricStrip';
import { MiniCardActionButton, ActionState } from './MiniCardActionButton';
import { resolveCardCta } from './resolveCardCta';
import { MiniCardDescription } from './MiniCardDescription';
import { formatMoney, formatMoneyRange } from '../../home/PostCard/primitives/formatMoney';
import { isRaisingCapital } from '../../home/PostCard/bodies/DealBody';
import type { DealItem } from '../../../types/home';
import type { MiniCardCommonProps } from './cardProps';

/** Share a Deal — both variants (buyer/capital), matching `DealBuyerMiniCard.tsx`/
 * `DealCapitalMiniCard.tsx` field-for-field: flat `_min`/`_max` fields (not a nested range
 * object — that was an earlier, never-verified guess that silently showed "—"/wrong text on
 * every real post, confirmed via a real on-device screenshot mismatch against web). "Total
 * Raise" reads `equity_financing_min` alone (a single value, not a range) and "Equity" reads
 * the separate `equity_financing_amount` — both real, if slightly odd, quirks of web's own data
 * model, replicated as-is rather than "fixed". */
export function DealMiniCard({
  item,
  requestDealNda,
  ...common
}: MiniCardCommonProps & { item: DealItem; requestDealNda: () => Promise<void> }) {
  const [state, setState] = useState<ActionState>(common.interacted ? 'done' : 'idle');
  const raisingCapital = isRaisingCapital(item);

  const chips: MiniCardChip[] = [];
  if (raisingCapital) {
    const exclusive = item.exclusivity_status === 'Yes' || (item.exclusivity_status ?? '').toLowerCase().includes('exclu');
    chips.push({ label: exclusive ? 'Exclusive' : 'Open Round', variant: 'gold' });
    const hasEquity = item.equity_financing_status === 'Yes' || !!item.equity_financing_amount || !!item.equity_financing_min;
    const hasDebt = item.debt_financing_status === 'Yes' || !!item.debt_financing_min;
    const structure = hasEquity && hasDebt ? 'Equity + Debt' : hasEquity ? 'Equity Only' : hasDebt ? 'Debt Only' : '—';
    chips.push({ label: structure, variant: 'muted' });
  } else {
    if (item.sba_eligibility_status === 'Yes') chips.push({ label: 'SBA Eligible', variant: 'gold' });
    const offMarket = !item.exclusivity_status || item.exclusivity_status.toLowerCase().includes('off');
    chips.push({ label: item.is_under_loi ? 'Under LOI' : offMarket ? 'Off-Market' : item.exclusivity_status!, variant: 'muted' });
  }

  const metrics = raisingCapital
    ? [
        {
          label: 'Total Raise',
          value: (item.equity_financing_min != null ? formatMoney(item.equity_financing_min, item.currency) : undefined) ?? item.total_capital_status ?? '—',
        },
        {
          label: 'Equity',
          value: (item.equity_financing_amount != null ? formatMoney(item.equity_financing_amount, item.currency) : undefined) ?? item.equity_financing_status ?? '—',
        },
        { label: 'Debt', value: formatMoneyRange({ min: item.debt_financing_min, max: item.debt_financing_max }, item.currency) ?? item.debt_financing_status ?? '—' },
      ]
    : [
        { label: 'Asking', value: formatMoneyRange({ min: item.asking_price_min, max: item.asking_price_max }, item.currency) ?? item.tentative_deal_value ?? '—' },
        { label: 'Revenue', value: formatMoneyRange({ min: item.revenue_min, max: item.revenue_max }, item.currency) ?? item.revenue_range ?? '—' },
        { label: 'EBITDA', value: formatMoneyRange({ min: item.ebitda_min, max: item.ebitda_max }, item.currency) ?? item.ebitda_range ?? '—' },
      ];

  const handlePress = async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      await requestDealNda();
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
      company={common.profile.organization}
      city={common.profile.city}
      createdAt={common.createdAt}
      PillIcon={raisingCapital ? TrendingUp : Home}
      pillLabel={raisingCapital ? 'Raising Capital' : 'Looking for a Buyer'}
      title={item.post_title || item.primary_objective || (raisingCapital ? 'Raising Capital' : 'Deal Opportunity')}
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
            label={raisingCapital ? 'Request Memo' : 'Request CIM'}
            loadingLabel="Requesting…"
            doneLabel="Requested ✓"
            state={state}
            onPress={handlePress}
          />
        ),
      })}
    >
      {!!(item.opportunity_description || item.opportunity_reason) && (
        <MiniCardDescription text={item.opportunity_description || item.opportunity_reason || ''} />
      )}
      <MetricStrip metrics={metrics} />
    </MiniCardShell>
  );
}
