/** Set true for the duration of `SocialSignIn`'s `handleLinkedInSignIn` (`authShared.tsx`) —
 * lets `RootNavigator`'s deep-link `subscribe` tell Android's own automatic redelivery of the
 * same `tsb://linkedin-callback` URL (this app's `MainActivity` is `singleTask`, so the OS
 * forwards that intent to the running activity the moment the Custom Tab redirects, independent
 * of anything the button's own code does) apart from a genuine cold-start/fallback deep link, and
 * skip auto-navigating to `LinkedInCallbackScreen` for the former — the button's own inline
 * spinner already covers that wait, so pushing that full screen on top of Login for the redundant
 * delivery was a visible flash with nothing left for it to do. */
let inFlight = false;

export function isLinkedInSignInInFlight() {
  return inFlight;
}

export function setLinkedInSignInInFlight(value: boolean) {
  inFlight = value;
}
