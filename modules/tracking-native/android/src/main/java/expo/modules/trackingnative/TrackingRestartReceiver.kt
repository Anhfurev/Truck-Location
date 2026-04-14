package expo.modules.trackingnative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class TrackingRestartReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (!TrackingPersistence.isTrackingEnabled(context)) {
            return
        }

        PersistentTrackingService.start(
            context,
            TrackingPersistence.getNotificationTitle(context),
            TrackingPersistence.getNotificationBody(context),
        )
    }
}