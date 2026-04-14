// /Users/macbook/Documents/GitHub/trucklocation/components/LocationPermissionStep.tsx

import { BatteryCharging, LocateFixed, MapPin } from "lucide-react-native";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface LocationPermissionStepProps {
  onRequestLocation: () => void;
  onOpenBatterySettings?: () => void;
}

export function LocationPermissionStep({
  onRequestLocation,
  onOpenBatterySettings,
}: LocationPermissionStepProps) {
  return (
    <View style={[styles.stepContainer, styles.stepContainerCentered]}>
      <View style={styles.stepIconContainer}>
        <LocateFixed size={48} color="#007AFF" />
      </View>
      <Text style={styles.stepTitle}>Байршил идэвхжүүлэх</Text>
      <Text style={styles.stepDescription}>
        Аппликейшнийг ашиглахын тулд та байршил тогтоогчоо идэвхжүүлэх
        шаардлагатай.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onRequestLocation}>
        <MapPin size={20} color="white" />
        <Text style={styles.buttonText}>Байршил зөвшөөрөх</Text>
      </TouchableOpacity>
      {Platform.OS === "android" && onOpenBatterySettings && (
        <>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onOpenBatterySettings}
          >
            <BatteryCharging size={18} color="#1d4ed8" />
            <Text style={styles.secondaryButtonText}>
              Battery тохиргоо нээх
            </Text>
          </TouchableOpacity>
          <Text style={styles.tipText}>
            Samsung/Xiaomi/Vivo утсан дээр App Info -{">"} Battery -{">"}{" "}
            Unrestricted болгож тохируулна уу. &quot;Optimized&quot; хэвээр байвал GPS
            tracking 10-20 минутын дараа зогсож болзошгүй.
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
    paddingHorizontal: Platform.OS === "android" ? 16 : 20,
  },
  stepContainerCentered: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stepIconContainer: {
    width: Platform.OS === "android" ? 88 : 100,
    height: Platform.OS === "android" ? 88 : 100,
    backgroundColor: "#e3f2fd",
    borderRadius: Platform.OS === "android" ? 20 : 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Platform.OS === "android" ? 20 : 32,
  },
  stepTitle: {
    fontSize: Platform.OS === "android" ? 24 : 28,
    fontWeight: "900",
    marginBottom: Platform.OS === "android" ? 10 : 16,
    textAlign: "center",
    maxWidth: 320,
  },
  stepDescription: {
    fontSize: Platform.OS === "android" ? 13 : 14,
    color: "#666",
    textAlign: "center",
    marginBottom: Platform.OS === "android" ? 24 : 32,
    lineHeight: Platform.OS === "android" ? 18 : 20,
    maxWidth: 330,
  },
  button: {
    width: "100%",
    backgroundColor: "#007AFF",
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
  secondaryButton: {
    width: "100%",
    marginTop: 12,
    backgroundColor: "#dbeafe",
    borderWidth: 1,
    borderColor: "#93c5fd",
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: "800",
  },
  tipText: {
    marginTop: 10,
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
