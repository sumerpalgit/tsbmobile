module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Reanimated 4 ships its Babel plugin inside react-native-worklets.
  // It must stay last in the plugin list.
  plugins: ['react-native-worklets/plugin'],
};
