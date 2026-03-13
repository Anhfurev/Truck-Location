// /Users/macbook/Documents/GitHub/trucklocation/components/TrackingControlDrawer.tsx

import { TrackingDebugStatus } from "@/lib/location-tracking-service";
import { MapPin, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Switch as RNSwitch,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TrackingControlDrawerProps {
  visible: boolean;
  onClose: () => void;
  isTracking: boolean;
  isBusy?: boolean;
  onToggleTracking: (value: boolean) => void;
  locationPopoverMessage?: string | null;
  trackingDebugStatus?: TrackingDebugStatus | null;
}

const PRIMARY_BLUE = "#2563eb";

export function TrackingControlDrawer({
  visible,
  onClose,
  isTracking,
  isBusy = false,
  onToggleTracking,
  locationPopoverMessage,
  trackingDebugStatus,
}: TrackingControlDrawerProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(drawerOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      backdropOpacity.setValue(0);
      drawerOpacity.setValue(0);
    }
  }, [visible, backdropOpacity, drawerOpacity]);

  const formatTime = (value: string | null | undefined) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  };

  const lastPayloadJson = trackingDebugStatus?.lastPayload
    ? JSON.stringify(trackingDebugStatus.lastPayload)
    : "-";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[styles.drawerOverlay, { opacity: backdropOpacity }]}
          />
        </TouchableOpacity>
        <Animated.View style={[styles.drawer, { opacity: drawerOpacity }]}>
          <View style={styles.drawerHandle} />
          <Text style={styles.drawerTitle}>Удирдлага</Text>
          <Text style={styles.drawerDescription}>
            Идэвхтэй хяналтын тохиргоо
          </Text>

          {!!locationPopoverMessage && (
            <View style={styles.locationPopover}>
              <Text style={styles.locationPopoverText}>
                {locationPopoverMessage}
              </Text>
            </View>
          )}

          <View
            style={[styles.drawerCard, isTracking && styles.drawerCardActive]}
          >
            <View style={styles.drawerCardRow}>
              <View style={styles.drawerCardLeft}>
                <View
                  style={[
                    styles.drawerCardIconBox,
                    isTracking && { backgroundColor: "#e3f2fd" },
                  ]}
                >
                  <MapPin
                    size={20}
                    color={isTracking ? PRIMARY_BLUE : "#666"}
                  />
                </View>
                <View>
                  <Text style={styles.drawerCardText}>Байршил илгээх</Text>
                  <Text style={styles.drawerCardSubtext}>
                    {isTracking
                      ? "Идэвхтэй. Хүсвэл notification-оос унтраана."
                      : "Унтраалттай. Эндээс асааж болно."}
                  </Text>
                </View>
              </View>
              <View style={styles.drawerCardSwitchWrap}>
                <RNSwitch
                  value={isTracking}
                  onValueChange={onToggleTracking}
                  disabled={isBusy}
                  trackColor={{ false: "#e5e7eb", true: "#22c55e" }}
                  thumbColor={isTracking ? "#22c55e" : "#999"}
                />
              </View>
            </View>
          </View>

          <View style={[styles.drawerCard, { flexDirection: "row" }]}>
            <ShieldCheck size={20} color={PRIMARY_BLUE} />
            <Text
              style={[
                styles.drawerCardSubtext,
                { fontWeight: "500", marginLeft: 12 },
              ]}
            >
              Мэдээлэл нууцлагдсан. Таны байршлыг зөвхөн эрх бүхий диспетчер
              харах боломжтой.
            </Text>
          </View>

          <View style={styles.debugCard}>
            <Text style={styles.debugTitle}>Тестийн төлөв</Text>
            <Text style={styles.debugLine}>
              Сүүлийн амжилттай илгээлт:{" "}
              {formatTime(trackingDebugStatus?.lastSuccessAt)}
            </Text>
            <Text style={styles.debugLine}>
              Сүүлийн хариу код:{" "}
              {trackingDebugStatus?.lastResponseStatus ?? "-"}
            </Text>
            <Text style={styles.debugLine}>
              Queue болсон payload: {trackingDebugStatus?.queueCount ?? 0}
            </Text>
            <Text style={styles.debugLine}>
              Сүүлийн payload цаг:{" "}
              {trackingDebugStatus?.lastPayload?.timestamp ?? "-"}
            </Text>
            <Text style={styles.debugLine}>
              Сүүлийн payload байршил:{" "}
              {trackingDebugStatus?.lastPayload
                ? `${trackingDebugStatus.lastPayload.latitude}, ${trackingDebugStatus.lastPayload.longitude}`
                : "-"}
            </Text>
            <Text style={styles.debugLine}>
              Endpoint: https://ai-tos.mn/api/gps/data
            </Text>
            <Text style={styles.debugLabel}>Сүүлийн request JSON</Text>
            <Text selectable style={styles.debugPayload}>
              {lastPayloadJson}
            </Text>
            <Text style={styles.debugLabel}>Backend response</Text>
            <Text selectable style={styles.debugPayload}>
              {trackingDebugStatus?.lastResponseText || "-"}
            </Text>
            {!!trackingDebugStatus?.lastError && (
              <Text style={styles.debugError}>
                Сүүлийн алдаа: {trackingDebugStatus.lastError}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, { marginTop: 24 }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Удирдлагыг нуух</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.62)",
  },
  drawer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  drawerDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  locationPopover: {
    alignSelf: "center",
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  locationPopoverText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  drawerCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  drawerCardActive: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
  },
  drawerCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  drawerCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  drawerCardSwitchWrap: {
    alignSelf: "center",
    marginTop: 0,
  },
  drawerCardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  drawerCardText: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  drawerCardSubtext: {
    fontSize: 12,
    color: "#666",
  },
  debugCard: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  debugTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  debugLine: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  debugLabel: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 4,
  },
  debugPayload: {
    color: "#93c5fd",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  debugError: {
    color: "#fca5a5",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  button: {
    width: "100%",
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
