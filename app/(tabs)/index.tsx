import { LocationPermissionStep } from "@/components/LocationPermissionStep";
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal";
import { ProfileSetupStep } from "@/components/ProfileSetupStep";
import { TrackingControlDrawer } from "@/components/TrackingControlDrawer";
import { TrackingMap } from "@/components/TrackingMap";
import { useDriverProfile } from "@/hooks/use-driver-profile";
import { useLocationTracking } from "@/hooks/use-location-tracking";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { Navigation, UserCircle2 } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  AppState,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 12 : 0,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerIcon: {
    width: 34,
    height: 34,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextWrap: {
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18,
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    lineHeight: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  mainContent: {
    flex: 1,
  },
});

type OnboardingStep = "location" | "profile" | "map";

const IS_EXPO_GO = Constants.executionEnvironment === "storeClient";
const BATTERY_SETTINGS_ACTIONS = [
  // Standard Android flows.
  "android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
  "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS",
  // OEM-specific fallbacks commonly used by Xiaomi/Samsung/Vivo.
  "miui.intent.action.POWER_HIDE_MODE_APP_LIST",
  "com.samsung.android.sm.ACTION_BATTERY",
  "com.vivo.abe.action.OPTIMIZATION_SETTINGS",
] as const;

export default function Index() {
  const {
    profile,
    updateProfile,
    resetProfile,
    isProfileComplete,
    isLoading,
    hasSavedProfile,
  } = useDriverProfile();
  const {
    isTracking,
    isLocating,
    currentLocation,
    trackingDebugStatus,
    startTracking,
    stopTracking,
  } = useLocationTracking(profile, isProfileComplete);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isToggleBusy, setIsToggleBusy] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(
    Platform.OS === "web",
  );
  const [hasStartedOnboarding, setHasStartedOnboarding] = useState(false);
  const [locationPopoverMessage, setLocationPopoverMessage] = useState<
    string | null
  >(null);
  const appStateRef = useRef(AppState.currentState);
  const waitingForSettingsReturn = useRef(false);
  const hasShownBatteryOptimizationTipRef = useRef(false);

  const openDeviceLocationSettings = useCallback(async () => {
    waitingForSettingsReturn.current = true;

    if (Platform.OS === "android") {
      try {
        await Location.enableNetworkProviderAsync();
        // User may have enabled GPS via the prompt; re-check immediately
        waitingForSettingsReturn.current = false;
        const ok = await Location.hasServicesEnabledAsync();
        if (ok) {
          setHasLocationPermission(true);
        }
        return;
      } catch {
        // Fall back to Android location settings when prompt isn't available.
      }

      try {
        await Linking.sendIntent("android.settings.LOCATION_SOURCE_SETTINGS");
        return;
      } catch {
        // Fall through to app settings.
      }
    }

    await Linking.openSettings();
  }, []);

  const openAppLocationSettings = useCallback(async () => {
    waitingForSettingsReturn.current = true;
    await Linking.openSettings();
  }, []);

  const openAppNotificationSettings = useCallback(async () => {
    waitingForSettingsReturn.current = true;

    if (Platform.OS !== "android") {
      await Linking.openSettings();
      return;
    }

    try {
      const packageName = Constants.expoConfig?.android?.package;
      if (packageName) {
        await Linking.sendIntent("android.settings.APP_NOTIFICATION_SETTINGS", [
          {
            key: "android.provider.extra.APP_PACKAGE",
            value: packageName,
          },
        ]);
        return;
      }
    } catch {
      // Fall through to app settings.
    }

    await Linking.openSettings();
  }, []);

  const openBatteryOptimizationSettings = useCallback(async () => {
    if (Platform.OS !== "android") {
      return;
    }

    waitingForSettingsReturn.current = true;

    for (const action of BATTERY_SETTINGS_ACTIONS) {
      try {
        await Linking.sendIntent(action);
        return;
      } catch {
        // Try the next intent action.
      }
    }

    await Linking.openSettings();
  }, []);

  const ensureNotificationPermission = useCallback(async () => {
    if (Platform.OS !== "android") {
      return true;
    }

    if (typeof Platform.Version !== "number" || Platform.Version < 33) {
      return true;
    }

    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    if (!permission) {
      return true;
    }

    const alreadyGranted = await PermissionsAndroid.check(permission);
    if (alreadyGranted) {
      return true;
    }

    const result = await PermissionsAndroid.request(permission);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  useEffect(() => {
    if (!locationPopoverMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setLocationPopoverMessage(null);
    }, 2400);

    return () => clearTimeout(timer);
  }, [locationPopoverMessage]);

  const checkLocationPermission = useCallback(
    async (requestPermission: boolean, requireBackground = false) => {
      if (Platform.OS === "web") {
        setHasLocationPermission(true);
        return true;
      }

      const permission = requestPermission
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setHasLocationPermission(false);

        if (requestPermission) {
          if (permission.canAskAgain) {
            Alert.alert(
              "Location зөвшөөрөл хэрэгтэй",
              "Allow дээр дарж байж үргэлжилнэ.",
              [{ text: "Ойлголоо" }],
            );
          } else {
            Alert.alert(
              "Location permission хаалттай",
              "App settings рүү орж Location permission-г зөвшөөрнө үү.",
              [
                { text: "Болих", style: "cancel" },
                {
                  text: "Settings нээх",
                  onPress: () => {
                    openAppLocationSettings().catch(() => undefined);
                  },
                },
              ],
            );
          }
        }

        return false;
      }

      if (requireBackground) {
        const backgroundPermission = requestPermission
          ? await Location.requestBackgroundPermissionsAsync()
          : await Location.getBackgroundPermissionsAsync();

        if (backgroundPermission.status !== "granted") {
          if (requestPermission) {
            Alert.alert(
              "Background location зөвшөөрөл хэрэгтэй",
              "App хаалттай байсан ч GPS цэг хадгалахын тулд Always allow сонгоно уу.",
              [{ text: "Ойлголоо" }],
            );
          }

          return false;
        }
      }

      let servicesEnabled = false;
      try {
        servicesEnabled = await Location.hasServicesEnabledAsync();
      } catch {
        servicesEnabled = false;
      }
      if (!servicesEnabled) {
        setHasLocationPermission(false);
        if (requestPermission) {
          Alert.alert(
            "GPS унтраалттай байна",
            "Байршлын үйлчилгээ (GPS)-г асаагаад дахин оролдоно уу.",
            [
              { text: "Болих", style: "cancel" },
              {
                text: "Асаах",
                onPress: () => {
                  waitingForSettingsReturn.current = true;
                  openDeviceLocationSettings().catch(() => undefined);
                },
              },
            ],
          );
        }
        return false;
      }

      setHasLocationPermission(true);
      return true;
    },
    [openAppLocationSettings, openDeviceLocationSettings],
  );

  useEffect(() => {
    checkLocationPermission(false).catch(() => setHasLocationPermission(false));
  }, [checkLocationPermission]);

  // Re-check location permission + GPS when app comes back from settings
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        if (waitingForSettingsReturn.current) {
          waitingForSettingsReturn.current = false;
          checkLocationPermission(false)
            .then((ok: boolean) => {
              if (!ok) {
                setLocationPopoverMessage(
                  "GPS эсвэл Location permission асаана уу",
                );
              }
            })
            .catch(() => setHasLocationPermission(false));
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [checkLocationPermission]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setHasStartedOnboarding(hasSavedProfile);
  }, [hasSavedProfile, isLoading]);

  const currentStep: OnboardingStep = useMemo(() => {
    if (isProfileComplete && hasStartedOnboarding) return "map";
    if (!hasLocationPermission) return "location";
    if (!isProfileComplete) return "profile";
    if (!hasStartedOnboarding) return "profile";
    return "map";
  }, [hasLocationPermission, hasStartedOnboarding, isProfileComplete]);

  const toggleTracking = async (enabled: boolean) => {
    if (isToggleBusy) {
      return;
    }

    setIsToggleBusy(true);
    try {
      if (enabled) {
        const canShowNotification = await ensureNotificationPermission();
        if (!canShowNotification) {
          Alert.alert(
            "Notification зөвшөөрөл хэрэгтэй",
            "Tracking notification харагдахын тулд notification permission-ийг Allow болгоно уу.",
            [
              { text: "Болих", style: "cancel" },
              {
                text: "Notification settings",
                onPress: () => {
                  openAppNotificationSettings().catch(() => undefined);
                },
              },
            ],
          );
          return;
        }

        const canUseLocation = await checkLocationPermission(true, !IS_EXPO_GO);
        if (!canUseLocation) {
          setLocationPopoverMessage(
            IS_EXPO_GO
              ? "Location permission болон GPS-ээ асаагаад Expo Go дээр foreground tracking шалгана уу"
              : "Always location permission болон GPS-ээ асаана уу",
          );
          return;
        }

        const started = await startTracking();
        if (!started) {
          setLocationPopoverMessage("Location-оо асаана уу");
          stopTracking();
        } else if (
          Platform.OS === "android" &&
          !hasShownBatteryOptimizationTipRef.current
        ) {
          hasShownBatteryOptimizationTipRef.current = true;
          Alert.alert(
            "Battery хамгаалалт тохируулах",
            "Зарим утсан дээр (Samsung, Xiaomi, Vivo) Background GPS тасалдахгүйн тулд энэ аппыг App Info > Battery > Unrestricted болгоно уу. Optimized хэвээр байвал tracking 10-20 минутын дараа зогсож магадгүй.",
            [
              { text: "Дараа нь", style: "cancel" },
              {
                text: "Тохиргоо нээх",
                onPress: () => {
                  openBatteryOptimizationSettings().catch(() => undefined);
                },
              },
            ],
          );
        }
      } else {
        stopTracking();
      }
    } finally {
      setIsToggleBusy(false);
    }
  };

  const handleContinueToMap = async () => {
    if (isProfileComplete) {
      const canUseLocation = await checkLocationPermission(true);
      if (!canUseLocation) {
        setLocationPopoverMessage("Location permission болон GPS-ээ асаана уу");
        setHasLocationPermission(false);
        return;
      }

      setHasLocationPermission(true);
      setHasStartedOnboarding(true);
    }
  };

  const handleDeleteAccount = async () => {
    await resetProfile();
    setHasStartedOnboarding(false);
    setShowProfileSettings(false);
  };

  const mapCenter = useMemo((): [number, number] | null => {
    if (currentLocation) {
      return [currentLocation.latitude, currentLocation.longitude];
    }
    return null;
  }, [currentLocation]);

  const handleRequestLocation = async () => {
    try {
      const ok = await checkLocationPermission(true);
      if (!ok) {
        setLocationPopoverMessage("Location permission болон GPS-ээ асаана уу");
      }
    } catch {
      setHasLocationPermission(false);
      Alert.alert(
        "Location алдаа",
        "Location тохиргоог нээгээд зөвшөөрөл болон GPS-ээ шалгана уу.",
        [
          { text: "Болих", style: "cancel" },
          {
            text: "Settings нээх",
            onPress: () => {
              openAppLocationSettings().catch(() => undefined);
            },
          },
        ],
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header (on location and map steps) */}
      {(currentStep === "location" || currentStep === "map") && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Navigation size={17} color="white" />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Truck</Text>
              <Text style={styles.headerSubtitle}>Location</Text>
            </View>
          </View>

          {currentStep === "map" && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowProfileSettings(true)}
            >
              <UserCircle2 size={24} color="#0f172a" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.mainContent}>
        {currentStep === "location" && (
          <LocationPermissionStep
            onRequestLocation={handleRequestLocation}
            onOpenBatterySettings={() => {
              openBatteryOptimizationSettings().catch(() => undefined);
            }}
          />
        )}

        {currentStep === "profile" && (
          <ProfileSetupStep
            profile={profile}
            onUpdate={updateProfile}
            isProfileComplete={isProfileComplete}
            onContinue={handleContinueToMap}
          />
        )}

        {currentStep === "map" && (
          <TrackingMap
            center={mapCenter}
            isTracking={isTracking}
            isLocating={isLocating}
            isBusy={isToggleBusy}
            onToggleTracking={toggleTracking}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            locationPopoverMessage={locationPopoverMessage}
            trackingDebugStatus={trackingDebugStatus}
          />
        )}
      </View>

      {/* Control Drawer */}
      <TrackingControlDrawer
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        isTracking={isTracking}
        isBusy={isToggleBusy}
        onToggleTracking={toggleTracking}
        locationPopoverMessage={locationPopoverMessage}
        trackingDebugStatus={trackingDebugStatus}
        onOpenBatterySettings={() => {
          openBatteryOptimizationSettings().catch(() => undefined);
        }}
      />

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        visible={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        profile={profile}
        onUpdate={updateProfile}
        onDeleteAccount={handleDeleteAccount}
      />
    </SafeAreaView>
  );
}
