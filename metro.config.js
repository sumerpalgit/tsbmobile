const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // `socket.io-client`'s `engine.io-client` dependency ships a dual ESM/CJS package with a
    // `package.json` "exports" map that correctly resolves the RN/browser-safe polling
    // transport — but Metro ignores "exports" by default and falls back to naive relative
    // resolution, which walks straight into `polling-fetch.js`'s broken `./polling.js` import
    // (a file that only exists under the ESM build, not the path Metro guesses). Enabling this
    // makes Metro respect "exports" properly, the documented fix for this exact, well-known
    // socket.io-client + Metro incompatibility.
    unstable_enablePackageExports: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
