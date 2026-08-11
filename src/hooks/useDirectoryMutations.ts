import { useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { removeSavedContact, saveContact } from '../api/directory';
import type { Profile } from '../types/directory';

/** Save/unsave a directory member — optimistic with rollback on failure, matching
 * `useMessageMutations.ts`'s conventions. `savedUsernames`/`savedProfiles` are owned by
 * `useDirectory.ts` (seeded from `fetchSavedContacts` on mount) rather than a react-query cache —
 * there's no shared cache key anything else in the app reads, so a plain optimistic toggle here is
 * simpler than wrapping this in `useMutation` for no real benefit. Takes the full `Profile` (not
 * just a username) so the independent "Saved members" list (`savedProfiles`) can be optimistically
 * updated too, not just the is-saved lookup set. */
export function useDirectoryMutations(
  savedUsernames: Set<string>,
  setSavedUsernames: React.Dispatch<React.SetStateAction<Set<string>>>,
  setSavedProfiles: React.Dispatch<React.SetStateAction<Profile[]>>,
) {
  const toggleSave = useCallback(
    async (profile: Profile) => {
      const username = profile.username;
      const wasSaved = savedUsernames.has(username);
      setSavedUsernames(prev => {
        const next = new Set(prev);
        if (wasSaved) next.delete(username);
        else next.add(username);
        return next;
      });
      setSavedProfiles(prev => (wasSaved ? prev.filter(p => p.username !== username) : [profile, ...prev]));
      try {
        if (wasSaved) await removeSavedContact(username);
        else await saveContact(username);
      } catch {
        setSavedUsernames(prev => {
          const next = new Set(prev);
          if (wasSaved) next.add(username);
          else next.delete(username);
          return next;
        });
        setSavedProfiles(prev => (wasSaved ? [profile, ...prev] : prev.filter(p => p.username !== username)));
        Toast.show({ type: 'error', text1: 'Could not update saved members', text2: 'Please try again.' });
      }
    },
    [savedUsernames, setSavedUsernames, setSavedProfiles],
  );

  return { toggleSave };
}
