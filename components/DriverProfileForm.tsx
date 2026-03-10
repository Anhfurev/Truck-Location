import { DriverProfile } from "@/types/DriverProfile";
import { Building2, Car, FileText, Phone, User } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

interface DriverProfileFormProps {
  profile: DriverProfile;
  onUpdate: (updates: Partial<DriverProfile>) => void;
  isEditing?: boolean;
  compact?: boolean;
  hideBio?: boolean;
  errors?: Partial<Record<keyof DriverProfile, string>>;
}

const COMPANIES = [
  "Свифт Ложистик",
  "Улаанбаатар Экспресс",
  "Эко Транс",
  "Блью Скай",
  "Глобал Вэй",
];

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
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  textArea: {
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: "#fff",
    minHeight: 84,
    maxHeight: 84,
    textAlignVertical: "top",
  },
  textAreaCompact: {
    minHeight: 74,
    maxHeight: 74,
    fontSize: 13,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  chipsWrapCompact: {
    gap: 8,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#eef2f7",
    borderWidth: 1,
    borderColor: "#dbe4ee",
  },
  chipCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  chipText: {
    color: "#1f2937",
    fontSize: 11,
    fontWeight: "600",
  },
  chipTextCompact: {
    fontSize: 11,
  },
  chipTextSelected: {
    color: "white",
  },
});

export function DriverProfileForm({
  profile,
  onUpdate,
  isEditing = true,
  compact = false,
  hideBio = false,
  errors = {},
}: DriverProfileFormProps) {
  const { width } = useWindowDimensions();
  const isNarrowScreen = width <= 360;
  const effectiveCompact = compact || isNarrowScreen;
  const iconSize = effectiveCompact ? 14 : 16;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.row,
          effectiveCompact && styles.rowCompact,
          isNarrowScreen && styles.rowStacked,
        ]}
      >
        <View style={styles.half}>
          <View
            style={[
              styles.labelRow,
              effectiveCompact && styles.labelRowCompact,
            ]}
          >
            <User size={iconSize} color="#666" />
            <Text style={styles.labelText}>Овог</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              effectiveCompact && styles.inputCompact,
              !!errors.lastName && styles.inputError,
            ]}
            placeholder="Овог"
            value={profile.lastName}
            onChangeText={(text) => onUpdate({ lastName: text })}
            editable={isEditing}
          />
          {!!errors.lastName && (
            <Text style={styles.errorText}>{errors.lastName}</Text>
          )}
        </View>

        <View style={styles.half}>
          <View
            style={[
              styles.labelRow,
              effectiveCompact && styles.labelRowCompact,
            ]}
          >
            <User size={iconSize} color="#666" />
            <Text style={styles.labelText}>Нэр</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              effectiveCompact && styles.inputCompact,
              !!errors.firstName && styles.inputError,
            ]}
            placeholder="Нэр"
            value={profile.firstName}
            onChangeText={(text) => onUpdate({ firstName: text })}
            editable={isEditing}
          />
          {!!errors.firstName && (
            <Text style={styles.errorText}>{errors.firstName}</Text>
          )}
        </View>
      </View>

      <View
        style={[
          styles.fieldContainer,
          effectiveCompact && styles.fieldContainerCompact,
        ]}
      >
        <View style={styles.label}>
          <Phone size={iconSize} color="#666" />
          <Text style={styles.labelText}>Утасны дугаар</Text>
        </View>
        <TextInput
          style={[
            styles.input,
            effectiveCompact && styles.inputCompact,
            !!errors.phone && styles.inputError,
          ]}
          placeholder="Утасны дугаар..."
          value={profile.phone}
          onChangeText={(text) => onUpdate({ phone: text })}
          editable={isEditing}
          keyboardType="phone-pad"
        />
        {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

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
            !!errors.carPlate && styles.inputError,
            { textTransform: "uppercase" },
          ]}
          placeholder="Ж нь: 1234 УБА"
          value={profile.carPlate}
          onChangeText={(text) => onUpdate({ carPlate: text.toUpperCase() })}
          editable={isEditing}
          autoCapitalize="characters"
        />
        {!!errors.carPlate && (
          <Text style={styles.errorText}>{errors.carPlate}</Text>
        )}
      </View>

      <View
        style={[
          styles.fieldContainer,
          effectiveCompact && styles.fieldContainerCompact,
        ]}
      >
        <View style={styles.label}>
          <Building2 size={iconSize} color="#666" />
          <Text style={styles.labelText}>Ажилладаг компани</Text>
        </View>
        <View
          style={[
            styles.chipsWrap,
            effectiveCompact && styles.chipsWrapCompact,
          ]}
        >
          {COMPANIES.map((company) => (
            <TouchableOpacity
              key={company}
              onPress={() => onUpdate({ company })}
              style={[
                styles.chip,
                effectiveCompact && styles.chipCompact,
                profile.company === company && styles.chipSelected,
              ]}
              disabled={!isEditing}
            >
              <Text
                style={[
                  styles.chipText,
                  effectiveCompact && styles.chipTextCompact,
                  profile.company === company && styles.chipTextSelected,
                ]}
              >
                {company}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {!!errors.company && (
          <Text style={styles.errorText}>{errors.company}</Text>
        )}
      </View>

      {!hideBio && (
        <View
          style={[
            styles.fieldContainer,
            effectiveCompact && styles.fieldContainerCompact,
          ]}
        >
          <View style={styles.label}>
            <FileText size={iconSize} color="#666" />
            <Text style={styles.labelText}>Нэмэлт тайлбар</Text>
          </View>
          <TextInput
            style={[
              styles.textArea,
              effectiveCompact && styles.textAreaCompact,
            ]}
            placeholder="Өөрийн тухай товч мэдээлэл..."
            value={profile.bio}
            onChangeText={(text) => onUpdate({ bio: text })}
            editable={isEditing}
            multiline
          />
        </View>
      )}
    </View>
  );
}
