import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {
  deletePollVote as deletePollVoteApi,
  editComment as editCommentApi,
  postComment as postCommentApi,
  submitPollVote as submitPollVoteApi,
  toggleLike as toggleLikeApi,
} from '../api/engagement';
import { toggleSave as toggleSaveApi } from '../api/saves';
import { submitEventRsvp } from '../api/events';
import {
  handleInvestorCornerAction as handleInvestorCornerActionApi,
  requestDealNda as requestDealNdaApi,
  requestSearchCapitalPpm as requestSearchCapitalPpmApi,
  submitDeclineRequest as submitDeclineRequestApi,
  submitJobApplication as submitJobApplicationApi,
  submitSendCim as submitSendCimApi,
  submitSendNda as submitSendNdaApi,
  submitSignedNda as submitSignedNdaApi,
  submitUpdateJobApplicationStatus as submitUpdateJobApplicationStatusApi,
  submitWithdrawJobApplication as submitWithdrawJobApplicationApi,
  submitWithdrawRequest as submitWithdrawRequestApi,
} from '../api/requests';
import { HOME_FEED_QUERY_KEY, MY_ACTIVITY_QUERY_KEY } from '../api/queryKeys';
import type { InvestorCornerItem } from '../types/home';

/** Surfaces the backend's own error text (e.g. a Postgrest "JSON object requested, multiple (or
 * no) rows returned" — a real, reported backend bug, not something this app can fix) instead of
 * hiding it behind a generic "Failed to..." toast. Same pattern already used in
 * `ViewProfileOverviewTab.tsx`/`CreateDualProfileWizard.tsx`. */
function extractErrorMessage(err: unknown): string | undefined {
  if (!axios.isAxiosError(err)) return undefined;
  return err.response?.data?.error ?? err.response?.data?.message;
}

/** Every feed-post write action — like/save/comment/vote/RSVP/apply/request-NDA/request-PPM
 * (Home feed + My Activity's read-side, Phase 0/1) plus the request-management writes My
 * Activity's Received/Sent screens need later (Phase 2/3: send/sign/withdraw/decline NDA, send
 * CIM, withdraw/advance a job application). One shared hook, `useMutation` + invalidate-on-success
 * + `Toast.show` on error throughout — same convention `useEventMutations.ts` established, not
 * web's raw-fetch-plus-manual-state-splicing (`webSrc/hooks/useFeedActions.ts`) — same resulting
 * behavior, mobile's own established implementation style (see the plan's Decision 8/10).
 *
 * Every mutation invalidates both `HOME_FEED_QUERY_KEY` and `MY_ACTIVITY_QUERY_KEY` on success —
 * a like/save/comment/vote/request made from Home feed can change what My Activity's tabs show
 * (and vice versa, once Phase 1's screen can trigger these too), so both caches refetch together
 * rather than one screen showing stale state until the other happens to remount.
 */
export function useFeedActions() {
  const queryClient = useQueryClient();
  const invalidateFeed = () => {
    queryClient.invalidateQueries({ queryKey: HOME_FEED_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: MY_ACTIVITY_QUERY_KEY });
  };

  const likeMutation = useMutation({
    mutationFn: toggleLikeApi,
    onSuccess: invalidateFeed,
    onError: err => Toast.show({ type: 'error', text1: 'Failed to update like', text2: extractErrorMessage(err) }),
  });

  const saveMutation = useMutation({
    mutationFn: ({ feedId }: { feedId: string; wasSaved: boolean }) => toggleSaveApi(feedId),
    onSuccess: (_data, { wasSaved }) => {
      Toast.show({ type: 'success', text1: wasSaved ? 'Removed from saved' : 'Saved' });
      invalidateFeed();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to update bookmark' }),
  });

  const commentMutation = useMutation({
    mutationFn: ({ feedId, content }: { feedId: string; content: string }) => postCommentApi(feedId, content),
    onSuccess: invalidateFeed,
    onError: () => Toast.show({ type: 'error', text1: 'Failed to post comment' }),
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => editCommentApi(commentId, content),
    onSuccess: invalidateFeed,
    onError: () => Toast.show({ type: 'error', text1: 'Failed to update comment' }),
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionIndex }: { pollId: string; optionIndex: number; feedId: string }) =>
      submitPollVoteApi(pollId, optionIndex),
    onSuccess: invalidateFeed,
    onError: () => Toast.show({ type: 'error', text1: 'Failed to submit vote' }),
  });

  const deleteVoteMutation = useMutation({
    mutationFn: ({ pollId }: { pollId: string; feedId: string }) => deletePollVoteApi(pollId),
    onSuccess: invalidateFeed,
    onError: () => Toast.show({ type: 'error', text1: 'Failed to remove vote' }),
  });

  const rsvpMutation = useMutation({
    mutationFn: (eventId: string) => submitEventRsvp(eventId),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: "You're registered ✓" });
      invalidateFeed();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to RSVP', text2: 'Please try again.' }),
  });

  const requestDealNdaMutation = useMutation({
    mutationFn: ({ dealId, feedId, note }: { dealId: string; feedId: string; note?: string }) =>
      requestDealNdaApi(dealId, feedId, note),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'NDA request sent' });
      invalidateFeed();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to request NDA' }),
  });

  const requestPpmMutation = useMutation({
    mutationFn: ({ searchCapitalId, feedId, note }: { searchCapitalId: string; feedId: string; note?: string }) =>
      requestSearchCapitalPpmApi(searchCapitalId, feedId, note),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'PPM request sent' });
      invalidateFeed();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to request PPM' }),
  });

  const investorCornerMutation = useMutation({
    mutationFn: ({
      item,
      investorCornerId,
      feedId,
      note,
    }: {
      item: InvestorCornerItem;
      investorCornerId: string;
      feedId: string;
      note?: string;
    }) => handleInvestorCornerActionApi(item, investorCornerId, feedId, note),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Request sent' });
      invalidateFeed();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to send request' }),
  });

  const jobApplyMutation = useMutation({
    mutationFn: ({
      jobId,
      resumeUrl,
      coverLetter,
      screeningAnswers,
    }: {
      jobId: string;
      resumeUrl: string;
      coverLetter: string;
      screeningAnswers?: string[];
    }) => submitJobApplicationApi(jobId, resumeUrl, coverLetter, screeningAnswers),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Application submitted ✓' });
      invalidateFeed();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to submit application', text2: 'Please try again.' }),
  });

  // Phase 2/3 request-management writes — wrapped now so Phase 2/3 only need to build UI.
  const sendNdaMutation = useMutation({
    mutationFn: ({ requestId, ndaUrl }: { requestId: string; ndaUrl: string }) => submitSendNdaApi(requestId, ndaUrl),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'NDA sent' });
      invalidateFeed();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to send NDA' }),
  });

  const sendCimMutation = useMutation({
    mutationFn: ({ requestId, cimUrl }: { requestId: string; cimUrl: string }) => submitSendCimApi(requestId, cimUrl),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'CIM sent' });
      invalidateFeed();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to send CIM' }),
  });

  const signNdaMutation = useMutation({
    mutationFn: ({
      requestId,
      signedNdaUrl,
      interactionType,
    }: {
      requestId: string;
      signedNdaUrl: string;
      interactionType: 'nda_request' | 'ppm_request';
    }) => submitSignedNdaApi(requestId, signedNdaUrl, interactionType),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Signed NDA submitted ✓' });
      invalidateFeed();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to submit signed NDA', text2: 'Please try again.' }),
  });

  const withdrawRequestMutation = useMutation({
    mutationFn: ({ requestId, type }: { requestId: string; type: 'nda' | 'ppm' }) =>
      submitWithdrawRequestApi(requestId, type),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Request withdrawn' });
      invalidateFeed();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to withdraw request' }),
  });

  const declineRequestMutation = useMutation({
    mutationFn: ({ requestId, type }: { requestId: string; type: 'nda' | 'ppm' }) =>
      submitDeclineRequestApi(requestId, type),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Request declined' });
      invalidateFeed();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to decline request' }),
  });

  const withdrawJobApplicationMutation = useMutation({
    mutationFn: submitWithdrawJobApplicationApi,
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Application withdrawn' });
      invalidateFeed();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to withdraw application' }),
  });

  const updateJobApplicationStatusMutation = useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: 'shortlisted' | 'interview_scheduled' | 'rejected' | 'offered';
    }) => submitUpdateJobApplicationStatusApi(applicationId, status),
    onSuccess: invalidateFeed,
    onError: () => Toast.show({ type: 'error', text1: 'Failed to update application status' }),
  });

  return {
    toggleLike: likeMutation.mutate,
    toggleSave: saveMutation.mutate,
    postComment: commentMutation.mutate,
    isPostingComment: commentMutation.isPending,
    editComment: editCommentMutation.mutate,
    isEditingComment: editCommentMutation.isPending,
    submitPollVote: voteMutation.mutate,
    deletePollVote: deleteVoteMutation.mutate,
    submitRsvp: rsvpMutation.mutate,
    isSubmittingRsvp: rsvpMutation.isPending,
    requestDealNda: requestDealNdaMutation.mutate,
    requestPpm: requestPpmMutation.mutate,
    handleInvestorCornerAction: investorCornerMutation.mutate,
    // Async variants — My Activity's mini-cards (`ActivityMiniCard.tsx`) await these for real
    // loading/done button state, unlike Home feed's fire-and-forget `dispatchFeedPrimaryPress`
    // above, which only needs the sync `mutate` versions.
    submitRsvpAsync: rsvpMutation.mutateAsync,
    requestDealNdaAsync: requestDealNdaMutation.mutateAsync,
    requestPpmAsync: requestPpmMutation.mutateAsync,
    handleInvestorCornerActionAsync: investorCornerMutation.mutateAsync,
    submitJobApplication: jobApplyMutation.mutateAsync,
    isSubmittingJobApplication: jobApplyMutation.isPending,
    sendNda: sendNdaMutation.mutate,
    sendNdaAsync: sendNdaMutation.mutateAsync,
    isSendingNda: sendNdaMutation.isPending,
    sendCim: sendCimMutation.mutate,
    sendCimAsync: sendCimMutation.mutateAsync,
    isSendingCim: sendCimMutation.isPending,
    signNda: signNdaMutation.mutateAsync,
    isSigningNda: signNdaMutation.isPending,
    withdrawRequest: withdrawRequestMutation.mutateAsync,
    isWithdrawingRequest: withdrawRequestMutation.isPending,
    declineRequest: declineRequestMutation.mutateAsync,
    isDecliningRequest: declineRequestMutation.isPending,
    withdrawJobApplication: withdrawJobApplicationMutation.mutateAsync,
    isWithdrawingJobApplication: withdrawJobApplicationMutation.isPending,
    updateJobApplicationStatus: updateJobApplicationStatusMutation.mutateAsync,
    isUpdatingJobApplicationStatus: updateJobApplicationStatusMutation.isPending,
  };
}
