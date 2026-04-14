import { buildDriverLocationPayload } from "@/lib/driver-location-payload";
import { isDriverProfileValid } from "@/lib/driver-profile-validation";
import {
  setNativeTrackingEnabled,
  startNativePersistentService,
  stopNativePersistentService,
} from "@/modules/tracking-native/src";
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
const TRACKING_PROFILE_SNAPSHOT_STORAGE_KEY = "tracking_profile_snapshot";
const TRACKING_ENABLED_STORAGE_KEY = "tracking_enabled";
const LAST_LOCATION_STORAGE_KEY = "last_known_location";
const LAST_PAYLOAD_STORAGE_KEY = "last_sent_payload";
const PENDING_PAYLOADS_STORAGE_KEY = "pending_gps_payloads";
const TRACKING_DEBUG_STATUS_KEY = "tracking_debug_status";
const TRACKING_RETRY_STATE_KEY = "tracking_retry_state";
const GPS_ENDPOINT = "https://ai-tos.mn/api/gps/data";
const MAX_QUEUE_SIZE = 120;
const BACKGROUND_ACCEPTABLE_ACCURACY_METERS = 150;
const GPS_REQUEST_TIMEOUT_MS = 15000;
const INITIAL_RETRY_BACKOFF_MS = 5000;
const MAX_RETRY_BACKOFF_MS = 60000;

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

let consecutivePostFailures = 0;
let nextRetryAt = 0;
let retryStateHydrated = false;

interface TrackingRetryState {
  consecutivePostFailures: number;
  nextRetryAt: number;
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

function getDefaultTrackingRetryState(): TrackingRetryState {
  return {
    consecutivePostFailures: 0,
    nextRetryAt: 0,
  };
}

function sanitizeTrackingRetryState(input: unknown): TrackingRetryState {
  const source =
    input && typeof input === "object"
      ? (input as Partial<TrackingRetryState>)
      : {};

  return {
    consecutivePostFailures:
      typeof source.consecutivePostFailures === "number" &&
      Number.isFinite(source.consecutivePostFailures)
        ? source.consecutivePostFailures
        : 0,
    nextRetryAt:
      typeof source.nextRetryAt === "number" &&
      Number.isFinite(source.nextRetryAt)
        ? source.nextRetryAt
        : 0,
  };
}

async function ensureRetryStateHydrated(): Promise<void> {
  if (retryStateHydrated) {
    return;
  }

  const rawRetryState = await AsyncStorage.getItem(TRACKING_RETRY_STATE_KEY);
  const retryState = sanitizeTrackingRetryState(
    parseJson(rawRetryState, getDefaultTrackingRetryState()),
  );

  consecutivePostFailures = retryState.consecutivePostFailures;
  nextRetryAt = retryState.nextRetryAt;
  retryStateHydrated = true;
}

async function persistRetryState(): Promise<void> {
  await AsyncStorage.setItem(
    TRACKING_RETRY_STATE_KEY,
    JSON.stringify({
      consecutivePostFailures,
      nextRetryAt,
    } satisfies TrackingRetryState),
  );
}

async function getRetryBackoffRemainingMs(): Promise<number> {
  await ensureRetryStateHydrated();
  return Math.max(0, nextRetryAt - Date.now());
}

async function resetRetryBackoff(): Promise<void> {
  await ensureRetryStateHydrated();
  consecutivePostFailures = 0;
  nextRetryAt = 0;
  await AsyncStorage.removeItem(TRACKING_RETRY_STATE_KEY);
}

async function scheduleRetryBackoff(): Promise<number> {
  await ensureRetryStateHydrated();
  consecutivePostFailures += 1;

  const delayMs = Math.min(
    INITIAL_RETRY_BACKOFF_MS * 2 ** Math.max(0, consecutivePostFailures - 1),
    MAX_RETRY_BACKOFF_MS,
  );

  nextRetryAt = Date.now() + delayMs;
  await persistRetryState();
  return delayMs;
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
          carNumber?: string;
          deviceId?: string;
        })
      : {};

  return {
    carNumber: sanitizeText(source.carNumber ?? source.carNumber)
      .replace(/\s+/g, "")
      .toUpperCase(),
    deviceId: sanitizeText(source.deviceId),
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

function asFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeDriverLocationPayload(
  input: unknown,
): DriverLocationPayload | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const source = input as Partial<DriverLocationPayload> & {
    other?: Partial<DriverLocationPayload["other"]> | null;
  };

  if (
    typeof source.carNumber !== "string" ||
    typeof source.deviceId !== "string" ||
    typeof source.timestamp !== "string" ||
    typeof source.latitude !== "number" ||
    typeof source.longitude !== "number"
  ) {
    return null;
  }

  const other: Partial<DriverLocationPayload["other"]> = source.other ?? {};

  return {
    carNumber: source.carNumber,
    deviceId: source.deviceId,
    timestamp: source.timestamp,
    latitude: source.latitude,
    longitude: source.longitude,
    speed: typeof source.speed === "number" ? source.speed : null,
    headingDegree:
      typeof source.headingDegree === "number" ? source.headingDegree : null,
    other: {
      ignitionStatus:
        typeof other.ignitionStatus === "boolean" ? other.ignitionStatus : true,
      batteryVoltage: asFiniteNumber(other.batteryVoltage, 12.6),
      gpsAccuracyHdop: asFiniteNumber(other.gpsAccuracyHdop, 0.8),
      satellitesInView: asFiniteNumber(other.satellitesInView, 12),
      gsmSignalStrengthDbm: asFiniteNumber(other.gsmSignalStrengthDbm, -92),
      eventCode: asFiniteNumber(other.eventCode, 102),
    },
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

async function getStoredTrackingProfileSnapshot(): Promise<DriverProfile | null> {
  const rawProfile = await AsyncStorage.getItem(
    TRACKING_PROFILE_SNAPSHOT_STORAGE_KEY,
  );
  const profile = sanitizeProfile(parseJson(rawProfile, {}));

  return isDriverProfileValid(profile) ? profile : null;
}

async function getPendingPayloads(): Promise<DriverLocationPayload[]> {
  const rawQueue = await AsyncStorage.getItem(PENDING_PAYLOADS_STORAGE_KEY);
  const queue = parseJson<unknown[]>(rawQueue, []);

  if (!Array.isArray(queue)) {
    return [];
  }

  return queue
    .map((payload) => sanitizeDriverLocationPayload(payload))
    .filter((payload): payload is DriverLocationPayload => payload !== null);
}

async function setPendingPayloads(
  payloads: DriverLocationPayload[],
): Promise<void> {
  const trimmedPayloads = payloads.slice(-MAX_QUEUE_SIZE);

  if (payloads.length === 0) {
    await AsyncStorage.removeItem(PENDING_PAYLOADS_STORAGE_KEY);
    await updateTrackingDebugStatus({ queueCount: 0 });
    return;
  }

  if (trimmedPayloads.length !== payloads.length) {
    debugTrackingLog("trimmed pending payload queue", {
      previousCount: payloads.length,
      keptCount: trimmedPayloads.length,
      droppedCount: payloads.length - trimmedPayloads.length,
    });
  }

  await AsyncStorage.setItem(
    PENDING_PAYLOADS_STORAGE_KEY,
    JSON.stringify(trimmedPayloads),
  );
  await updateTrackingDebugStatus({
    queueCount: trimmedPayloads.length,
  });
}

async function postPayload(payload: DriverLocationPayload): Promise<void> {
  const normalizedPayload = sanitizeDriverLocationPayload(payload);

  if (!normalizedPayload) {
    throw new Error("GPS payload is invalid");
  }

  await updateTrackingDebugStatus({
    lastAttemptAt: new Date().toISOString(),
    lastPayload: normalizedPayload,
    lastResponseStatus: null,
    lastResponseText: null,
    lastError: null,
  });

  debugTrackingLog("POST gps payload", {
    endpoint: GPS_ENDPOINT,
    carNumber: normalizedPayload.carNumber,
    timestamp: normalizedPayload.timestamp,
    latitude: normalizedPayload.latitude,
    longitude: normalizedPayload.longitude,
    other: normalizedPayload.other,
  });
  debugTrackingLog(
    "POST gps payload body",
    formatPayloadForDebug(normalizedPayload),
  );

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, GPS_REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(GPS_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedPayload),
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `GPS API request timed out after ${GPS_REQUEST_TIMEOUT_MS}ms`
        : error instanceof Error
          ? error.message
          : String(error);
    const retryInMs = await scheduleRetryBackoff();

    await updateTrackingDebugStatus({
      lastFailureAt: new Date().toISOString(),
      lastResponseStatus: null,
      lastResponseText: null,
      lastError: `${message} (retry in ${retryInMs}ms)`,
    });

    debugTrackingLog("retry backoff scheduled", {
      retryInMs,
      consecutivePostFailures,
      reason: message,
    });

    throw new Error(message);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const message = `GPS API request failed (${response.status}): ${errorText || "unknown"}`;
    const retryInMs = await scheduleRetryBackoff();

    await updateTrackingDebugStatus({
      lastFailureAt: new Date().toISOString(),
      lastResponseStatus: response.status,
      lastResponseText: errorText || null,
      lastError: `${message} (retry in ${retryInMs}ms)`,
    });

    debugTrackingLog("retry backoff scheduled", {
      retryInMs,
      consecutivePostFailures,
      reason: message,
    });

    throw new Error(message);
  }

  const responseText = await response.text().catch(() => "");

  await AsyncStorage.setItem(
    LAST_PAYLOAD_STORAGE_KEY,
    JSON.stringify(normalizedPayload),
  );
  await updateTrackingDebugStatus({
    lastSuccessAt: new Date().toISOString(),
    lastResponseStatus: response.status,
    lastResponseText: responseText || null,
    lastError: null,
  });
  await resetRetryBackoff();
  debugTrackingLog("POST gps payload success", {
    status: response.status,
    carNumber: normalizedPayload.carNumber,
    timestamp: normalizedPayload.timestamp,
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
  // Mirror to Android SharedPreferences so BootReceiver can read the state
  // after a reboot without requiring the JS runtime to be running first.
  setNativeTrackingEnabled(enabled).catch(() => undefined);

  if (enabled) {
    const profile = await getStoredProfile();
    if (profile) {
      await AsyncStorage.setItem(
        TRACKING_PROFILE_SNAPSHOT_STORAGE_KEY,
        JSON.stringify(profile),
      );
    }
    const carNumber = profile?.carNumber?.trim() ?? "";
    const notificationTitle = carNumber
      ? `${carNumber} байршил хуваалцаж байна`
      : "Truck Location идэвхтэй байна";
    const notificationBody = carNumber
      ? "Систем таны байршлыг тасралтгүй хянаж байна."
      : "Систем таны байршлыг тасралтгүй хянаж байна.";

    startNativePersistentService(notificationTitle, notificationBody).catch(
      () => undefined,
    );
    return;
  }

  stopNativePersistentService().catch(() => undefined);
  AsyncStorage.removeItem(TRACKING_PROFILE_SNAPSHOT_STORAGE_KEY).catch(
    () => undefined,
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

    const retryBackoffRemainingMs = await getRetryBackoffRemainingMs();
    if (retryBackoffRemainingMs > 0) {
      debugTrackingLog("flush pending payloads deferred", {
        count: queue.length,
        retryInMs: retryBackoffRemainingMs,
      });
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

  const profile =
    (await getStoredProfile()) ?? (await getStoredTrackingProfileSnapshot());
  if (!profile) {
    debugTrackingLog("skip tracked location because profile is incomplete");
    return null;
  }

  const payload = buildDriverLocationPayload({ location, profile });
  debugTrackingLog("built gps payload", formatPayloadForDebug(payload));
  await enqueueSync(async () => {
    const queue = await getPendingPayloads();
    let unsentQueue = [...queue];

    const retryBackoffRemainingMs = await getRetryBackoffRemainingMs();
    if (retryBackoffRemainingMs > 0) {
      const nextQueue = [...unsentQueue, payload].slice(-MAX_QUEUE_SIZE);
      await setPendingPayloads(nextQueue);
      debugTrackingLog("queued payload during retry backoff", {
        queueSize: nextQueue.length,
        retryInMs: retryBackoffRemainingMs,
        timestamp: payload.timestamp,
      });
      return;
    }

    if (queue.length > 0) {
      const remainingPayloads: DriverLocationPayload[] = [];

      for (let index = 0; index < queue.length; index += 1) {
        const queuedPayload = queue[index];

        try {
          await postPayload(queuedPayload);
        } catch (error) {
          remainingPayloads.push(...queue.slice(index));
          await setPendingPayloads([...remainingPayloads, payload]);
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
