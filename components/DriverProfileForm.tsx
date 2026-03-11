import { DriverProfile } from "@/types/DriverProfile";
import { Car } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

interface DriverProfileFormProps {
  profile: DriverProfile;
  onUpdate: (updates: Partial<DriverProfile>) => void;
  isEditing?: boolean;
  compact?: boolean;
}

const CAR_NUMBER_RULE = /^\d{4}[A-ZА-ЯӨҮЁ]{3}$/u;

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  rowCompact: {
    marginBottom: 10,
    gap: 8,
  },
  rowStacked: {
    flexDirection: "column",
  },
  half: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 10,
  },
  fieldContainerCompact: {
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  labelRowCompact: {
    gap: 6,
    marginBottom: 6,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    color: "#666",
  },
  input: {
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    minHeight: 46,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    backgroundColor: "#fff",
  },
  inputCompact: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 13,
  },
  helperCard: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  helperText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#475569",
    fontWeight: "500",
    textAlign: "center",
  },
  successText: {
    color: "#15803d",
    fontSize: 11,
    marginTop: 6,
    fontWeight: "700",
    textAlign: "center",
  },
});

export function DriverProfileForm({
  profile,
  onUpdate,
  isEditing = true,
  compact = false,
}: DriverProfileFormProps) {
  const { width } = useWindowDimensions();
  const isNarrowScreen = width <= 360;
  const effectiveCompact = compact || isNarrowScreen;
  const iconSize = effectiveCompact ? 14 : 16;
  const normalizedCarNumber = profile.carNumber
    .replace(/\s+/g, "")
    .toUpperCase();
  const isValidCarNumber = CAR_NUMBER_RULE.test(normalizedCarNumber);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.fieldContainer,
          effectiveCompact && styles.fieldContainerCompact,
        ]}
      >
        <View style={styles.label}>
          <Car size={iconSize} color="#666" />
          <Text style={styles.labelText}>Автомашины дугаар</Text>
        </View>
        <TextInput
          style={[
            styles.input,
            effectiveCompact && styles.inputCompact,
            { textTransform: "uppercase" },
          ]}
          placeholder="Ж нь: 1123УНА"
          value={profile.carNumber}
          onChangeText={(text) =>
            onUpdate({ carNumber: text.replace(/\s+/g, "").toUpperCase() })
          }
          editable={isEditing}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
        />
        <View style={styles.helperCard}>
          <Text style={styles.helperText}>
            Дүрэм: 4 тоо + 3 үсэг оруулна. Development үед кирилл эсвэл англи
            үсэг байж болно. Жишээ: 1123УНА, 1123UNA
          </Text>
        </View>
        {normalizedCarNumber.length > 0 && isValidCarNumber && (
          <Text style={styles.successText}>
            Улсын дугаарын формат зөв байна.
          </Text>
        )}
      </View>
    </View>
  );
}
