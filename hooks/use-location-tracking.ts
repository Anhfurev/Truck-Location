import {
  BACKGROUND_LOCATION_TASK_NAME,
  flushPendingPayloads,
  getLastKnownLocation,
  getTrackingDebugStatus,
  getTrackingEnabled,
  processTrackedLocation,
  setTrackingEnabled,
  TrackedLocationPoint,
  TrackingDebugStatus,
} from "@/lib/location-tracking-service";
import { DriverLocationPayload } from "@/types/DriverLocationPayload";
import { DriverProfile } from "@/types/DriverProfile";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type LocationData = TrackedLocationPoint;

const INITIAL_LOCATION_MAX_AGE_MS = 10_000;
const INITIAL_LOCATION_REQUIRED_ACCURACY_METERS = 50;
const LIVE_LOCATION_REQUIRED_ACCURACY_METERS = 150;

const toast = {
  success: (message: string) => console.log("[ok]", message),
  error: (message: string) => console.warn("[error]", message),
  info: (message: string) => console.log("[info]", message),
};

export function useLocationTracking(
  profile: DriverProfile,
  isProfileComplete: boolean,
) {
  const [isTracking, setIsTracking] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null,
  );
  const [lastSentPayload, setLastSentPayload] =
    useState<DriverLocationPayload | null>(null);
  const [trackingDebugStatus, setTrackingDebugStatus] =
    useState<TrackingDebugStatus | null>(null);
  const [shouldRestoreTracking, setShouldRestoreTracking] = useState<
    boolean | null
  >(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null,
  );
  const hasTriedAutoRestoreRef = useRef(false);

  const updateCurrentLocation = useCallback((location: LocationData) => {
    setCurrentLocation(location);
  }, []);

  const refreshTrackingDebugStatus = useCallback(() => {
    getTrackingDebugStatus()
      .then((status) => {
        setTrackingDebugStatus(status);
      })
      .catch(() => undefined);
  }, []);

  const notificationTitle = profile.carNumber
    ? `${profile.carNumber} байршил хуваалцаж байна`
    : "Байршил хуваалцаж байна";

  const notificationBody = profile.carNumber
    ? "Truck Location идэвхтэй байна. Дарж апп руу орж байршил хуваалцахыг унтраах эсвэл асаана уу."
    : "Truck Location идэвхтэй байна. Дарж апп руу орж байршил хуваалцахыг удирдана уу.";

  const ensureBackgroundTrackingActive = useCallback(async () => {
    if (Platform.OS === "web") {
      return true;
    }

    const [foregroundPermission, backgroundPermission, servicesEnabled] =
      await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
        Location.hasServicesEnabledAsync().catch(() => false),
      ]);

    if (
      foregroundPermission.status !== "granted" ||
      backgroundPermission.status !== "granted" ||
      !servicesEnabled
    ) {
      return false;
    }

    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK_NAME,
    );
    if (alreadyStarted) {
      return true;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 0,
      timeInterval: 5000,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle,
        notificationBody,
        notificationColor: "#2563eb",
        killServiceOnDestroy: false,
      },
    });

    return true;
  }, [notificationBody, notificationTitle]);

  const getCurrentPositionWithTimeout = async (
    timeoutMs = 8000,
    accuracy: Location.Accuracy = Location.Accuracy.BestForNavigation,
  ): Promise<Location.LocationObject | null> => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    try {
      const timeoutPromise = new Promise<null>((resolve) => {
        timerId = setTimeout(() => resolve(null), timeoutMs);
      });

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy,
        mayShowUserSettingsDialog: true,
      }).catch(() => null);

      const result = await Promise.race([locationPromise, timeoutPromise]);
      return result as Location.LocationObject | null;
    } finally {
      if (timerId) {
        clearTimeout(timerId);
      }
    }
  };

  const applyLocation = useCallback(
    (position: Location.LocationObject) => {
      const nextLocation: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        timestamp: position.timestamp ?? Date.now(),
        speed: position.coords.speed ?? null,
        headingDegree: position.coords.heading ?? null,
      };
      updateCurrentLocation(nextLocation);
      processTrackedLocation(nextLocation)
        .then((payload) => {
          if (payload) {
            setLastSentPayload(payload);
          }
        })
        .catch((error) => {
          console.error("Failed to process location update:", error);
        })
        .finally(() => {
          refreshTrackingDebugStatus();
        });
    },
    [refreshTrackingDebugStatus, updateCurrentLocation],
  );

  const startForegroundWatcher = useCallback(async () => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }

    locationSubscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        mayShowUserSettingsDialog: true,
        distanceInterval: 0,
        timeInterval: 5000,
      },
      (position) => {
        if (
          isAccurateEnough(position, LIVE_LOCATION_REQUIRED_ACCURACY_METERS)
        ) {
          applyLocation(position);
        }
      },
    );
  }, [applyLocation]);

  const isAccurateEnough = (
    position: Location.LocationObject | null,
    maxAccuracyMeters: number,
  ) => {
    if (!position) {
      return false;
    }

    const accuracy = position.coords.accuracy;
    if (accuracy == null) {
      return true;
    }

    return accuracy <= maxAccuracyMeters;
  };

  const getFreshInitialPosition = async () => {
    const current = await getCurrentPositionWithTimeout(
      12000,
      Location.Accuracy.BestForNavigation,
    );
    if (isAccurateEnough(current, INITIAL_LOCATION_REQUIRED_ACCURACY_METERS)) {
      return current;
    }

    try {
      const last = await Location.getLastKnownPositionAsync({
        maxAge: INITIAL_LOCATION_MAX_AGE_MS,
        requiredAccuracy: INITIAL_LOCATION_REQUIRED_ACCURACY_METERS,
      });

      if (last) {
        return last;
      }
    } catch {
      // Fall through to an active GPS read.
    }

    return getCurrentPositionWithTimeout(
      10000,
      Location.Accuracy.BestForNavigation,
    );
  };

  const clearLocation = () => {
    setCurrentLocation(null);
    setLastSentPayload(null);
  };

  const startTracking = async (): Promise<boolean> => {
    try {
      if (!isProfileComplete) {
        toast.error("Мэдээллээ гүйцэд оруулна уу!");
        return false;
      }

      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }

      const backgroundStarted = await ensureBackgroundTrackingActive();
      if (!backgroundStarted) {
        toast.error("Background location зөвшөөрөл хэрэгтэй байна");
        return false;
      }

      await setTrackingEnabled(true);
      setShouldRestoreTracking(true);

      // Permissions and GPS already validated by the caller — start immediately.
      setIsTracking(true);
      setIsLocating(true);
      toast.success("Байршил хяналт идэвхжлээ");

      await startForegroundWatcher();
      flushPendingPayloads().catch(() => undefined);
      refreshTrackingDebugStatus();

      // Acquire a fresh fix in background (do not block toggle responsiveness).
      getFreshInitialPosition()
        .then((initial) => {
          if (
            initial &&
            isAccurateEnough(initial, INITIAL_LOCATION_REQUIRED_ACCURACY_METERS)
          ) {
            applyLocation(initial);
          }
        })
        .finally(() => {
          setIsLocating(false);
        })
        .catch(() => undefined);

      return true;
    } catch (error) {
      console.error("Location tracking start failed:", error);
      toast.error("Байршил авах боломжгүй байна");
      setIsTracking(false);
      setIsLocating(false);
      setTrackingEnabled(false).catch(() => undefined);
      return false;
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    setIsLocating(false);
    clearLocation();
    setTrackingEnabled(false).catch(() => undefined);
    setShouldRestoreTracking(false);
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
    if (Platform.OS !== "web") {
      Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME)
        .then((started) => {
          if (started) {
            return Location.stopLocationUpdatesAsync(
              BACKGROUND_LOCATION_TASK_NAME,
            );
          }

          return undefined;
        })
        .catch(() => undefined);
    }
    toast.info("Байршил хяналт идэвхгүй болсон");
  };

  useEffect(() => {
    getLastKnownLocation()
      .then((location) => {
        if (location) {
          setCurrentLocation(location);
        }
      })
      .catch(() => undefined);

    getTrackingEnabled()
      .then((enabled) => {
        setShouldRestoreTracking(enabled);
      })
      .catch(() => {
        setShouldRestoreTracking(false);
      });

    flushPendingPayloads().catch(() => undefined);
    refreshTrackingDebugStatus();

    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, [refreshTrackingDebugStatus]);

  useEffect(() => {
    const timer = setInterval(() => {
      refreshTrackingDebugStatus();
    }, 3000);

    return () => clearInterval(timer);
  }, [refreshTrackingDebugStatus]);

  useEffect(() => {
    if (!isProfileComplete) {
      return;
    }

    if (!shouldRestoreTracking || hasTriedAutoRestoreRef.current) {
      return;
    }

    hasTriedAutoRestoreRef.current = true;

    ensureBackgroundTrackingActive()
      .then((canRestore) => {
        if (!canRestore) {
          return;
        }

        setIsTracking(true);
        return startForegroundWatcher();
      })
      .catch((error) => {
        console.error("Failed to restore tracking state:", error);
      });
  }, [
    ensureBackgroundTrackingActive,
    isProfileComplete,
    shouldRestoreTracking,
    startForegroundWatcher,
  ]);

  return {
    isTracking,
    isLocating,
    currentLocation,
    lastSentPayload,
    trackingDebugStatus,
    startTracking,
    stopTracking,
  };
}
