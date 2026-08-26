import Toast from 'react-native-toast-message';
import type { FeedItem } from '../api/feed';
import type { InvestorCornerItem } from '../types/home';

/** Primary-press dispatch per `feed_type`, shared between Home feed and My Activity (both render
 * `PostCard` and need the identical routing) — matches web's `useFeedActions.ts` call sites
 * exactly. `event`'s primary press ("View Details") and `atc`/`find_a_connection` have no
 * confirmed backend endpoint in this app (event RSVP is its own separate `onRsvp` callback, not
 * this button), so those fall through to a "coming soon" toast rather than a guessed call. */
export function dispatchFeedPrimaryPress(
  item: FeedItem,
  actions: {
    requestDealNda: (args: { dealId: string; feedId: string }) => void;
    requestPpm: (args: { searchCapitalId: string; feedId: string }) => void;
    handleInvestorCornerAction: (args: { item: InvestorCornerItem; investorCornerId: string; feedId: string }) => void;
  },
  openJobApply: (jobId: string, screeningQuestions: string[]) => void,
) {
  switch (item.feed_type) {
    case 'job':
      openJobApply(item.item_id, item.item.screening_questions ?? []);
      return;
    case 'deal':
      actions.requestDealNda({ dealId: item.item_id, feedId: item.id });
      return;
    case 'search_capital':
      actions.requestPpm({ searchCapitalId: item.item_id, feedId: item.id });
      return;
    case 'investor_corner':
      actions.handleInvestorCornerAction({ item: item.item, investorCornerId: item.item_id, feedId: item.id });
      return;
    default:
      Toast.show({ type: 'info', text1: 'Coming soon' });
  }
}
