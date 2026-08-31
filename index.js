/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

/**
 * Background/quit-state push handler.
 *
 * This MUST be registered outside the React tree — the library requires it at module scope so it
 * can run in a headless JS context when the app isn't mounted. Registering it inside App.tsx
 * produces a runtime warning and background messages are dropped.
 *
 * Beyond logging, the body is intentionally empty: for a `notification` payload Android's system
 * tray renders it itself, and the tap is picked up by
 * `onNotificationOpenedApp`/`getInitialNotification` in `src/services/push/handlers.ts`.
 *
 * The log fires for BOTH "app backgrounded" and "app killed" delivery — Android runs this same
 * headless handler in both cases, so it is the proof that the message physically reached the
 * device even when nothing is on screen. `[PUSH]` matches the prefix used in `constants.ts`
 * (hardcoded here rather than imported: this module loads before the app's own module graph, and
 * pulling in src/ from index.js just for a string risks a require cycle at startup).
 */
setBackgroundMessageHandler(getMessaging(), async message => {
  console.log(
    '[PUSH] RECEIVED [background/killed] — delivered while app was not in foreground',
    JSON.stringify({
      messageId: message?.messageId,
      title: message?.notification?.title,
      body: message?.notification?.body,
      data: message?.data,
    }),
  );
});

AppRegistry.registerComponent(appName, () => App);
