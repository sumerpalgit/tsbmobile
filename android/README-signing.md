# Release signing

Release builds are signed with `android/app/tsb-release-key.keystore`, configured via
`android/keystore.properties` (both gitignored — this is the app's permanent upload
identity, not a build artifact).

**Back up both files somewhere safe** (password manager, secure company storage). If either
is lost, there is no recovery — you can never publish an update under the same signature
again; distributing the app would mean starting over as a new listing.

## Building a release APK

```sh
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

For an Android App Bundle (Play Store upload format) instead:

```sh
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## Setting this up on a new machine / fresh checkout

Neither `tsb-release-key.keystore` nor `keystore.properties` travels with the repo
(intentionally — see above). Copy both from wherever they're backed up into:

- `android/app/tsb-release-key.keystore`
- `android/keystore.properties`

`keystore.properties` format:

```properties
MYAPP_RELEASE_STORE_FILE=tsb-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=tsb-release-key
MYAPP_RELEASE_STORE_PASSWORD=<store password>
MYAPP_RELEASE_KEY_PASSWORD=<key password — same as store password; this keystore is PKCS12, which doesn't support separate store/key passwords>
```

Without these two files present, `assembleRelease`/`bundleRelease` still work but fall
back to signing with the debug key (with a build-time warning) — fine for local testing,
**not acceptable for any real distribution** (Play Store rejects debug-signed uploads
outright, and side-loaded APKs would carry an untrusted/well-known signature).
