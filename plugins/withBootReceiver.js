const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Expo config plugin that:
 *  1. Adds the RECEIVE_BOOT_COMPLETED permission to AndroidManifest.xml
 *  2. Registers BootReceiver so the app relaunches after a device reboot
 *     (when tracking was active before the reboot).
 *
 * The BootReceiver reads a SharedPreferences flag written by TrackingNativeModule
 * (called from JS whenever setTrackingEnabled() is invoked) and relaunches the
 * main activity only if tracking was previously enabled by the driver.
 */
function withBootReceiver(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // ── RECEIVE_BOOT_COMPLETED permission ─────────────────────────────────
    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    const BOOT_PERM = "android.permission.RECEIVE_BOOT_COMPLETED";
    const perms = manifest["uses-permission"];
    if (!perms.some((p) => p.$?.["android:name"] === BOOT_PERM)) {
      perms.push({ $: { "android:name": BOOT_PERM } });
    }

    // ── BootReceiver entry in <application> ───────────────────────────────
    if (!manifest.application || manifest.application.length === 0) {
      return cfg;
    }

    const app = manifest.application[0];
    if (!app.receiver) {
      app.receiver = [];
    }

    const RECEIVER_CLASS = "expo.modules.trackingnative.BootReceiver";
    if (!app.receiver.some((r) => r.$?.["android:name"] === RECEIVER_CLASS)) {
      app.receiver.push({
        $: {
          "android:name": RECEIVER_CLASS,
          "android:enabled": "true",
          "android:exported": "true",
        },
        "intent-filter": [
          {
            action: [
              // Standard Android reboot
              { $: { "android:name": "android.intent.action.BOOT_COMPLETED" } },
              // Fast-boot / quick-boot on certain OEM devices (e.g. HTC, Huawei)
              {
                $: {
                  "android:name": "android.intent.action.QUICKBOOT_POWERON",
                },
              },
              {
                $: {
                  "android:name": "com.htc.intent.action.QUICKBOOT_POWERON",
                },
              },
            ],
          },
        ],
      });
    }

    return cfg;
  });
}

module.exports = withBootReceiver;
