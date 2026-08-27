import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme';
import type { FeedEngagement, FeedItem } from '../../../api/feed';
import { PostCardHeader } from './PostCardHeader';
import { PostCardBody } from './PostCardBody';
import { PostCardActions } from './PostCardActions';
import { PostCardFooter } from './PostCardFooter';
import { PostCardQuickProfile, QuickProfileContent } from './PostCardQuickProfile';
import { getFindAConnectionQuickProfile } from './bodies/FindAConnectionBody';
import { EventFooter, getEventQuickProfile } from './bodies/EventBody';
import { getJobQuickProfile } from './bodies/JobBody';
import { getInvestorCornerQuickProfile } from './bodies/InvestorCornerBody';
import { getAtcQuickProfile } from './bodies/AtcBody';
import { getDealQuickProfile, isRaisingCapital } from './bodies/DealBody';
import { getSearchCapitalQuickProfile } from './bodies/SearchCapitalBody';
import { IconName } from '../../icons/Icon';

/**
 * One feed post, any role. Composes `PostCardHeader` (avatar/name/meta/quick-profile/save) around
 * `PostCardBody` (the dispatcher that varies per `feed_type`) — `event` used to skip this header
 * entirely (a mobile-mockup-only deviation, "no avatar anywhere on the card"), but web's real
 * `EventCard.tsx` always renders its own `FeedCardHeader` above the event content just like every
 * other type, so this now does too. `event`'s footer is still its own bespoke two-button row
 * (`EventFooter` — "View more"/"View less" + RSVP/"Event passed") rather than the shared
 * secondary-outline/primary-gold `PostCardFooter` shape, since web's own `EventCard` footer is
 * genuinely different from every other type's.
 *
 * Tapping the quick-profile button slides `PostCardQuickProfile` over the whole card, matching
 * the mockup's `apRows`/`apChips` overlay — every type has content now except `poll` (no overlay
 * concept for it structurally), which stays a no-op.
 *
 * Outer shell (`border-radius:18px`, `border:1px solid var(--line)`, shadow) copied exactly from
 * `TSB Home FV.html`'s card examples.
 */
export function PostCard({
  feedItem,
  engagement,
  onLike,
  onSave,
  onComment,
  onShare,
  onVote,
  onPrimaryPress,
  onSecondaryPress,
  onRsvp,
}: {
  feedItem: FeedItem;
  engagement: FeedEngagement | undefined;
  onLike?: () => void;
  onSave?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onVote?: (optionIndex: number) => void;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  onRsvp?: () => void;
}) {
  const { colors, borderWidth, elevation } = useTheme();
  const [quickProfileOpen, setQuickProfileOpen] = useState(false);
  // Matches web's `EventCard`'s own `expanded` state (`useState` local to that card) exactly —
  // its single "View more"/"View less" toggle drives BOTH the event description's full-text
  // reveal AND the "Schedule & Access" block (start/end/timezone/format/event link/visibility) +
  // audience-role chips, not two independent toggles. Lifted here (not local to `EventBody`/
  // `EventFooter`) since the toggle button lives in the footer but the content it reveals lives
  // in the body — two separate components that need to share one boolean.
  const [eventExpanded, setEventExpanded] = useState(false);
  const isEvent = feedItem.feed_type === 'event';
  const footer = getFooter(feedItem);
  const quickProfileContent = getQuickProfileContent(feedItem);
  const onQuickProfile = quickProfileContent ? () => setQuickProfileOpen(true) : undefined;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.feedCardLine, borderWidth: borderWidth.thin },
        elevation('sm'),
      ]}
    >
      <PostCardHeader
        profile={feedItem.profile}
        createdAt={feedItem.created_at}
        isAnonymous={feedItem.is_anonymous}
        saved={engagement?.saved}
        onSave={onSave}
        onQuickProfile={onQuickProfile}
      />

      <PostCardBody feedItem={feedItem} onVote={onVote} eventExpanded={eventExpanded} />

      {hasActions(feedItem) && (
        <PostCardActions engagement={engagement} onLike={onLike} onComment={onComment} onShare={onShare} />
      )}

      {isEvent && (
        <EventFooter
          item={feedItem.item}
          isOwnEvent={feedItem.is_my_feed}
          expanded={eventExpanded}
          onToggleExpanded={() => setEventExpanded(prev => !prev)}
          onRsvp={onRsvp}
        />
      )}

      {!isEvent && footer && (
        <PostCardFooter
          primaryLabel={footer.primaryLabel}
          primaryIcon={footer.primaryIcon}
          secondaryLabel={footer.secondaryLabel}
          onPrimaryPress={onPrimaryPress}
          onSecondaryPress={onSecondaryPress}
        />
      )}

      {quickProfileOpen && quickProfileContent && (
        <PostCardQuickProfile
          profile={feedItem.profile}
          isAnonymous={feedItem.is_anonymous}
          content={quickProfileContent}
          onClose={() => setQuickProfileOpen(false)}
        />
      )}
    </View>
  );
}

/** Poll has no actions row at all (matches the mockup exactly) — every other built type does. */
function hasActions(feedItem: FeedItem): boolean {
  return feedItem.feed_type !== 'poll';
}

/** Footer label/icon (and whether there's a secondary "Details" button alongside the primary
 * one) are genuinely per-type — confirmed against the mockup for `atc` (single full-width
 * "Answer"), `find_a_connection`/`job`/`search_capital` ("Details" + primary), and
 * `investor_corner` (primary label varies by `scenario_type`). `deal` has no confirmed CTA copy
 * (no live sample or screenshot yet) — reasonable but flagged guess, not verified. `event`
 * returns `null` here since `EventBody` renders its own bespoke footer directly. */
function getFooter(
  feedItem: FeedItem,
): { primaryLabel: string; primaryIcon: IconName; secondaryLabel?: string } | null {
  switch (feedItem.feed_type) {
    case 'atc':
      return { primaryLabel: 'Answer', primaryIcon: 'comment' };
    case 'find_a_connection':
      return { primaryLabel: 'Express Interest', primaryIcon: 'downloadTray', secondaryLabel: 'View Details' };
    case 'job':
      return { primaryLabel: 'Apply Now', primaryIcon: 'arrowRight', secondaryLabel: 'Details' };
    case 'investor_corner':
      return {
        primaryLabel: feedItem.item.scenario_type === 'Back a Searcher' ? 'Express Interest' : 'Pitch Your Deal',
        primaryIcon: 'downloadTray',
        secondaryLabel: 'Details',
      };
    case 'deal':
      return {
        primaryLabel: isRaisingCapital(feedItem.item) ? 'Request Memo' : 'Request CIM',
        primaryIcon: 'arrowRight',
        secondaryLabel: 'Details',
      };
    case 'search_capital':
      return { primaryLabel: 'Back this Searcher', primaryIcon: 'starOutline', secondaryLabel: 'Details' };
    default:
      return null;
  }
}

/** Quick-profile overlay content is genuinely per-type too — `find_a_connection`'s rows are
 * confirmed against a real rendered screenshot, `event`'s are best-effort from `EventItem`'s own
 * fields (no equivalent screenshot exists for it — see `getEventQuickProfile`'s doc comment).
 * Every other type returns `null` (button renders but does nothing) rather than showing a
 * guessed/empty panel. */
function getQuickProfileContent(feedItem: FeedItem): QuickProfileContent | null {
  if (feedItem.feed_type === 'find_a_connection') {
    return getFindAConnectionQuickProfile(feedItem.item);
  }
  if (feedItem.feed_type === 'event') {
    return getEventQuickProfile(feedItem.item);
  }
  if (feedItem.feed_type === 'job') {
    return getJobQuickProfile(feedItem.item);
  }
  if (feedItem.feed_type === 'investor_corner') {
    return getInvestorCornerQuickProfile(feedItem.item);
  }
  if (feedItem.feed_type === 'atc') {
    return getAtcQuickProfile(feedItem.item);
  }
  if (feedItem.feed_type === 'search_capital') {
    return getSearchCapitalQuickProfile(feedItem.item);
  }
  if (feedItem.feed_type === 'deal') {
    return getDealQuickProfile(feedItem.item);
  }
  return null;
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 18,
    padding: 15,
    gap: 11,
    overflow: 'hidden',
  },
});
