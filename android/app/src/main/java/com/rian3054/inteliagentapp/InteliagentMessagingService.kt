package com.rian3054.inteliagentapp

import android.content.Intent
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.ExpoFirebaseMessagingService

/** Keep Expo push taps intact after Android reclaims a background process.
 * FCM's auto-rendered intent can lose extras when a singleTask record survives.
 * Use Expo's notification builder and forwarder instead, including in that state.
 * See https://github.com/expo/expo/issues/49254
 */
class InteliagentMessagingService : ExpoFirebaseMessagingService() {
  override fun handleIntent(intent: Intent?) {
    val extras = intent?.extras
    if (extras != null && (extras.containsKey("scopeKey") || extras.containsKey("experienceId"))) {
      val notificationKeys = extras.keySet().filter {
        it.startsWith("gcm.n.") || it.startsWith("gcm.notification.")
      }
      if (notificationKeys.isNotEmpty()) {
        // Delegate directly to Expo instead of FCM's automatic tray renderer.
        // Keep notification fields intact: SDK 58 skips foreground JS handlers
        // for data-only messages, even when they contain a title and message.
        super.onMessageReceived(RemoteMessage(extras))
        return
      }
    }
    super.handleIntent(intent)
  }
}
