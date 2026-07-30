package com.tsb

import android.os.Build
import android.os.Bundle
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "TSB"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    // Must run before super.onCreate() — installs the Theme.App.Starting
    // splash (styles.xml) and hands off to AppTheme (postSplashScreenTheme)
    // once the activity is ready, per the androidx.core.splashscreen contract.
    installSplashScreen()
    super.onCreate(savedInstanceState)
    // RN's edge-to-edge setup (WindowUtil.enableEdgeToEdge, run inside the
    // super.onCreate() above) leaves isNavigationBarContrastEnforced = true —
    // unlike the status bar, which it explicitly turns off. That flag makes
    // the OS paint its own translucent scrim behind the nav bar regardless of
    // what colour our screens draw there, which is the "always white" strip
    // at the bottom. Match the status bar's behaviour so the transparent nav
    // bar shows our own background straight through.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      window.isNavigationBarContrastEnforced = false
    }
  }
}
