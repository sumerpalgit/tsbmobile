import React from 'react';
import { ViewMyRequestButton, ViewRequestsButton, YourPostPill } from './RequestCtaButtons';
import type { ActivityTab } from '../../../api/myActivity';

/** The footer CTA precedence every mini-card shares, factored out once instead of repeated 7
 * times — matches web's own per-card branch order exactly (`onViewRequests` → `onViewRequest` →
 * `isOwner` "Your post" pill → the card's own native action button). `showOwnerPill=false`
 * replicates `JobOperatorMiniCard`'s one real exception (no owner-pill branch at all, confirmed
 * in the research — job cards must pass their own `hideCta` upstream instead). */
export function resolveCardCta({
  activeTab,
  isOwner,
  totalRequestCount,
  onViewRequests,
  onViewRequest,
  nativeAction,
  showOwnerPill = true,
  ownerLabel,
}: {
  activeTab: ActivityTab;
  isOwner: boolean;
  totalRequestCount: number;
  onViewRequests: () => void;
  onViewRequest: () => void;
  nativeAction: React.ReactNode;
  showOwnerPill?: boolean;
  /** Overrides the default "Your post" copy — `EventMiniCard` uses "Your event" here, matching
   * web's own per-type wording exactly. */
  ownerLabel?: string;
}): React.ReactNode {
  if (activeTab === 'my-posts') return <ViewRequestsButton count={totalRequestCount} onPress={onViewRequests} />;
  if (activeTab === 'interacted-posts') return <ViewMyRequestButton onPress={onViewRequest} />;
  if (isOwner && showOwnerPill) return <YourPostPill label={ownerLabel} />;
  return nativeAction;
}
