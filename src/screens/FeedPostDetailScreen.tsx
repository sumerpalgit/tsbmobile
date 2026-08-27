import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { PostCard } from '../components/home/PostCard';
import { FeedSkeleton } from '../components/home/FeedSkeleton';
import { CommentComposerSheet } from '../components/home/CommentComposerSheet';
import { JobApplyFormSheet } from '../components/home/JobApplyFormSheet';
import { RsvpModal, formatRsvpEventDate } from '../components/home/RsvpModal';
import { useFeedItemDetail } from '../hooks/useFeedItemDetail';
import { useFeedActions } from '../hooks/useFeedActions';
import { dispatchFeedPrimaryPress } from '../utils/feedPrimaryAction';
import type { FeedItem } from '../api/feed';
import type { EventItem } from '../types/home';
import type { AppStackParamList } from '../navigation/types';

/**
 * Feed Post Detail — Phase 3 of the Notifications plan (`delightful-seeking-snowglobe.md`), the
 * last of its 4 real notification destinations. Matches web's `/dashboard/feed/[feedId]/page.tsx`
 * (`SingleFeedPage`): the tapped post rendered exactly like a Home feed card, plus a "related
 * posts of the same type" section beneath it (web's own `loadRelatedFeeds` — first page of the
 * general feed, filtered client-side to the same `feed_type`; there's no dedicated "related"
 * endpoint on either side). Reuses the exact same `PostCard`/`useFeedActions`/
 * `dispatchFeedPrimaryPress` Home already built rather than a second card-rendering
 * implementation — same reasoning as `EventDetailScreen` reusing `EventDetailView`. Web's page has
 * no own-post edit/delete affordance at all (only the list-page's mini-card menu has that, a
 * different card component entirely), so neither does this — not a scope gap, matching web.
 */
function FeedPostDetailScreen() {
  const { colors, fonts, fontSize } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'FeedPostDetail'>>();
  const { feedId } = route.params;

  const { item, engagement, relatedItems, relatedEngagements, isLoading, isError } = useFeedItemDetail(feedId);
  const feedActions = useFeedActions();
  const [commentTargetId, setCommentTargetId] = useState<string | null>(null);
  const [jobApplyTarget, setJobApplyTarget] = useState<{ jobId: string; screeningQuestions: string[] } | null>(null);
  const [rsvpTarget, setRsvpTarget] = useState<{ eventId: string; item: EventItem } | null>(null);

  const handlePrimaryPress = (target: FeedItem) =>
    dispatchFeedPrimaryPress(target, feedActions, (jobId, screeningQuestions) =>
      setJobApplyTarget({ jobId, screeningQuestions }),
    );

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Post" onBack={() => navigation.goBack()} />

      {item ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <PostCard
            feedItem={item}
            engagement={engagement}
            onLike={() => feedActions.toggleLike(item.id)}
            onSave={() => feedActions.toggleSave({ feedId: item.id, wasSaved: !!engagement?.saved })}
            onComment={() => setCommentTargetId(item.id)}
            onVote={optionIndex => feedActions.submitPollVote({ pollId: item.item_id, optionIndex, feedId: item.id })}
            onPrimaryPress={() => handlePrimaryPress(item)}
            onRsvp={() => setRsvpTarget({ eventId: item.item_id, item: item.item as EventItem })}
          />

          {relatedItems.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={[fonts.bold, styles.relatedLabel, { color: colors.ink3 }]}>MORE LIKE THIS</Text>
              {relatedItems.map(related => (
                <PostCard
                  key={related.id}
                  feedItem={related}
                  engagement={relatedEngagements[related.id]}
                  onLike={() => feedActions.toggleLike(related.id)}
                  onSave={() =>
                    feedActions.toggleSave({ feedId: related.id, wasSaved: !!relatedEngagements[related.id]?.saved })
                  }
                  onComment={() => setCommentTargetId(related.id)}
                  onVote={optionIndex =>
                    feedActions.submitPollVote({ pollId: related.item_id, optionIndex, feedId: related.id })
                  }
                  onPrimaryPress={() => handlePrimaryPress(related)}
                  onRsvp={() => setRsvpTarget({ eventId: related.item_id, item: related.item as EventItem })}
                />
              ))}
            </View>
          )}
        </ScrollView>
      ) : isLoading ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <FeedSkeleton count={1} />
        </ScrollView>
      ) : (
        // Matches `AdCampaignDetailScreen`'s explicit error/not-found text convention.
        <View style={styles.errorWrap}>
          <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2, textAlign: 'center' }]}>
            {isError ? 'Could not load this post.' : 'This post is no longer available.'}
          </Text>
        </View>
      )}

      <CommentComposerSheet
        visible={commentTargetId !== null}
        onClose={() => setCommentTargetId(null)}
        submitting={feedActions.isPostingComment}
        onSubmit={content => {
          if (!commentTargetId) return;
          feedActions.postComment({ feedId: commentTargetId, content });
          setCommentTargetId(null);
        }}
      />

      <JobApplyFormSheet
        visible={jobApplyTarget !== null}
        jobId={jobApplyTarget?.jobId ?? null}
        screeningQuestions={jobApplyTarget?.screeningQuestions ?? []}
        onClose={() => setJobApplyTarget(null)}
        submitting={feedActions.isSubmittingJobApplication}
        onSubmit={async args => {
          try {
            await feedActions.submitJobApplication(args);
            setJobApplyTarget(null);
          } catch {
            // Toast already shown by the mutation's onError — keep the sheet open to retry.
          }
        }}
      />

      <RsvpModal
        visible={rsvpTarget !== null}
        eventName={rsvpTarget?.item.title}
        eventDate={rsvpTarget ? formatRsvpEventDate(rsvpTarget.item) : undefined}
        eventLocation={rsvpTarget?.item.location ?? undefined}
        onClose={() => setRsvpTarget(null)}
        onSubmit={async (response, _guests, _note) => {
          if (!rsvpTarget) return;
          await feedActions.submitRsvpAsync(rsvpTarget.eventId, response);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 16,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  relatedSection: {
    gap: 16,
  },
  relatedLabel: {
    fontSize: 10.5,
    letterSpacing: 0.6,
  },
});

export default FeedPostDetailScreen;
