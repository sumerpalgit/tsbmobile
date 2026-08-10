/** In-memory, per-chapter session tracker for the Community Guidelines gate — the mobile
 * equivalent of web's `sessionStorage["tsb_cg_session_{groupId}"]`: resets on app cold start
 * (not `AsyncStorage`, which would wrongly persist acceptance across launches). */
const acceptedThisSession = new Set<string>();

export function hasAcceptedGuidelines(chapterId: string): boolean {
  return acceptedThisSession.has(chapterId);
}

export function markGuidelinesAccepted(chapterId: string): void {
  acceptedThisSession.add(chapterId);
}
