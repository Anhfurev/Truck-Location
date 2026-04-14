package expo.modules.trackingnative

import android.content.Context

object TrackingPersistence {
    private const val PREFS_NAME = "trucklocation_tracking"
    private const val KEY_TRACKING_ENABLED = "tracking_enabled"
    private const val KEY_NOTIFICATION_TITLE = "notification_title"
    private const val KEY_NOTIFICATION_BODY = "notification_body"

    fun isTrackingEnabled(context: Context): Boolean {
        return context
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getBoolean(KEY_TRACKING_ENABLED, false)
    }

    fun setTrackingEnabled(context: Context, enabled: Boolean) {
        context
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_TRACKING_ENABLED, enabled)
            .apply()
    }

    fun persistNotification(context: Context, title: String?, body: String?) {
        context
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_NOTIFICATION_TITLE, title)
            .putString(KEY_NOTIFICATION_BODY, body)
            .apply()
    }

    fun getNotificationTitle(context: Context): String {
        return context
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(KEY_NOTIFICATION_TITLE, "Truck Location идэвхтэй байна")
            ?: "Truck Location идэвхтэй байна"
    }

    fun getNotificationBody(context: Context): String {
        return context
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(KEY_NOTIFICATION_BODY, "Систем таны байршлыг тасралтгүй хянаж байна.")
            ?: "Систем таны байршлыг тасралтгүй хянаж байна."
    }
}
