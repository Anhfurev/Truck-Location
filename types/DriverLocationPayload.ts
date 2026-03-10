export interface DriverTrackingLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
}

export interface DriverTrackingIdentity {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  carPlate: string;
  company: string;
  bio: string;
}

export interface DriverLocationPayload {
  schemaVersion: 1;
  source: "expo-location";
  status: "online" | "offline";
  recordedAt: string;
  recordedAtUnixMs: number;
  driver: DriverTrackingIdentity;
  location: DriverTrackingLocation;
}
