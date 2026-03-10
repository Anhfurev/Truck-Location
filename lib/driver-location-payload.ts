import { DriverLocationPayload } from "@/types/DriverLocationPayload";
import { DriverProfile } from "@/types/DriverProfile";

interface BuildDriverLocationPayloadInput {
  location: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: number;
  };
  profile: DriverProfile;
  status: DriverLocationPayload["status"];
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function buildDriverTrackingId(profile: DriverProfile): string {
  const carPlate = normalizeWhitespace(profile.carPlate).replace(/\s+/g, "-");
  const phone = normalizeWhitespace(profile.phone).replace(/[^\d+]/g, "");
  const fullName = normalizeWhitespace(
    `${profile.firstName} ${profile.lastName}`,
  )
    .toLowerCase()
    .replace(/\s+/g, "-");

  return carPlate || phone || fullName || "unknown-driver";
}

export function buildDriverLocationPayload({
  location,
  profile,
  status,
}: BuildDriverLocationPayloadInput): DriverLocationPayload {
  const fullName = normalizeWhitespace(
    `${profile.firstName} ${profile.lastName}`,
  );

  return {
    schemaVersion: 1,
    source: "expo-location",
    status,
    recordedAt: new Date(location.timestamp).toISOString(),
    recordedAtUnixMs: location.timestamp,
    driver: {
      id: buildDriverTrackingId(profile),
      fullName,
      firstName: normalizeWhitespace(profile.firstName),
      lastName: normalizeWhitespace(profile.lastName),
      phone: normalizeWhitespace(profile.phone),
      carPlate: normalizeWhitespace(profile.carPlate).toUpperCase(),
      company: normalizeWhitespace(profile.company),
      bio: profile.bio.trim(),
    },
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracyMeters: location.accuracy,
    },
  };
}
