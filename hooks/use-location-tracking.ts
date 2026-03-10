import { buildDriverLocationPayload } from "@/lib/driver-location-payload";
import { DriverLocationPayload } from "@/types/DriverLocationPayload";
import { DriverProfile } from "@/types/DriverProfile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

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
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null,
  );

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

  const applyLocation = (position: Location.LocationObject) => {
    const nextLocation: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
      timestamp: position.timestamp ?? Date.now(),
    };
    setCurrentLocation(nextLocation);
    sendUpdate(nextLocation);
  };

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

      // Permissions and GPS already validated by the caller — start immediately.
      setIsTracking(true);
      setIsLocating(true);
      toast.success("Байршил хяналт идэвхжлээ");

      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          mayShowUserSettingsDialog: true,
          distanceInterval: 5,
          timeInterval: 2000,
        },
        (position) => {
          if (
            isAccurateEnough(position, LIVE_LOCATION_REQUIRED_ACCURACY_METERS)
          ) {
            applyLocation(position);
          }
        },
      );

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
      return false;
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    setIsLocating(false);
    clearLocation();
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
    toast.info("Байршил хяналт идэвхгүй болсон");
  };

  const sendUpdate = async (location: LocationData) => {
    try {
      if (!profile.firstName || !profile.lastName) return;

      const payload = buildDriverLocationPayload({
        profile,
        location,
        status: "online",
      });

      setLastSentPayload(payload);

      // Store update in AsyncStorage (in real app, send to server)
      await AsyncStorage.setItem(
        `location_${Date.now()}`,
        JSON.stringify(payload),
      );
    } catch (error) {
      console.error("Failed to send location update:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, []);

  return {
    isTracking,
    isLocating,
    currentLocation,
    lastSentPayload,
    startTracking,
    stopTracking,
  };
}
