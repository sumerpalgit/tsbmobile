module.exports = {
  preset: 'react-native',
  // webSrc is the website's source, kept for reference only.
  testPathIgnorePatterns: ['/node_modules/', '/webSrc/'],
  setupFiles: ['./jest.setup.js'],
  // Reanimated 4 reaches for native code at import time. This resolver (shipped
  // by react-native-worklets) drops the `.native` variants so the JS ones load.
  resolver: './node_modules/react-native-worklets/jest/resolver.js',
  // These packages ship untranspiled ESM and must go through Babel.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-gesture-handler|react-native-reanimated|react-native-worklets|react-native-screens|react-native-safe-area-context|react-native-svg|react-native-drawer-layout|use-latest-callback|@react-native-async-storage)/)',
  ],
};
