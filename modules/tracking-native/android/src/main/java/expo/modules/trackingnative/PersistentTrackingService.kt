package expo.modules.trackingnative

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.IBinder
import android.os.SystemClock

class PersistentTrackingService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }

            ACTION_START, ACTION_UPDATE, null -> {
                val notificationTitle = intent?.getStringExtra(EXTRA_NOTIFICATION_TITLE)
                val notificationBody = intent?.getStringExtra(EXTRA_NOTIFICATION_BODY)

                if (!notificationTitle.isNullOrBlank() || !notificationBody.isNullOrBlank()) {
                    TrackingPersistence.persistNotification(this, notificationTitle, notificationBody)
                }

                startForeground(NOTIFICATION_ID, buildNotification())
                return START_STICKY
            }

            else -> {
                startForeground(NOTIFICATION_ID, buildNotification())
                return START_STICKY
            }
        }
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        if (TrackingPersistence.isTrackingEnabled(this)) {
            scheduleRestart()
        }
        super.onTaskRemoved(rootIntent)
    }

    override fun onDestroy() {
        if (TrackingPersistence.isTrackingEnabled(this)) {
            scheduleRestart()
        }
        super.onDestroy()
    }

    private fun buildNotification(): Notification {
        createNotificationChannel()
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
        }

        val pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT or
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0

        val contentIntent = launchIntent?.let {
            PendingIntent.getActivity(this, 0, it, pendingIntentFlags)
        }

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            Notification.Builder(this)
        }

        builder
            .setContentTitle(TrackingPersistence.getNotificationTitle(this))
            .setContentText(TrackingPersistence.getNotificationBody(this))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(Notification.CATEGORY_SERVICE)
            .setSmallIcon(applicationInfo.icon)
            .setColor(Color.parseColor(NOTIFICATION_COLOR))
            .setColorized(true)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE)
        } else {
            @Suppress("DEPRECATION")
            builder.setPriority(Notification.PRIORITY_HIGH)
        }

        contentIntent?.let {
            builder.setContentIntent(it)
        }

        return builder.build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            ?: return

        val existingChannel = notificationManager.getNotificationChannel(CHANNEL_ID)
        if (existingChannel != null) {
            return
        }

        val channel = NotificationChannel(
            CHANNEL_ID,
            "Truck Location Tracking",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Keeps driver tracking alive on Android"
            setShowBadge(false)
        }

        notificationManager.createNotificationChannel(channel)
    }

    private fun scheduleRestart() {
        val alarmManager = getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val restartIntent = Intent(this, TrackingRestartReceiver::class.java).apply {
            action = ACTION_RESTART
        }

        val pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT or
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0

        val restartPendingIntent = PendingIntent.getBroadcast(
            this,
            RESTART_REQUEST_CODE,
            restartIntent,
            pendingIntentFlags,
        )

        alarmManager.set(
            AlarmManager.ELAPSED_REALTIME,
            SystemClock.elapsedRealtime() + RESTART_DELAY_MS,
            restartPendingIntent,
        )
    }

    companion object {
        private const val CHANNEL_ID = "trucklocation:persistent-tracking-v2"
        private const val NOTIFICATION_ID = 42017
        private const val RESTART_REQUEST_CODE = 42018
        private const val RESTART_DELAY_MS = 1500L
        private const val NOTIFICATION_COLOR = "#2563eb"

        const val ACTION_START = "expo.modules.trackingnative.action.START"
        const val ACTION_STOP = "expo.modules.trackingnative.action.STOP"
        const val ACTION_UPDATE = "expo.modules.trackingnative.action.UPDATE"
        const val ACTION_RESTART = "expo.modules.trackingnative.action.RESTART"
        const val EXTRA_NOTIFICATION_TITLE = "notificationTitle"
        const val EXTRA_NOTIFICATION_BODY = "notificationBody"

        fun start(context: Context, notificationTitle: String?, notificationBody: String?) {
            val intent = Intent(context, PersistentTrackingService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_NOTIFICATION_TITLE, notificationTitle)
                putExtra(EXTRA_NOTIFICATION_BODY, notificationBody)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, PersistentTrackingService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}
