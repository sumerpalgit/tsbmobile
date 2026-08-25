/** Imperative handle every built role tab (Intermediary/Searcher/Investor/Lender/Advisor) exposes
 * via `forwardRef` so `ViewProfileScreen.tsx`'s pull-to-refresh — attached to the OUTER shared
 * scroll view, not owned by any individual tab — can trigger that tab's own refetch. Each role tab
 * keeps its `thesis`/`completion`/`similar` state internally, so the parent has no other way to ask
 * "go get fresh data" without this. Lives in its own file (not `ViewProfileRoleThesisTab.tsx`, the
 * dispatcher that renders every role tab) purely to avoid a circular import — each role tab needs
 * this type, and the dispatcher imports every role tab. */
export type RoleThesisTabHandle = {
  refresh: () => Promise<void>;
};
