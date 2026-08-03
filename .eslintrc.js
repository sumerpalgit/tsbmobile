module.exports = {
  root: true,
  extends: '@react-native',
  // webSrc is the website's source kept for reference while porting screens.
  // It is Next.js code and not part of this app's build.
  ignorePatterns: ['webSrc/'],
  rules: {
    // Every colour and most spacing comes from `useTheme()` at runtime, so it
    // cannot live in a static StyleSheet. Leaving this on would mean a warning
    // on nearly every themed component — a rule that always fires gets ignored.
    // Static values still belong in StyleSheet.create by convention.
    'react-native/no-inline-styles': 'off',
    // React Navigation takes components as props (`header`, `drawerContent`,
    // `tabBarIcon`). Those are render props, not remounting children, so allow
    // them while still catching components genuinely nested in a render body.
    'react/no-unstable-nested-components': ['warn', { allowAsProps: true }],
  },
};
