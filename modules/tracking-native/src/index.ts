import { Platform } from "react-native";

type TrackingNativeModuleType = {
  setTrackingEnabled(enabled: boolean): Promise<void>;
  startPersistentService(
    notificationTitle?: string,
    notificationBody?: string,
  ): Promise<void>;
  stopPersistentService(): Promise<void>;
};

let _native: TrackingNativeModuleType | null = null;

if (Platform.OS === "android") {
  try {
    // requireNativeModule is available when built with EAS / expo prebuild.
    // Falls back silently in Expo Go or on web.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireNativeModule } = require("expo-modules-core");
    _native = requireNativeModule("TrackingNative") as TrackingNativeModuleType;
  } catch {
    // Non-fatal – boot-restore will not work but app tracking still functions.
  }
}

/**
 * Mirrors the tracking-enabled flag to Android SharedPreferences so that
 * BootReceiver can read it after a device reboot without needing the full
 * JS runtime to initialise first.
 *
 * No-op on iOS, web, or when running in Expo Go.
 */
export async function setNativeTrackingEnabled(
  enabled: boolean,
): Promise<void> {
  if (_native) {
    await _native.setTrackingEnabled(enabled);
  }
}

export async function startNativePersistentService(
  notificationTitle?: string,
  notificationBody?: string,
): Promise<void> {
  if (_native) {
    await _native.startPersistentService(notificationTitle, notificationBody);
  }
}

export async function stopNativePersistentService(): Promise<void> {
  if (_native) {
    await _native.stopPersistentService();
  }
}
