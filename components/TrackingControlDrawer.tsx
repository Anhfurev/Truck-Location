// /Users/macbook/Documents/GitHub/trucklocation/components/TrackingControlDrawer.tsx

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
}

const PRIMARY_BLUE = "#2563eb";

export function TrackingControlDrawer({
  visible,
  onClose,
  isTracking,
  isBusy = false,
  onToggleTracking,
  locationPopoverMessage,
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
                    Байршлаа диспетчерт илгээх
                  </Text>
                </View>
              </View>
              <RNSwitch
                value={isTracking}
                onValueChange={onToggleTracking}
                disabled={isBusy}
                trackColor={{ false: "#e5e7eb", true: "#22c55e" }}
                thumbColor={isTracking ? "#22c55e" : "#999"}
              />
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
