import React, { useState } from 'react';
import { DollarSign } from 'lucide-react-native';
import { MiniCardShell, MiniCardChip } from './MiniCardShell';
import { MetricStrip } from './MetricStrip';
import { MiniCardActionButton, ActionState } from './MiniCardActionButton';
import { resolveCardCta } from './resolveCardCta';
import { MiniCardDescription } from './MiniCardDescription';
import { formatMoney, formatMoneyRange } from '../../home/PostCard/primitives/formatMoney';
import type { SearchCapitalItem } from '../../../types/home';
import type { MiniCardCommonProps } from './cardProps';

/** Search Capital — matches `SearchCapitalMiniCard.tsx` exactly: pill "Search Capital", chips
 * `type_of_searcher`/`current_status`, metrics Equity/Target EBITDA/Sectors, CTA "Back this
 * Searcher". Field mapping reuses `SearchCapitalBody.tsx`'s own confirmed fields. */
export function SearchCapitalCard({
  item,
  requestSearchCapitalPpm,
  ...common
}: MiniCardCommonProps & { item: SearchCapitalItem; requestSearchCapitalPpm: () => Promise<void> }) {
  const [state, setState] = useState<ActionState>(common.interacted ? 'done' : 'idle');

  const chips: MiniCardChip[] = [];
  if (item.type_of_searcher) chips.push({ label: item.type_of_searcher, variant: 'gold' });
  if (item.current_status) chips.push({ label: item.current_status, variant: 'muted' });

  const sectors = (item.sectors ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');

  const equityValue =
    item.equity_financing_amount != null
      ? formatMoney(item.equity_financing_amount, item.currency)
      : item.equity_financing_required === 'No'
        ? 'Not required'
        : '—';

  const metrics = [
    { label: 'Equity', value: equityValue },
    { label: 'Target EBITDA', value: formatMoneyRange({ min: item.target_ebitda_min, max: item.target_ebitda_max }, item.currency) ?? '—' },
    { label: 'Sectors', value: sectors || '—' },
  ];

  const handlePress = async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      await requestSearchCapitalPpm();
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
      PillIcon={DollarSign}
      pillLabel="Search Capital"
      title={item.post_title || 'Raising Search Capital'}
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
            label="Back this Searcher"
            loadingLabel="Requesting…"
            doneLabel="Requested ✓"
            state={state}
            onPress={handlePress}
          />
        ),
      })}
    >
      {!!item.post_description && <MiniCardDescription text={item.post_description} />}
      <MetricStrip metrics={metrics} />
    </MiniCardShell>
  );
}
