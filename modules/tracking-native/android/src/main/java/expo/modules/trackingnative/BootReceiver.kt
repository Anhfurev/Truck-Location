package expo.modules.trackingnative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Listens for device boot events and relaunches the app if the driver had
 * location tracking active before the reboot.
 *
 * Tracking state is persisted to SharedPreferences by TrackingNativeModule
 * (via the JS setTrackingEnabled call) so it is readable here without needing
 * the full React Native / Expo JS runtime to have started yet.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val PREFS_NAME = "trucklocation_tracking"
        private const val KEY_TRACKING_ENABLED = "tracking_enabled"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return

        // Handle standard boot + fast-boot variants used by some OEMs.
        val isBootAction = action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON"

        if (!isBootAction) return

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val trackingEnabled = prefs.getBoolean(KEY_TRACKING_ENABLED, false)

        if (!trackingEnabled) return

        // Relaunch the main activity. The existing auto-restore logic in
        // useLocationTracking will read AsyncStorage, see tracking_enabled=true,
        // and restart the foreground service automatically.
        val launchIntent = context.packageManager
            .getLaunchIntentForPackage(context.packageName)
            ?: return

        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        context.startActivity(launchIntent)
    }
}
