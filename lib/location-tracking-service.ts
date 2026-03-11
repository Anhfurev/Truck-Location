import { buildDriverLocationPayload } from "@/lib/driver-location-payload";
import { isDriverProfileValid } from "@/lib/driver-profile-validation";
import { DriverLocationPayload } from "@/types/DriverLocationPayload";
import { DriverProfile } from "@/types/DriverProfile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

export interface TrackedLocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
  speed: number | null;
  headingDegree: number | null;
}

const DRIVER_PROFILE_STORAGE_KEY = "driver_profile";
const TRACKING_ENABLED_STORAGE_KEY = "tracking_enabled";
const LAST_LOCATION_STORAGE_KEY = "last_known_location";
const LAST_PAYLOAD_STORAGE_KEY = "last_sent_payload";
const PENDING_PAYLOADS_STORAGE_KEY = "pending_gps_payloads";
const TRACKING_DEBUG_STATUS_KEY = "tracking_debug_status";
const GPS_ENDPOINT = "https://ai-tos.mn/api/gps/data";
const MAX_QUEUE_SIZE = 500;
const BACKGROUND_ACCEPTABLE_ACCURACY_METERS = 150;

export const BACKGROUND_LOCATION_TASK_NAME =
  "trucklocation-background-location";

export interface TrackingDebugStatus {
  queueCount: number;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastResponseStatus: number | null;
  lastResponseText: string | null;
  lastError: string | null;
  lastPayload: DriverLocationPayload | null;
}

function debugTrackingLog(message: string, data?: unknown): void {
  if (!__DEV__) {
    return;
  }

  if (typeof data === "undefined") {
    console.log(`[tracking] ${message}`);
    return;
  }

  console.log(`[tracking] ${message}`, data);
}

function formatPayloadForDebug(payload: DriverLocationPayload): string {
  return JSON.stringify(payload);
}

function getDefaultTrackingDebugStatus(): TrackingDebugStatus {
  return {
    queueCount: 0,
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastResponseStatus: null,
    lastResponseText: null,
    lastError: null,
    lastPayload: null,
  };
}

function sanitizeTrackingDebugStatus(input: unknown): TrackingDebugStatus {
  const source =
    input && typeof input === "object"
      ? (input as Partial<TrackingDebugStatus>)
      : {};

  return {
    queueCount: typeof source.queueCount === "number" ? source.queueCount : 0,
    lastAttemptAt:
      typeof source.lastAttemptAt === "string" ? source.lastAttemptAt : null,
    lastSuccessAt:
      typeof source.lastSuccessAt === "string" ? source.lastSuccessAt : null,
    lastFailureAt:
      typeof source.lastFailureAt === "string" ? source.lastFailureAt : null,
    lastResponseStatus:
      typeof source.lastResponseStatus === "number"
        ? source.lastResponseStatus
        : null,
    lastResponseText:
      typeof source.lastResponseText === "string"
        ? source.lastResponseText
        : null,
    lastError: typeof source.lastError === "string" ? source.lastError : null,
    lastPayload:
      source.lastPayload && typeof source.lastPayload === "object"
        ? (source.lastPayload as DriverLocationPayload)
        : null,
  };
}

async function getStoredTrackingDebugStatus(): Promise<TrackingDebugStatus> {
  const rawStatus = await AsyncStorage.getItem(TRACKING_DEBUG_STATUS_KEY);
  return sanitizeTrackingDebugStatus(
    parseJson(rawStatus, getDefaultTrackingDebugStatus()),
  );
}

async function updateTrackingDebugStatus(
  partial: Partial<TrackingDebugStatus>,
): Promise<TrackingDebugStatus> {
  const current = await getStoredTrackingDebugStatus();
  const next = {
    ...current,
    ...partial,
  } satisfies TrackingDebugStatus;

  await AsyncStorage.setItem(TRACKING_DEBUG_STATUS_KEY, JSON.stringify(next));
  return next;
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function sanitizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeProfile(input: unknown): DriverProfile {
  const source =
    input && typeof input === "object"
      ? (input as Partial<DriverProfile> & {
          phone?: string;
          carPlate?: string;
          deviceId?: string;
        })
      : {};

  return {
    carNumber: sanitizeText(
      source.carNumber ?? source.carPlate ?? source.deviceId,
    )
      .replace(/\s+/g, "")
      .toUpperCase(),
  };
}

function sanitizeTrackedLocation(input: unknown): TrackedLocationPoint | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const source = input as Partial<TrackedLocationPoint>;
  if (
    typeof source.latitude !== "number" ||
    typeof source.longitude !== "number" ||
    typeof source.timestamp !== "number"
  ) {
    return null;
  }

  return {
    latitude: source.latitude,
    longitude: source.longitude,
    accuracy: typeof source.accuracy === "number" ? source.accuracy : null,
    timestamp: source.timestamp,
    speed: typeof source.speed === "number" ? source.speed : null,
    headingDegree:
      typeof source.headingDegree === "number" ? source.headingDegree : null,
  };
}

function isAccurateEnough(location: Location.LocationObject): boolean {
  const accuracy = location.coords.accuracy;
  return accuracy == null || accuracy <= BACKGROUND_ACCEPTABLE_ACCURACY_METERS;
}

function toTrackedLocationPoint(
  location: Location.LocationObject,
): TrackedLocationPoint {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? null,
    timestamp: location.timestamp ?? Date.now(),
    speed: location.coords.speed ?? null,
    headingDegree: location.coords.heading ?? null,
  };
}

async function getStoredProfile(): Promise<DriverProfile | null> {
  const rawProfile = await AsyncStorage.getItem(DRIVER_PROFILE_STORAGE_KEY);
  const profile = sanitizeProfile(parseJson(rawProfile, {}));

  return isDriverProfileValid(profile) ? profile : null;
}

async function getPendingPayloads(): Promise<DriverLocationPayload[]> {
  const rawQueue = await AsyncStorage.getItem(PENDING_PAYLOADS_STORAGE_KEY);
  const queue = parseJson<DriverLocationPayload[]>(rawQueue, []);
  return Array.isArray(queue) ? queue : [];
}

async function setPendingPayloads(
  payloads: DriverLocationPayload[],
): Promise<void> {
  if (payloads.length === 0) {
    await AsyncStorage.removeItem(PENDING_PAYLOADS_STORAGE_KEY);
    await updateTrackingDebugStatus({ queueCount: 0 });
    return;
  }

  await AsyncStorage.setItem(
    PENDING_PAYLOADS_STORAGE_KEY,
    JSON.stringify(payloads.slice(-MAX_QUEUE_SIZE)),
  );
  await updateTrackingDebugStatus({
    queueCount: Math.min(payloads.length, MAX_QUEUE_SIZE),
  });
}

async function postPayload(payload: DriverLocationPayload): Promise<void> {
  await updateTrackingDebugStatus({
    lastAttemptAt: new Date().toISOString(),
    lastPayload: payload,
    lastError: null,
  });

  debugTrackingLog("POST gps payload", {
    endpoint: GPS_ENDPOINT,
    carNumber: payload.carNumber,
    timestamp: payload.timestamp,
    latitude: payload.latitude,
    longitude: payload.longitude,
    speed: payload.speed,
    headingDegree: payload.headingDegree,
  });
  debugTrackingLog("POST gps payload body", formatPayloadForDebug(payload));

  const response = await fetch(GPS_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `GPS API request failed (${response.status}): ${errorText || "unknown"}`,
    );
  }

  const responseText = await response.text().catch(() => "");

  await AsyncStorage.setItem(LAST_PAYLOAD_STORAGE_KEY, JSON.stringify(payload));
  await updateTrackingDebugStatus({
    lastSuccessAt: new Date().toISOString(),
    lastResponseStatus: response.status,
    lastResponseText: responseText || null,
    lastError: null,
  });
  debugTrackingLog("POST gps payload success", {
    status: response.status,
    carNumber: payload.carNumber,
    timestamp: payload.timestamp,
    responseText,
  });
}

let syncChain: Promise<void> = Promise.resolve();

function enqueueSync(work: () => Promise<void>): Promise<void> {
  const next = syncChain.then(work);
  syncChain = next.catch(() => undefined);
  return next;
}

export async function setTrackingEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(
    TRACKING_ENABLED_STORAGE_KEY,
    enabled ? "true" : "false",
  );
}

export async function getTrackingEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(TRACKING_ENABLED_STORAGE_KEY)) === "true";
}

export async function getLastKnownLocation(): Promise<TrackedLocationPoint | null> {
  const rawLocation = await AsyncStorage.getItem(LAST_LOCATION_STORAGE_KEY);
  return sanitizeTrackedLocation(parseJson(rawLocation, null));
}

export async function getTrackingDebugStatus(): Promise<TrackingDebugStatus> {
  const [status, queue] = await Promise.all([
    getStoredTrackingDebugStatus(),
    getPendingPayloads(),
  ]);

  if (status.queueCount === queue.length) {
    return status;
  }

  return updateTrackingDebugStatus({ queueCount: queue.length });
}

export async function flushPendingPayloads(): Promise<void> {
  return enqueueSync(async () => {
    const queue = await getPendingPayloads();
    if (queue.length === 0) {
      return;
    }

    debugTrackingLog("flush pending payloads start", {
      count: queue.length,
    });

    const remainingPayloads: DriverLocationPayload[] = [];

    for (let index = 0; index < queue.length; index += 1) {
      const payload = queue[index];

      try {
        await postPayload(payload);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await updateTrackingDebugStatus({
          lastFailureAt: new Date().toISOString(),
          lastError: message,
        });
        remainingPayloads.push(...queue.slice(index));
        debugTrackingLog("flush pending payloads paused", {
          remaining: queue.length - index,
        });
        console.warn("Failed to flush pending GPS payloads:", error);
        break;
      }
    }

    await setPendingPayloads(remainingPayloads);
    debugTrackingLog("flush pending payloads done", {
      remaining: remainingPayloads.length,
    });
  });
}

export async function processTrackedLocation(
  location: TrackedLocationPoint,
): Promise<DriverLocationPayload | null> {
  debugTrackingLog("process tracked location", {
    latitude: location.latitude,
    longitude: location.longitude,
    timestamp: location.timestamp,
    speed: location.speed,
    headingDegree: location.headingDegree,
  });

  await AsyncStorage.setItem(
    LAST_LOCATION_STORAGE_KEY,
    JSON.stringify(location),
  );

  const profile = await getStoredProfile();
  if (!profile) {
    debugTrackingLog("skip tracked location because profile is incomplete");
    return null;
  }

  const payload = buildDriverLocationPayload({ location, profile });
  debugTrackingLog("built gps payload", formatPayloadForDebug(payload));
  await AsyncStorage.setItem(LAST_PAYLOAD_STORAGE_KEY, JSON.stringify(payload));

  await enqueueSync(async () => {
    const queue = await getPendingPayloads();
    let unsentQueue = [...queue];

    if (queue.length > 0) {
      const remainingPayloads: DriverLocationPayload[] = [];

      for (let index = 0; index < queue.length; index += 1) {
        const queuedPayload = queue[index];

        try {
          await postPayload(queuedPayload);
        } catch (error) {
          remainingPayloads.push(...queue.slice(index));
          await setPendingPayloads([...remainingPayloads, payload]);
          const message =
            error instanceof Error ? error.message : String(error);
          await updateTrackingDebugStatus({
            lastFailureAt: new Date().toISOString(),
            lastError: message,
          });
          debugTrackingLog("queued current payload because flush failed", {
            queueSize: remainingPayloads.length + 1,
            payload: formatPayloadForDebug(payload),
          });
          console.warn("Failed to flush pending GPS payloads:", error);
          return;
        }
      }

      unsentQueue = [];
      await setPendingPayloads([]);
    }

    try {
      await postPayload(payload);
    } catch (error) {
      const nextQueue = [...unsentQueue, payload].slice(-MAX_QUEUE_SIZE);
      await setPendingPayloads(nextQueue);
      const message = error instanceof Error ? error.message : String(error);
      await updateTrackingDebugStatus({
        lastFailureAt: new Date().toISOString(),
        lastError: message,
      });
      debugTrackingLog("payload queued locally", {
        queueSize: nextQueue.length,
        carNumber: payload.carNumber,
        timestamp: payload.timestamp,
        payload: formatPayloadForDebug(payload),
      });
      console.warn("Failed to send GPS payload, queued locally:", error);
    }
  });

  return payload;
}

if (
  Platform.OS !== "web" &&
  !TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK_NAME)
) {
  TaskManager.defineTask(
    BACKGROUND_LOCATION_TASK_NAME,
    async ({ data, error }) => {
      if (error) {
        console.error("Background location task error:", error);
        return;
      }

      const event = data as
        | { locations?: Location.LocationObject[] }
        | undefined;
      const locations = event?.locations ?? [];
      if (locations.length === 0) {
        return;
      }

      const accurateLocations = locations.filter(isAccurateEnough);
      const latestLocation =
        accurateLocations[accurateLocations.length - 1] ??
        locations[locations.length - 1];

      if (!latestLocation) {
        return;
      }

      await processTrackedLocation(toTrackedLocationPoint(latestLocation));
    },
  );
}
