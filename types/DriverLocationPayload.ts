export interface DriverLocationOther {
  ignitionStatus: boolean | null;
  batteryVoltage: number | null;
  gpsAccuracyHdop: number | null;
  satellitesInView: number | null;
  gsmSignalStrengthDbm: number | null;
  eventCode: number | null;
}

export interface DriverLocationPayload {
  carNumber: string;
  deviceId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  headingDegree: number | null;
  other: DriverLocationOther | null;
}
