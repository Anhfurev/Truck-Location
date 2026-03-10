// /Users/macbook/Documents/GitHub/trucklocation/components/TrackingMap.tsx

import { LiveMap } from "@/components/LiveMap";
import { Activity, ChevronUp } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Switch as RNSwitch,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TrackingMapProps {
  center: [number, number] | null;
  isTracking: boolean;
  isLocating?: boolean;
  isBusy?: boolean;
  onToggleTracking: (value: boolean) => void;
  onOpenDrawer: () => void;
  locationPopoverMessage?: string | null;
}

export function TrackingMap({
  center,
  isTracking,
  isLocating = false,
  isBusy = false,
  onToggleTracking,
  onOpenDrawer,
  locationPopoverMessage,
}: TrackingMapProps) {
  const overlayOpacity = useRef(new Animated.Value(0.22)).current;

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: isTracking ? 0.08 : 0.32,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [isTracking, overlayOpacity]);

  return (
    <View style={styles.mapContainer}>
      <LiveMap
        center={center}
        isTracking={isTracking}
        isLocating={isLocating}
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.mapShade, { opacity: overlayOpacity }]}
      />

      {isTracking && (
        <View style={styles.trackingIndicator}>
          <View style={styles.trackingDot} />
          <Text style={styles.trackingBadgeText}>
            {isBusy ? "Солигдож байна..." : "Хяналт Идэвхтэй"}
          </Text>
        </View>
      )}

      {/* Control Bar */}
      <View style={[styles.controlBar]}>
        {!!locationPopoverMessage && (
          <View style={styles.locationPopover}>
            <Text style={styles.locationPopoverText}>
              {locationPopoverMessage}
            </Text>
          </View>
        )}
        <View style={styles.controlContent}>
          <TouchableOpacity onPress={onOpenDrawer} style={styles.statusLeft}>
            <View
              style={[styles.statusIcon, isTracking && styles.statusIconActive]}
            >
              <Activity size={22} color={isTracking ? "white" : "#64748b"} />
            </View>
            <View>
              <Text style={styles.statusText}>Төлөв</Text>
              <Text style={styles.statusLabel}>
                {isTracking ? "ОНЛАЙН" : "ОФФЛАЙН"}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.statusRight}>
            <RNSwitch
              value={isTracking}
              onValueChange={onToggleTracking}
              disabled={isBusy}
              trackColor={{ false: "#d1d5db", true: "#22c55e" }}
              thumbColor={isTracking ? "#16a34a" : "#94a3b8"}
            />
            <TouchableOpacity onPress={onOpenDrawer}>
              <ChevronUp size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  mapShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  trackingIndicator: {
    position: "absolute",
    top: 20,
    left: "50%",
    transform: [{ translateX: -70 }],
    backgroundColor: "rgba(37, 99, 235, 0.92)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 11,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  trackingBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  controlBar: {
    position: "absolute",
    bottom: 0,
    paddingBottom: 25,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
  locationPopover: {
    alignSelf: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  locationPopoverText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  controlContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    marginRight: 10,
  },
  statusIconActive: {
    backgroundColor: "#2563eb",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 2,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
});
