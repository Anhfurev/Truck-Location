import { DriverLocationPayload } from "@/types/DriverLocationPayload";
import { DriverProfile } from "@/types/DriverProfile";

interface BuildDriverLocationPayloadInput {
  location: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: number;
    speed: number | null;
    headingDegree: number | null;
  };
  profile: DriverProfile;
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function formatPayloadTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}`;
}

function normalizeHeading(value: number | null): number | null {
  if (value == null || Number.isNaN(value) || value < 0) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function normalizeSpeed(value: number | null): number | null {
  if (value == null || Number.isNaN(value) || value < 0) {
    return null;
  }

  return Math.round(value * 3.6 * 10) / 10;
}

function normalizeGpsAccuracyHdop(value: number | null): number {
  if (value == null || Number.isNaN(value) || value <= 0) {
    return 0.8;
  }

  return Math.max(0.8, Math.round((value / 5) * 10) / 10);
}

export function buildDriverLocationPayload({
  location,
  profile,
}: BuildDriverLocationPayloadInput): DriverLocationPayload {
  const normalizedCarNumber = normalizeWhitespace(profile.carNumber)
    .replace(/\s+/g, "")
    .toUpperCase();
  const normalizedDeviceId = normalizeWhitespace(profile.deviceId);

  return {
    carNumber: normalizedCarNumber,
    deviceId: normalizedDeviceId,
    timestamp: formatPayloadTimestamp(location.timestamp),
    latitude: location.latitude,
    longitude: location.longitude,
    speed: normalizeSpeed(location.speed),
    headingDegree: normalizeHeading(location.headingDegree),
    other: {
      ignitionStatus: true,
      batteryVoltage: 12.6,
      gpsAccuracyHdop: normalizeGpsAccuracyHdop(location.accuracy),
      satellitesInView: 12,
      gsmSignalStrengthDbm: -92,
      eventCode: 102,
    },
  };
}
