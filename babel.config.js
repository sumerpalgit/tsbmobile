module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
      },
    ],
    // Reanimated 4 ships its Babel plugin inside react-native-worklets.
    // It must stay last in the plugin list.
    'react-native-worklets/plugin',
  ],
};
