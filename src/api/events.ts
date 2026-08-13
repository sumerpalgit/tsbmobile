import { apiClient } from './client';
import { EVENT_ENDPOINTS, MY_ACTIVITY_ENDPOINTS, UPLOAD_ENDPOINTS } from './endpoints';
import type { EventFormPayload, MyEventItem, MyEventsFilterListResponse } from '../types/events';
import type { PickedFile } from '../components/FileUploadButton';

/** Matches webSrc's `fetchAllData`/`fetchEvents` (`my-events/page.tsx`): `GET
 * /api/event/filter-list` → `{ allEvents, userRsvpEvents, userCreatedEvents }`. The single call
 * that backs all three of My Events' Upcoming/Past/Created bookkeeping — there is no pagination
 * on this endpoint, unlike the Home feed's `/api/feed`. */
export async function fetchMyEvents(): Promise<MyEventsFilterListResponse> {
  const data = await apiClient.get(EVENT_ENDPOINTS.FILTER_LIST).then(res => res.data);
  return {
    allEvents: Array.isArray(data?.allEvents) ? data.allEvents : [],
    userRsvpEvents: Array.isArray(data?.userRsvpEvents) ? data.userRsvpEvents : [],
    userCreatedEvents: Array.isArray(data?.userCreatedEvents) ? data.userCreatedEvents : [],
  };
}

/** Mirrors web's `mapSavedEvents`: filters `GET /api/my-activity/saved-posts` down to
 * `feed_type === 'event'` entries and flattens each `{id, item, profile, created_at}` envelope
 * into the same flat `MyEventItem` shape `fetchMyEvents` returns, so both feed the same list UI. */
export async function fetchSavedEvents(page: number, limit: number): Promise<MyEventItem[]> {
  const result = await apiClient
    .get(MY_ACTIVITY_ENDPOINTS.SAVED_POSTS, { params: { page, limit } })
    .then(res => res.data);

  const rows = Array.isArray(result?.data) ? result.data : [];
  return rows
    .filter((f: any) => f?.feed_type === 'event' && f?.item)
    .map(
      (f: any): MyEventItem => ({
        id: f.item.id,
        title: f.item.title ?? null,
        event_description: f.item.event_description ?? null,
        location: f.item.location ?? null,
        format: f.item.format ?? null,
        start_date: f.item.start_date ?? null,
        end_date: f.item.end_date ?? null,
        start_time: f.item.start_time ?? null,
        end_time: f.item.end_time ?? null,
        hosted_by: f.item.hosted_by ?? null,
        cover_image: f.item.cover_image ?? null,
        event_link: f.item.event_link ?? null,
        visibility: f.item.visibility ?? null,
        event_type: f.item.event_type ?? null,
        timezone: f.item.timezone ?? null,
        rsvp_required: f.item.rsvp_required ?? null,
        matchmaking_enabled: f.item.matchmaking_enabled,
        audience_roles: f.item.audience_roles,
        feed_id: f.id ?? null,
        feed_owner: f.profile?.id ?? null,
        feed_created_at: f.created_at ?? null,
      }),
    );
}

/** `POST /api/feed/event/rsvp` body `{event_id}` — matches web's `submitEventRsvp`. */
export function submitEventRsvp(eventId: string) {
  return apiClient.post(EVENT_ENDPOINTS.RSVP, { event_id: eventId }).then(res => res.data);
}

/** `DELETE /api/my-activity/event-rsvp/:eventId` — matches web's fixed `cancelEventRsvp`
 * (`MY_ACTIVITY_ENDPOINTS.EVENT_RSVP`'s doc comment has the full root-cause writeup: the old
 * `DELETE ${EVENT_ENDPOINTS.RSVP}` address only ever had a POST handler, so cancelling always
 * 404'd there). Event ID goes in the URL path now, no request body. */
export function cancelEventRsvp(eventId: string) {
  return apiClient.delete(`${MY_ACTIVITY_ENDPOINTS.EVENT_RSVP}/${eventId}`).then(res => res.data);
}

/** Matches web's `handleAddEvent` POST body exactly, plus `event_audience_roles` (see
 * `src/types/events.ts`'s `EventFormPayload` doc comment for why). */
export function createEvent(payload: EventFormPayload) {
  return apiClient.post(EVENT_ENDPOINTS.CREATE, payload).then(res => res.data);
}

/** Matches web's `handleAddEvent` PUT body (`isEdit` branch) — `PUT /api/feed/event/:id`. */
export function updateEvent(id: string, payload: EventFormPayload) {
  return apiClient.put(`${EVENT_ENDPOINTS.CREATE}/${id}`, payload).then(res => res.data);
}

export type UploadImageResponse = {
  imageUrl: string;
};

/** Matches web's cover-image upload in `handleAddEvent`: `POST /api/upload/image-upload`,
 * multipart (`image` + `category`), returns `{ imageUrl }`. Same multipart pattern as
 * `profile.ts`'s `uploadDocument`, just pointed at a different endpoint/field names. */
export function uploadEventCoverImage(file: PickedFile) {
  const form = new FormData();
  form.append('image', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'image/jpeg',
  } as unknown as Blob);
  form.append('category', 'events');

  return apiClient
    .post<UploadImageResponse>(UPLOAD_ENDPOINTS.IMAGE_UPLOAD, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(res => res.data);
}
