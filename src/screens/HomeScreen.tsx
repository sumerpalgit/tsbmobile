import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { SearchBar } from '../components';
import { EMPTY_FILTERS, FilterPanel, FilterState, countActiveFilters } from '../components/home/FilterPanel';
import { ProfileCompletionCard } from '../components/home/ProfileCompletionCard';
import { FeedSkeleton } from '../components/home/FeedSkeleton';
import { PostCard } from '../components/home/PostCard';
import { CommentComposerSheet } from '../components/home/CommentComposerSheet';
import { JobApplyFormSheet } from '../components/home/JobApplyFormSheet';
import { RsvpModal, formatRsvpEventDate } from '../components/home/RsvpModal';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { useFeedActions } from '../hooks/useFeedActions';
import { dispatchFeedPrimaryPress } from '../utils/feedPrimaryAction';
import type { FeedItem } from '../api/feed';
import type { EventItem } from '../types/home';
import type { AppStackParamList, DrawerParamList, MainTabParamList } from '../navigation/types';

/** Ignores scroll jitter smaller than this (a stationary thumb still fires tiny deltas) so the
 * bars don't flicker on a near-still list. Only referenced inside the temporarily-disabled
 * `handleScroll` block below — restore that block to bring this back into use. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SCROLL_DIRECTION_THRESHOLD = 12;

/**
 * Home — the real feed screen, matching the app bar/drawer reference (`TSB Home FV.html`)'s
 * Home tab: Search bar, Profile Completion card, then the feed itself. `FlatList` instead of
 * `ScrollView` — the feed is unbounded (paginated, `onEndReached` loads more), so it needs
 * virtualization; the search bar/profile card ride along as `ListHeaderComponent` instead of
 * sitting outside the list, so `contentContainerStyle`'s `gap` still spaces everything evenly.
 *
 * `filters`/`query` flow straight into `useHomeFeed`, which switches to `GET /api/feed/search`
 * once either is active — applying a filter or typing a search term actually changes what
 * renders, not just what's displayed as "active" on the search bar's filter button.
 *
 * `ListEmptyComponent` shows `FeedSkeleton` while `isLoading` (the very first fetch, no cached
 * data yet) — `FlatList` only renders it when `data` is empty, which is exactly that window —
 * so opening the app shows loading placeholders instead of a blank screen. Once real results (or
 * a genuine empty result) land, `isLoading` flips false and the skeleton is gone.
 *
 * Scrolling forward through the feed hides the bottom tab bar and the app bar (`TopBar`, owned
 * by `DrawerNavigator`) for a fuller view of the list; scrolling back toward the top brings both
 * back. Neither bar lives inside this screen, so this reaches them via React Navigation's own
 * `setOptions`/`getParent()` rather than a new shared state mechanism: `navigation.setOptions`
 * targets the bottom tab bar directly (this screen's own navigator), and `getParent()` reaches
 * one level up to `DrawerNavigator` for the header. This is a plain show/hide (no slide
 * animation) — React Navigation doesn't animate `tabBarStyle`/`headerShown` changes smoothly on
 * its own, and building a custom animated tab bar + header for that polish is a lot of
 * additional surface for a first pass.
 */
function HomeScreen() {
  const { colors, spacing, borderWidth } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  // `ViewProfile` lives on `AppStackParamList`, two navigators up from this tab (Tabs → Drawer →
  // AppNavigator) — same "call `useNavigation` a second time with the ancestor's param list, let
  // dispatch bubble up" pattern `AiAssistScreen.tsx`'s `stackNavigation` already established,
  // rather than chaining multiple `getParent()` calls.
  const stackNavigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const { items, engagements, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useHomeFeed(query, filters);
  const feedActions = useFeedActions();
  const [commentTargetId, setCommentTargetId] = useState<string | null>(null);
  const [jobApplyTarget, setJobApplyTarget] = useState<{ jobId: string; screeningQuestions: string[] } | null>(null);
  const [rsvpTarget, setRsvpTarget] = useState<{ eventId: string; item: EventItem } | null>(null);

  const handlePrimaryPress = useCallback(
    (item: FeedItem) =>
      dispatchFeedPrimaryPress(item, feedActions, (jobId, screeningQuestions) =>
        setJobApplyTarget({ jobId, screeningQuestions }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Only referenced inside the temporarily-disabled `handleScroll` block below.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lastScrollY = useRef(0);
  // Distance accumulated in the *current* scroll direction since the last show/hide decision —
  // not a raw frame-to-frame delta. Older/slower Android devices (confirmed: flickers on Android
  // 10, not on Android 13 — same code, just enough CPU headroom to matter) deliver `onScroll`
  // events with uneven, noisy per-frame deltas under load; comparing only two consecutive frames
  // let a single janky frame (or a frame that overshoots then the next one "corrects" back) flip
  // `chromeHidden` back and forth, each flip forcing a real `tabBarStyle`/`headerShown` layout
  // pass — visibly a flicker on hardware too slow to absorb repeated layout passes within a
  // frame. Accumulating distance and resetting the counter on any direction reversal means a
  // single noisy frame just gets discarded instead of counted, so a real flip only happens once
  // the scroll has genuinely moved `SCROLL_DIRECTION_THRESHOLD`px in one direction.
  const scrollDelta = useRef(0);
  const chromeHidden = useRef(false);

  const setChromeHidden = useCallback(
    (hidden: boolean) => {
      chromeHidden.current = hidden;
      navigation.setOptions({
        tabBarStyle: hidden
          ? { display: 'none' }
          : { backgroundColor: colors.surface, borderTopColor: colors.borderSoft, borderTopWidth: borderWidth.thin },
      });
      navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.setOptions({ headerShown: !hidden });
    },
    [navigation, colors.surface, colors.borderSoft, borderWidth.thin],
  );

  // TEMP DISABLED for testing whether the Android 10 scroll flicker is actually caused by this
  // hide-on-scroll feature (the tabBarStyle/headerShown toggling forces a real layout pass) —
  // `handleScroll` is a no-op below so the bars never hide, isolating the variable for a release
  // APK test. Restore the block below (and delete the no-op) once confirmed either way.
  /*
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = e.nativeEvent.contentOffset.y;
      const frameDelta = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      if (currentY <= 0) {
        scrollDelta.current = 0;
        if (chromeHidden.current) setChromeHidden(false);
        return;
      }

      // A frame that moves opposite to the direction accumulated so far is noise (or a genuine
      // direction change) — either way, it shouldn't add toward a flip in the old direction.
      if (frameDelta !== 0 && scrollDelta.current !== 0 && Math.sign(frameDelta) !== Math.sign(scrollDelta.current)) {
        scrollDelta.current = 0;
      }
      scrollDelta.current += frameDelta;

      if (scrollDelta.current > SCROLL_DIRECTION_THRESHOLD && !chromeHidden.current) {
        setChromeHidden(true);
        scrollDelta.current = 0;
      } else if (scrollDelta.current < -SCROLL_DIRECTION_THRESHOLD && chromeHidden.current) {
        setChromeHidden(false);
        scrollDelta.current = 0;
      }
    },
    [setChromeHidden],
  );
  */
  const handleScroll = useCallback((_e: NativeSyntheticEvent<NativeScrollEvent>) => {}, []);

  // Always land back on Home with both bars visible — e.g. after switching tabs mid-scroll,
  // rather than leaving them stuck hidden from a previous visit. Also clears the accumulated
  // direction distance so a stale value from before the tab switch can't skew the first decision
  // after returning.
  useFocusEffect(
    useCallback(() => {
      scrollDelta.current = 0;
      setChromeHidden(false);
    }, [setChromeHidden]),
  );

  return (
    <>
      <FlatList<FeedItem>
        style={{ backgroundColor: colors.pageBg }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.lg }}
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PostCard
            feedItem={item}
            engagement={engagements[item.id]}
            onLike={() => feedActions.toggleLike(item.id)}
            onSave={() => feedActions.toggleSave({ feedId: item.id, wasSaved: !!engagements[item.id]?.saved })}
            onComment={() => setCommentTargetId(item.id)}
            onVote={optionIndex => feedActions.submitPollVote({ pollId: item.item_id, optionIndex, feedId: item.id })}
            onPrimaryPress={() => handlePrimaryPress(item)}
            onRsvp={() => setRsvpTarget({ eventId: item.item_id, item: item.item as EventItem })}
          />
        )}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={isLoading ? <FeedSkeleton /> : null}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: spacing.lg }}>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search posts, members, deals…"
              onFilterPress={() => setFilterPanelOpen(true)}
              filtersActive={countActiveFilters(filters) > 0}
            />
            <ProfileCompletionCard onCompleteProfile={() => stackNavigation.navigate('ViewProfile')} />
          </View>
        }
      />

      <FilterPanel
        visible={filterPanelOpen}
        initialFilters={filters}
        onClose={() => setFilterPanelOpen(false)}
        onApply={next => {
          setFilters(next);
          setFilterPanelOpen(false);
        }}
      />

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
    </>
  );
}

export default HomeScreen;
