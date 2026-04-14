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
    if (!app.service) {
      app.service = [];
    }
    if (!app.receiver) {
      app.receiver = [];
    }

    const SERVICE_CLASS =
      "expo.modules.trackingnative.PersistentTrackingService";
    let service = app.service.find((s) => s.$?.["android:name"] === SERVICE_CLASS);
    if (!service) {
      service = { $: { "android:name": SERVICE_CLASS } };
      app.service.push(service);
    }
    service.$ = {
      ...(service.$ ?? {}),
      "android:name": SERVICE_CLASS,
      "android:enabled": "true",
      "android:exported": "false",
      "android:foregroundServiceType": "location",
      "android:stopWithTask": "false",
    };

    const RECEIVER_CLASS = "expo.modules.trackingnative.BootReceiver";
    let bootReceiver = app.receiver.find(
      (r) => r.$?.["android:name"] === RECEIVER_CLASS,
    );
    if (!bootReceiver) {
      bootReceiver = { $: { "android:name": RECEIVER_CLASS } };
      app.receiver.push(bootReceiver);
    }

    bootReceiver.$ = {
      ...(bootReceiver.$ ?? {}),
      "android:name": RECEIVER_CLASS,
      "android:enabled": "true",
      "android:exported": "true",
      "android:directBootAware": "true",
    };

    if (!bootReceiver["intent-filter"]) {
      bootReceiver["intent-filter"] = [{ action: [] }];
    }
    if (!Array.isArray(bootReceiver["intent-filter"])) {
      bootReceiver["intent-filter"] = [bootReceiver["intent-filter"]];
    }
    if (!bootReceiver["intent-filter"][0]) {
      bootReceiver["intent-filter"][0] = { action: [] };
    }
    if (!bootReceiver["intent-filter"][0].action) {
      bootReceiver["intent-filter"][0].action = [];
    }

    const actions = bootReceiver["intent-filter"][0].action;
    const requiredActions = [
      "android.intent.action.BOOT_COMPLETED",
      "android.intent.action.LOCKED_BOOT_COMPLETED",
      "android.intent.action.USER_UNLOCKED",
      "android.intent.action.QUICKBOOT_POWERON",
      "com.htc.intent.action.QUICKBOOT_POWERON",
    ];
    for (const actionName of requiredActions) {
      if (!actions.some((a) => a.$?.["android:name"] === actionName)) {
        actions.push({ $: { "android:name": actionName } });
      }
    }

    const RESTART_RECEIVER_CLASS =
      "expo.modules.trackingnative.TrackingRestartReceiver";
    let restartReceiver = app.receiver.find(
      (r) => r.$?.["android:name"] === RESTART_RECEIVER_CLASS,
    );
    if (!restartReceiver) {
      restartReceiver = { $: { "android:name": RESTART_RECEIVER_CLASS } };
      app.receiver.push(restartReceiver);
    }
    restartReceiver.$ = {
      ...(restartReceiver.$ ?? {}),
      "android:name": RESTART_RECEIVER_CLASS,
      "android:enabled": "true",
      "android:exported": "false",
    };

    return cfg;
  });
}

module.exports = withBootReceiver;
