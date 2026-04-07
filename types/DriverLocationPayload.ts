export interface DriverLocationOther {
  ignitionStatus: boolean;
  batteryVoltage: number;
  gpsAccuracyHdop: number;
  satellitesInView: number;
  gsmSignalStrengthDbm: number;
  eventCode: number;
}

export interface DriverLocationPayload {
  carNumber: string;
  deviceId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  headingDegree: number | null;
  other: DriverLocationOther;
}
