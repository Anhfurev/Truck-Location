import { isDriverProfileValid } from "@/lib/driver-profile-validation";
import { DriverProfile } from "@/types/DriverProfile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

const STORAGE_KEY = "driver_profile";

// Platform-agnostic storage helper to abstract away localStorage vs AsyncStorage
const storage = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      // localStorage is sync, wrap in Promise to match AsyncStorage's async API
      return Promise.resolve(localStorage.getItem(key));
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(key, value);
        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem(key);
        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    }
    return AsyncStorage.removeItem(key);
  },
};

const defaultProfile: DriverProfile = {
  carNumber: "",
  deviceId: "",
};

function sanitizeProfile(input: unknown): DriverProfile {
  const source = (
    input && typeof input === "object" ? (input as Partial<DriverProfile>) : {}
  ) as Partial<DriverProfile>;

  return {
    carNumber:
      typeof source.carNumber === "string"
        ? source.carNumber.replace(/\s+/g, "").toUpperCase()
        : typeof (input as { carPlate?: unknown })?.carPlate === "string"
          ? ((input as { carPlate?: string }).carPlate ?? "")
              .replace(/\s+/g, "")
              .toUpperCase()
          : "",
    deviceId: typeof source.deviceId === "string" ? source.deviceId.trim() : "",
  };
}

export function useDriverProfile() {
  const [profile, setProfile] = useState<DriverProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);

  // Load profile from AsyncStorage on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const saved = await storage.getItem(STORAGE_KEY);
        if (saved) {
          const nextProfile = sanitizeProfile(JSON.parse(saved));
          setProfile(nextProfile);
          setHasSavedProfile(isDriverProfileValid(nextProfile));
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Save profile to AsyncStorage whenever it changes
  useEffect(() => {
    if (isLoading) {
      return; // Don't save until the initial profile is loaded
    }

    storage
      .setItem(STORAGE_KEY, JSON.stringify(profile))
      .catch((error) => console.error("Error saving profile:", error));
  }, [profile, isLoading]);

  const updateProfile = (updates: Partial<DriverProfile>) => {
    setProfile((prev: DriverProfile) =>
      sanitizeProfile({ ...prev, ...updates }),
    );
  };

  const resetProfile = async () => {
    setProfile(defaultProfile);
    setHasSavedProfile(false);
    try {
      await storage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error resetting profile:", error);
    }
  };

  const isProfileComplete = isDriverProfileValid(profile);

  return {
    profile,
    updateProfile,
    resetProfile,
    isProfileComplete,
    isLoading,
    hasSavedProfile,
  };
}
