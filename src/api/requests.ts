import { apiClient } from './client';
import {
  CIM_ENDPOINTS,
  DEAL_ENDPOINTS,
  JOB_ENDPOINTS,
  MY_ACTIVITY_ENDPOINTS,
  NDA_ENDPOINTS,
  PPM_ENDPOINTS,
} from './endpoints';
import type { InvestorCornerItem } from '../types/home';

/** Idempotent-submit endpoints (RSVP/deal-NDA/PPM-request/Investor-Corner action) all treat HTTP
 * `409` (already requested) as a success, not an error — matches `webSrc/hooks/useFeedActions.ts`
 * exactly (`res.ok || res.status === 409`). Axios throws on non-2xx by default, so this catches
 * that one specific status and swallows it instead of rejecting. */
async function postIdempotent(path: string, body: unknown) {
  try {
    return await apiClient.post(path, body).then(res => res.data);
  } catch (err: any) {
    if (err?.response?.status === 409) return err.response.data;
    throw err;
  }
}

/** `POST /feed/deal/request-nda` body `{deal_id, feed_id, requester_note, document_type}` —
 * matches `useFeedActions.ts`'s `requestDealNda`. */
export function requestDealNda(dealId: string, feedId: string, note?: string) {
  return postIdempotent(DEAL_ENDPOINTS.REQUEST_NDA, {
    deal_id: dealId,
    feed_id: feedId,
    requester_note: note,
    document_type: 'nda',
  });
}

/** `POST /feed/ppm/request-ppm` body `{search_capital_id, feed_id, requester_note}` — matches
 * `useFeedActions.ts`'s `requestSearchCapitalPpm`. */
export function requestSearchCapitalPpm(searchCapitalId: string, feedId: string, note?: string) {
  return postIdempotent(PPM_ENDPOINTS.REQUEST, {
    search_capital_id: searchCapitalId,
    feed_id: feedId,
    requester_note: note,
  });
}

/** `POST /feed/ppm/request-ppm` body `{ppm_id, message, ppm_file_url}` — matches
 * `useFeedActions.ts`'s `submitPpmRequest`. A distinct, required-fields flow from
 * `requestSearchCapitalPpm` above (web's own `PpmRequestModal`); kept for parity even though no
 * current mobile `feed_type` routes a primary-press into it (mobile has no generic/"other business
 * post" fallback type the way web's `FeedItemCard` does). */
export function submitPpmRequest(ppmId: string, message: string, ppmFileUrl: string) {
  return apiClient
    .post(PPM_ENDPOINTS.REQUEST, { ppm_id: ppmId, message, ppm_file_url: ppmFileUrl })
    .then(res => res.data);
}

/** Investor Corner's single combined action button — routes to a PPM or NDA request depending on
 * `scenario_type`, matching `useFeedActions.ts`'s `handleInvestorCornerAction` exactly (including
 * that its `requestNda`/`requestPpm` opts are accepted on web but never actually used — the branch
 * is scenario_type-only, so this function doesn't take them either). */
export function handleInvestorCornerAction(item: InvestorCornerItem, investorCornerId: string, feedId: string, note?: string) {
  if (item.scenario_type === 'Back a Searcher') {
    return postIdempotent(PPM_ENDPOINTS.REQUEST, {
      investor_corner_id: investorCornerId,
      feed_id: feedId,
      requester_note: note,
    });
  }
  return postIdempotent(DEAL_ENDPOINTS.REQUEST_NDA, {
    investor_corner_id: investorCornerId,
    feed_id: feedId,
    requester_note: note,
    document_type: 'nda',
  });
}

/** `POST /feed/job/apply` body `{job_id, resume_file_url, cover_letter, screening_answers}` —
 * matches `useFeedActions.ts`'s `submitJobApplication`. `resumeUrl` is the already-uploaded file
 * URL (via `uploadDocument` from `src/api/profile.ts`, `fileType: 'resume'`), not a raw file. */
export function submitJobApplication(
  jobId: string,
  resumeUrl: string,
  coverLetter: string,
  screeningAnswers: string[] = [],
) {
  return apiClient
    .post(JOB_ENDPOINTS.APPLY, {
      job_id: jobId,
      resume_file_url: resumeUrl,
      cover_letter: coverLetter,
      screening_answers: screeningAnswers,
    })
    .then(res => res.data);
}

/** `PUT /feed/nda/send` body `{requestId, ndaUrl}` — matches `webSrc/actions/my-activity.ts`'s
 * `submitSendNda`. Post owner sending an NDA out to a requester. */
export function submitSendNda(requestId: string, ndaUrl: string) {
  return apiClient.put(NDA_ENDPOINTS.SEND, { requestId, ndaUrl }).then(res => res.data);
}

/** `PUT /feed/cim/send` body `{requestId, cimUrl}` — matches `submitSendCim`. */
export function submitSendCim(requestId: string, cimUrl: string) {
  return apiClient.put(CIM_ENDPOINTS.SEND, { requestId, cimUrl }).then(res => res.data);
}

/** `PUT /feed/nda/sign` or `/feed/ppm/sign` body `{requestId, signedNdaUrl}` — matches
 * `submitMyActivitySignedNda`. Requester signing and returning a received NDA/PPM. */
export function submitSignedNda(requestId: string, signedNdaUrl: string, interactionType: 'nda_request' | 'ppm_request') {
  const path = interactionType === 'nda_request' ? NDA_ENDPOINTS.SIGN : PPM_ENDPOINTS.SIGN;
  return apiClient.put(path, { requestId, signedNdaUrl }).then(res => res.data);
}

/** `PUT /feed/nda/withdraw` or `/feed/ppm/withdraw` body `{requestId}` — matches
 * `submitWithdrawRequest`. Requester withdrawing their own pending/sent request. */
export function submitWithdrawRequest(requestId: string, type: 'nda' | 'ppm') {
  const path = type === 'nda' ? NDA_ENDPOINTS.WITHDRAW : PPM_ENDPOINTS.WITHDRAW;
  return apiClient.put(path, { requestId }).then(res => res.data);
}

/** `PUT /feed/nda/decline` or `/feed/ppm/decline` body `{requestId}` — matches
 * `submitDeclineRequest`. Post owner declining an incoming request. */
export function submitDeclineRequest(requestId: string, type: 'nda' | 'ppm') {
  const path = type === 'nda' ? NDA_ENDPOINTS.DECLINE : PPM_ENDPOINTS.DECLINE;
  return apiClient.put(path, { requestId }).then(res => res.data);
}

/** `DELETE /my-activity/job-application/:id` — matches `submitWithdrawJobApplication`. Applicant
 * withdrawing their own job application. */
export function submitWithdrawJobApplication(applicationId: string) {
  return apiClient.delete(`${MY_ACTIVITY_ENDPOINTS.JOB_APPLICATION}/${applicationId}`).then(res => res.data);
}

/** `PATCH /my-activity/job-application/:id/status` body `{status}` — matches
 * `submitUpdateJobApplicationStatus`. Employer/post-owner advancing an applicant's pipeline stage. */
export function submitUpdateJobApplicationStatus(
  applicationId: string,
  status: 'shortlisted' | 'interview_scheduled' | 'rejected' | 'offered',
) {
  return apiClient
    .patch(`${MY_ACTIVITY_ENDPOINTS.JOB_APPLICATION}/${applicationId}/status`, { status })
    .then(res => res.data);
}
