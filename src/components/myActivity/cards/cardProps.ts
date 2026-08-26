import type { ReactNode } from 'react';
import type { FeedProfile } from '../../../api/feed';
import type { ActivityTab } from '../../../api/myActivity';

/** Props every per-type mini-card shares, supplied by `ActivityMiniCard.tsx`'s dispatcher —
 * header/footer/CTA-precedence concerns common to all 7 types, so each type-specific file only
 * needs to describe its own navy-band (pill/title/chips) and body content. */
export type MiniCardCommonProps = {
  feedId: string;
  itemId: string;
  profile: FeedProfile;
  createdAt: string;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  /** True once the user has already sent this item's NDA/PPM/investor-corner request — mirrors
   * web's own `interacted={!!engagement?.isPlayed}` (see `BackSearcherMiniCard.tsx` etc.). Used to
   * seed the CTA button's initial state so it shows "already done" instead of re-offering an
   * action the backend will reject as a duplicate. */
  interacted: boolean;
  onLike: () => void;
  onComment: () => void;
  activeTab: ActivityTab;
  isOwner: boolean;
  totalRequestCount: number;
  onViewRequests: () => void;
  onViewRequest: () => void;
  statusBarSlot?: ReactNode;
  onHide: () => void;
  onDeleted: () => void;
};
