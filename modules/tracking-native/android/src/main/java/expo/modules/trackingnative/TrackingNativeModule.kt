package expo.modules.trackingnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Exposes a single JS-callable function: setTrackingEnabled(boolean).
 *
 * This writes to a dedicated SharedPreferences file so that BootReceiver can
 * check the state after a reboot without requiring the JS runtime to start.
 */
class TrackingNativeModule : Module() {

    override fun definition() = ModuleDefinition {
        Name("TrackingNative")

        AsyncFunction("setTrackingEnabled") { enabled: Boolean ->
            val context = appContext.reactContext
                ?: throw Exception("React context is not available")

            TrackingPersistence.setTrackingEnabled(context, enabled)
        }

        AsyncFunction("startPersistentService") { notificationTitle: String?, notificationBody: String? ->
            val context = appContext.reactContext
                ?: throw Exception("React context is not available")

            TrackingPersistence.persistNotification(context, notificationTitle, notificationBody)
            PersistentTrackingService.start(context, notificationTitle, notificationBody)
        }

        AsyncFunction("stopPersistentService") {
            val context = appContext.reactContext
                ?: throw Exception("React context is not available")

            PersistentTrackingService.stop(context)
        }
    }
}
