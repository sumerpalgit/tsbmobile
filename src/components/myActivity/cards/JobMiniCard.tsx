import React from 'react';
import { Briefcase } from 'lucide-react-native';
import { MiniCardShell, MiniCardChip } from './MiniCardShell';
import { MetricStrip } from './MetricStrip';
import { MiniCardActionButton } from './MiniCardActionButton';
import { resolveCardCta } from './resolveCardCta';
import { MiniCardDescription } from './MiniCardDescription';
import { formatMoneyRange } from '../../home/PostCard/primitives/formatMoney';
import type { JobItem } from '../../../types/home';
import type { MiniCardCommonProps } from './cardProps';

/** Jobs — matches web's `is_internship` split exactly (`JobMiniCard.tsx` = internship/early-
 * career, `JobOperatorMiniCard.tsx` = everything else — confirmed against
 * `my-activities/page.tsx`'s own dispatch table, which is authoritative over either file's own
 * internal naming). The "Applied ✓" done state is green-on-muted, not gold — a real, confirmed
 * difference from every other card's done state, replicated per `MiniCardActionButton`'s
 * `doneVariant`. No owner-pill branch (`showOwnerPill={false}`) — `JobOperatorMiniCard.tsx` has
 * none in web's own source. */
export function JobMiniCard({
  item,
  applied,
  openJobApply,
  ...common
}: MiniCardCommonProps & { item: JobItem; applied: boolean; openJobApply: () => void }) {
  const isInternship = item.is_internship;

  const chips: MiniCardChip[] = [];
  const goldChip = isInternship ? item.role_type : item.role_needed;
  if (goldChip) chips.push({ label: goldChip, variant: 'gold' });
  if (item.role_mode) chips.push({ label: item.role_mode, variant: 'muted' });

  const compensation =
    formatMoneyRange(item.fixed_compensation, item.currency) ??
    formatMoneyRange(item.hourly_rate, item.currency) ??
    item.compensation_type ??
    '—';

  const metrics = isInternship
    ? [
        { label: 'Comp', value: compensation },
        { label: 'Level', value: item.experience_level || '—' },
        { label: 'Start', value: item.preferred_start_date || '—' },
      ]
    : [
        { label: 'Level', value: item.experience_level || '—' },
        { label: 'Comp', value: compensation },
        { label: 'Location', value: item.location || '—' },
      ];

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
      subCategory="Hiring"
      company={common.profile.organization}
      city={common.profile.city}
      createdAt={common.createdAt}
      PillIcon={Briefcase}
      pillLabel={isInternship ? 'Hiring — Early Career' : 'Hiring — Operator / Exec'}
      title={item.role_title || (isInternship ? 'Internship Opportunity' : 'Executive Role')}
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
        showOwnerPill: false,
        nativeAction: (
          <MiniCardActionButton
            label="Apply Now"
            loadingLabel="Apply Now"
            doneLabel="Applied ✓"
            doneVariant="green"
            state={applied ? 'done' : 'idle'}
            onPress={openJobApply}
          />
        ),
      })}
    >
      {!!item.role_description && <MiniCardDescription text={item.role_description} />}
      <MetricStrip metrics={metrics} />
    </MiniCardShell>
  );
}
