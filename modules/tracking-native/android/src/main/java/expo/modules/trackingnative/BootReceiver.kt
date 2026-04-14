package expo.modules.trackingnative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.UserManager

/**
 * Listens for device boot events and relaunches the app if the driver had
 * location tracking active before the reboot.
 *
 * Tracking state is persisted to SharedPreferences by TrackingNativeModule
 * (via the JS setTrackingEnabled call) so it is readable here without needing
 * the full React Native / Expo JS runtime to have started yet.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return

        // Handle standard boot + fast-boot variants used by some OEMs.
        val isBootAction = action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_LOCKED_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON"
        val isUnlockAction = action == Intent.ACTION_USER_UNLOCKED

        if (!isBootAction && !isUnlockAction) return

        if (!TrackingPersistence.isTrackingEnabled(context)) return

        // Keep an Android foreground service alive as soon as we can.
        PersistentTrackingService.start(
            context,
            TrackingPersistence.getNotificationTitle(context),
            TrackingPersistence.getNotificationBody(context),
        )

        // JS/runtime restore is most reliable after first user unlock.
        // On many Android versions non-system apps cannot fully start background
        // workloads until device unlock, so we trigger app restore only when
        // the device is actually unlocked.
        val userManager = context.getSystemService(UserManager::class.java)
        val isUserUnlocked = userManager?.isUserUnlocked ?: true
        if (!isUnlockAction && !isUserUnlocked) return

        val launchIntent = context.packageManager
            .getLaunchIntentForPackage(context.packageName)
            ?: return

        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        context.startActivity(launchIntent)
    }
}
