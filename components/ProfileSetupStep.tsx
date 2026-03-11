// /Users/macbook/Documents/GitHub/trucklocation/components/ProfileSetupStep.tsx

import { DriverProfileForm } from "@/components/DriverProfileForm";
import { validateDriverProfile } from "@/lib/driver-profile-validation";
import { DriverProfile } from "@/types/DriverProfile";
import { UserCircle2 } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface ProfileSetupStepProps {
  profile: DriverProfile;
  onUpdate: (updates: Partial<DriverProfile>) => void;
  isProfileComplete: boolean;
  onContinue: () => void;
}

export function ProfileSetupStep({
  profile,
  onUpdate,
  isProfileComplete,
  onContinue,
}: ProfileSetupStepProps) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const validationErrors = useMemo(
    () => validateDriverProfile(profile),
    [profile],
  );
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const handleContinue = () => {
    if (hasValidationErrors) {
      Alert.alert(
        "Мэдээлэл буруу байна",
        validationErrors.carNumber ??
          "Талбаруудыг зөв бөглөж дахин оролдоно уу.",
      );
      return;
    }

    Alert.alert(
      "Улсын дугаар баталгаажуулах",
      `Та ${profile.carNumber} гэсэн улсын дугаартай үргэлжлүүлэх үү?`,
      [
        { text: "Засах", style: "cancel" },
        {
          text: "Тийм, зөв",
          onPress: onContinue,
        },
      ],
    );
  };

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () =>
      setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setIsKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepContainer}>
            {!isKeyboardVisible && (
              <View style={styles.headerContainer}>
                <View style={styles.iconContainer}>
                  <UserCircle2 size={32} color="#007AFF" />
                </View>
                <Text style={styles.stepTitle}>Миний мэдээлэл</Text>
                <Text style={styles.stepDescription}>
                  Машины улсын дугаараа оруулаад, эхлэхийн өмнө дахин шалгаж
                  баталгаажуулна уу. Development үед англи үсэг түр зөвшөөрнө.
                </Text>
              </View>
            )}

            <View style={styles.formCard}>
              <DriverProfileForm
                profile={profile}
                onUpdate={onUpdate}
                isEditing={true}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  opacity: !hasValidationErrors && isProfileComplete ? 1 : 0.5,
                  marginTop: 14,
                  marginBottom: Platform.OS === "android" ? 16 : 12,
                },
              ]}
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>Эхлэх</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e7edf4",
    borderRadius: 16,
    padding: 12,
  },
  button: {
    width: "100%",
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
});
