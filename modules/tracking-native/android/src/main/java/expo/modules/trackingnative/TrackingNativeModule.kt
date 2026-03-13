package expo.modules.trackingnative

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Exposes a single JS-callable function: setTrackingEnabled(boolean).
 *
 * This writes to a dedicated SharedPreferences file so that BootReceiver can
 * check the state after a reboot without requiring the JS runtime to start.
 */
class TrackingNativeModule : Module() {

    companion object {
        private const val PREFS_NAME = "trucklocation_tracking"
        private const val KEY_TRACKING_ENABLED = "tracking_enabled"
    }

    override fun definition() = ModuleDefinition {
        Name("TrackingNative")

        AsyncFunction("setTrackingEnabled") { enabled: Boolean ->
            val context = appContext.reactContext
                ?: throw Exception("React context is not available")

            context
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_TRACKING_ENABLED, enabled)
                .apply()
        }
    }
}
