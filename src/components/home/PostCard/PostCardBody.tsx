import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';
import type { FeedItem } from '../../../api/feed';
import { FEED_TYPE_META, PostCardBadge } from './PostCardBadge';
import { AtcBody } from './bodies/AtcBody';
import { PollBody } from './bodies/PollBody';
import { FindAConnectionBody } from './bodies/FindAConnectionBody';
import { JobBody } from './bodies/JobBody';
import { InvestorCornerBody } from './bodies/InvestorCornerBody';
import { EventBody } from './bodies/EventBody';
import { DealBody } from './bodies/DealBody';
import { SearchCapitalBody } from './bodies/SearchCapitalBody';

/**
 * The one part of a `PostCard` that actually differs per role — dispatches to the body variant
 * matching `feed_type`, a registry lookup instead of a growing if/else chain, so adding a type
 * later is just one new import + one new switch case.
 *
 * All 8 types are built now. Event-specific props (`profile`/`isAnonymous`/`createdAt`/save/
 * quick-profile/primary-press/RSVP callbacks) are only ever read by `EventBody` — every other
 * body ignores them since their header/footer come from the shared `PostCardHeader`/
 * `PostCardFooter` instead.
 */
export function PostCardBody({
  feedItem,
  onVote,
  saved,
  onSave,
  onQuickProfile,
  onPrimaryPress,
  onRsvp,
}: {
  feedItem: FeedItem;
  onVote?: (optionIndex: number) => void;
  saved?: boolean;
  onSave?: () => void;
  onQuickProfile?: () => void;
  onPrimaryPress?: () => void;
  onRsvp?: () => void;
}) {
  switch (feedItem.feed_type) {
    case 'atc':
      return <AtcBody item={feedItem.item} />;
    case 'poll':
      return <PollBody item={feedItem.item} onVote={onVote} />;
    case 'find_a_connection':
      return <FindAConnectionBody item={feedItem.item} />;
    case 'job':
      return <JobBody item={feedItem.item} />;
    case 'investor_corner':
      return <InvestorCornerBody item={feedItem.item} />;
    case 'deal':
      return <DealBody item={feedItem.item} />;
    case 'search_capital':
      return <SearchCapitalBody item={feedItem.item} />;
    case 'event':
      return (
        <EventBody
          item={feedItem.item}
          profile={feedItem.profile}
          isAnonymous={feedItem.is_anonymous}
          createdAt={feedItem.created_at}
          saved={saved}
          onSave={onSave}
          onQuickProfile={onQuickProfile}
          onPrimaryPress={onPrimaryPress}
          onRsvp={onRsvp}
        />
      );
    default:
      // Unreachable per the type (`feedItem` is `never` here — all 8 known `feed_type`s are
      // handled above), kept as a runtime guard: the backend could add a 9th type before this
      // app updates to know about it, and that's a real possibility TS's static union can't
      // represent.
      return <ComingSoonBody feedType={(feedItem as FeedItem).feed_type} />;
  }
}

function ComingSoonBody({ feedType }: { feedType: FeedItem['feed_type'] }) {
  const { colors, fonts, fontSize } = useTheme();
  const meta = FEED_TYPE_META[feedType];

  return (
    <View style={styles.comingSoon}>
      {meta && <PostCardBadge label={meta.label} icon={meta.icon} />}
      <Text style={[fonts.regular, { fontSize: fontSize.body, color: colors.ink3, fontStyle: 'italic' }]}>
        {meta?.label ?? 'This'} card is coming soon.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  comingSoon: {
    gap: 11,
  },
});
