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
  firstName: "",
  lastName: "",
  phone: "",
  carPlate: "",
  company: "",
  bio: "",
};

function sanitizeProfile(input: unknown): DriverProfile {
  const source = (
    input && typeof input === "object" ? (input as Partial<DriverProfile>) : {}
  ) as Partial<DriverProfile>;

  return {
    firstName: typeof source.firstName === "string" ? source.firstName : "",
    lastName: typeof source.lastName === "string" ? source.lastName : "",
    phone: typeof source.phone === "string" ? source.phone : "",
    carPlate: typeof source.carPlate === "string" ? source.carPlate : "",
    company: typeof source.company === "string" ? source.company : "",
    bio: typeof source.bio === "string" ? source.bio : "",
  };
}

export function useDriverProfile() {
  const [profile, setProfile] = useState<DriverProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile from AsyncStorage on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const saved = await storage.getItem(STORAGE_KEY);
        if (saved) {
          setProfile(sanitizeProfile(JSON.parse(saved)));
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
    try {
      await storage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error resetting profile:", error);
    }
  };

  const isProfileComplete = isDriverProfileValid(profile);

  return { profile, updateProfile, resetProfile, isProfileComplete, isLoading };
}
