import React from 'react';
import { Link2 } from 'lucide-react-native';
import { MiniCardShell } from './MiniCardShell';
import { DealMiniCard } from './DealMiniCard';
import { InvestorCornerMiniCard } from './InvestorCornerMiniCard';
import { SearchCapitalCard } from './SearchCapitalCard';
import { JobMiniCard } from './JobMiniCard';
import { EventActivityCard } from './EventActivityCard';
import { PollActivityCard } from './PollActivityCard';
import { AtcActivityCard } from './AtcActivityCard';
import { MiniCardDescription } from './MiniCardDescription';
import { resolveCardCta } from './resolveCardCta';
import type { MyActivityFeedItem } from '../../../api/myActivity';
import type { FeedEngagement } from '../../../api/feed';
import type { MiniCardCommonProps } from './cardProps';

/**
 * My Activity's real card dispatcher — matches web's actual `*MiniCard.tsx` family (navy band +
 * gold-tick metrics + tab-aware CTA), NOT `PostCard.tsx` (Home feed's own, structurally different
 * card — see the plan's Decision on this). Feed-type routing mirrors
 * `webSrc/app/dashboard/my-activities/page.tsx`'s own dispatch table exactly: `deal` splits by
 * `isRaisingCapital`, `investor_corner` splits by `scenario_type`, `job` splits by
 * `is_internship`. `find_a_connection` has no confirmed backend action anywhere in this app (per
 * the plan) and is excluded from `my-posts`/`interacted-posts` by construction — it can still
 * appear on `liked-posts`/`commented-posts`, so it gets a minimal fallback card (title +
 * description, no chips/metrics/native action) rather than a blank gap.
 */
export function ActivityMiniCard({
  item,
  engagement,
  currentUsername,
  activeTab,
  onLike,
  onComment,
  onViewRequests,
  onViewRequest,
  requestDealNda,
  requestPpm,
  handleInvestorCornerAction,
  submitRsvp,
  submitPollVote,
  openJobApply,
  statusBarSlot,
  onHide,
  onDeleted,
}: {
  item: MyActivityFeedItem;
  engagement?: FeedEngagement;
  currentUsername?: string;
  activeTab: MiniCardCommonProps['activeTab'];
  onLike: () => void;
  onComment: () => void;
  onViewRequests: () => void;
  onViewRequest: () => void;
  requestDealNda: () => Promise<void>;
  requestPpm: () => Promise<void>;
  handleInvestorCornerAction: () => Promise<void>;
  submitRsvp: () => Promise<void>;
  submitPollVote: (optionIndex: number) => void;
  openJobApply: () => void;
  statusBarSlot?: React.ReactNode;
  onHide: () => void;
  onDeleted: () => void;
}) {
  const common: MiniCardCommonProps = {
    feedId: item.id,
    itemId: item.item_id,
    profile: item.profile,
    createdAt: item.created_at,
    liked: engagement?.likes.liked ?? false,
    likeCount: engagement?.likes.count ?? 0,
    commentCount: engagement?.comments.length ?? 0,
    interacted: engagement?.isPlayed ?? false,
    onLike,
    onComment,
    activeTab,
    isOwner: !!currentUsername && item.profile.username === currentUsername,
    // `request_breakdown.total` is the real backend-computed count; `recent_requesters` is only a
    // preview list and undercounts once a post has more requesters than the preview holds — matches
    // web's own `reqBreakdown.total ?? recent_requesters?.length ?? 0` (`my-activities/page.tsx`).
    totalRequestCount: item.request_breakdown?.total ?? item.recent_requesters?.length ?? 0,
    onViewRequests,
    onViewRequest,
    statusBarSlot,
    onHide,
    onDeleted,
  };

  switch (item.feed_type) {
    case 'deal':
      return <DealMiniCard item={item.item} requestDealNda={requestDealNda} {...common} />;
    case 'investor_corner':
      return <InvestorCornerMiniCard item={item.item} handleInvestorCornerAction={handleInvestorCornerAction} {...common} />;
    case 'search_capital':
      return <SearchCapitalCard item={item.item} requestSearchCapitalPpm={requestPpm} {...common} />;
    case 'job':
      return <JobMiniCard item={item.item} applied={engagement?.isPlayed ?? false} openJobApply={openJobApply} {...common} />;
    case 'event':
      return <EventActivityCard item={item.item} submitRsvp={submitRsvp} {...common} />;
    case 'poll':
      return <PollActivityCard item={item.item} onVote={submitPollVote} {...common} />;
    case 'atc':
      return <AtcActivityCard item={item.item} comments={engagement?.comments ?? []} {...common} />;
    case 'find_a_connection':
    default:
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
          PillIcon={Link2}
          pillLabel="Post"
          title={(item.item as { post_title?: string }).post_title || 'Post'}
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
            nativeAction: null,
          })}
        >
          {!!(item.item as { post_description?: string }).post_description && (
            <MiniCardDescription text={(item.item as { post_description?: string }).post_description || ''} />
          )}
        </MiniCardShell>
      );
  }
}
