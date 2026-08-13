---
description: Bootstrap a fresh macOS-native RN project for TSB, then bring in the real app source
argument-hint: [git-branch] (defaults to main)
---

# Setup TSB iOS project (macOS)

Goal: this repo's `ios/`/`android/` native folders were generated on Linux and have never actually
been built. Rather than debug that cross-platform, create a brand-new React Native project fresh
**on this Mac** (so Xcode/CocoaPods generate native scaffolding that's known-correct for this
machine), confirm it boots on the Simulator, then pull over the real app's `src/` and supporting
config from the actual repo — keeping the freshly-generated native files instead of the repo's own.

Branch to pull `src/` from: `$1` (default to `main` if not given — ask the user to confirm which
branch if `main` doesn't exist on the remote, don't guess silently).

Run each phase in order. Stop and report back to the user if any step fails rather than pushing
through — in particular, don't attempt to fix CocoaPods/Xcode toolchain problems by installing or
changing system-level tooling (Ruby version, Xcode version, etc.) without telling the user first,
since that can affect other projects on this machine.

## Phase 0 — Preflight checks

Verify before doing anything: `node -v`, `npm -v`, `xcodebuild -version`, `pod --version` (or
`gem list cocoapods`), `watchman -v` (optional but common for RN). If any required tool is
missing, tell the user exactly what to install and stop — don't attempt sudo installs yourself.

## Phase 1 — Create the empty project

In a location the user confirms (ask if not obvious — e.g. `~/Developer/` or wherever they keep
projects), run:

```bash
npx react-native@latest init TSB --version 0.83.1
```

("TSB" / display name "The Search Bridge" matches this repo's `package.json`/`app.json` exactly —
keeping the name identical avoids native bundle-id/scheme mismatches later when the real source
drops in.)

## Phase 2 — Verify the empty project actually runs

```bash
cd TSB
npx react-native run-ios
```

Confirm the default RN welcome screen boots in the Simulator. **This is the actual toolchain sanity
check** — if this doesn't work, nothing past this point will either, so stop here and report the
exact error to the user rather than continuing.

## Phase 3 — Connect the real repo as a remote

Still inside the new `TSB/` project (which already has its own fresh git init from
`react-native init`):

```bash
git remote add tsb-source https://github.com/sumerpalgit/tsbmobile.git
git fetch tsb-source
```

Named `tsb-source` rather than `origin` deliberately — this project's own `origin` (if any) stays
whatever `react-native init` or the user's own remote setup gives it; `tsb-source` is purely where
the real app code gets pulled from, not a remote to push this scaffolding project back to.

Confirm the branch exists before checking anything out:

```bash
git branch -r | grep tsb-source
```

If `tsb-source/$1` (or `tsb-source/main`) isn't in that list, stop and ask the user which branch
they actually want.

## Phase 4 — Pull over the real source + supporting config

Bring over the app code itself and everything it needs to actually build — **not** the native
`ios/`/`android/`/`Gemfile`/`Podfile` (those stay the ones freshly generated in Phase 1, which are
now confirmed working):

```bash
git checkout tsb-source/$1 -- src App.tsx index.js app.json babel.config.js metro.config.js react-native.config.js tsconfig.json jest.config.js jest.setup.js .env.example
```

If a real `.env` (not `.env.example`) exists in the source repo and the user wants it too, ask
explicitly before pulling it over — it likely has environment-specific values (API URLs, Supabase
keys) that shouldn't be silently assumed to be the same on this machine.

**Do not** checkout `ios/`, `android/`, `Gemfile`, `Podfile`, or `package.json`/`package-lock.json`
directly over the fresh ones — package.json needs a merge, not an overwrite (next step), and the
native folders are the whole point of doing this fresh.

## Phase 5 — Merge dependencies

The real `src/` imports packages (react-navigation, reanimated, gesture-handler, socket.io-client,
react-native-toast-message, etc.) that a bare `react-native init` won't have installed. Diff the
freshly-generated `package.json`'s `dependencies`/`devDependencies` against
`tsb-source/$1:package.json` (`git show tsb-source/$1:package.json`) and merge the real repo's
dependency list into the new project's `package.json`, keeping the new project's own
`react`/`react-native` version pins unless the real repo's differ (flag it to the user if they do
differ rather than silently picking one).

Then:

```bash
npm install
cd ios && pod install && cd ..
```

## Phase 6 — Run the real app

```bash
npx react-native run-ios
```

If it fails to build, read the actual error before guessing — common first-run issues after a
dependency merge like this are a stale Metro cache (`npx react-native start --reset-cache`) or a
missing native-linking step for a library that needs `pod install` to have picked up (re-run
`pod install` after confirming `package.json` actually changed before this point).

## When done

Report back: whether each phase succeeded, the exact branch pulled from, and any file the user
should sanity-check manually (especially `.env` — this command deliberately does not create or
guess one).
