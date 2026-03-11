// /Users/macbook/Documents/GitHub/trucklocation/components/ProfileSettingsModal.tsx

import { DriverProfileForm } from "@/components/DriverProfileForm";
import { DriverProfile } from "@/types/DriverProfile";
import { CircleAlert, Cpu, LogOut, ShieldCheck, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ProfileSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  profile: DriverProfile;
  onUpdate: (updates: Partial<DriverProfile>) => void;
  onDeleteAccount: () => Promise<void>;
}

const PRIMARY_BLUE = "#2563eb";

export function ProfileSettingsModal({
  visible,
  onClose,
  profile,
  onUpdate,
  onDeleteAccount,
}: ProfileSettingsModalProps) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        style={styles.screen}
        edges={["top", "left", "right", "bottom"]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerEyebrow}>Driver Settings</Text>
                  <Text style={styles.headerTitle}>Жолоочийн тохиргоо</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={20} color="#0f172a" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.formScrollView}
                contentContainerStyle={styles.formScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {!isKeyboardVisible && (
                  <>
                    <View style={styles.heroCard}>
                      <View style={styles.heroTopRow}>
                        <View style={styles.profileAvatar}>
                          {profile.carNumber ? (
                            <Text style={styles.profileAvatarText}>
                              {profile.carNumber.slice(0, 2).toUpperCase()}
                            </Text>
                          ) : (
                            <Cpu size={28} color={PRIMARY_BLUE} />
                          )}
                        </View>
                        <View style={styles.heroTextWrap}>
                          <Text style={styles.profileName}>
                            {profile.carNumber || "Машины профайл"}
                          </Text>
                          <Text style={styles.profileCompany}>
                            {profile.carNumber ||
                              "Улсын дугаар оруулаагүй байна"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.infoRow}>
                        <ShieldCheck size={16} color="#2563eb" />
                        <Text style={styles.infoText}>
                          Эндээс машины улсын дугаараа шинэчилж, background
                          tracking төлөвөө тогтвортой хадгална.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Үндсэн мэдээлэл</Text>
                      <Text style={styles.sectionDescription}>
                        Доорх талбарыг шинэчлэхэд таны tracking профайл шууд
                        хадгалагдана.
                      </Text>
                    </View>
                  </>
                )}

                <View
                  style={[
                    styles.formCard,
                    isKeyboardVisible && styles.formCardKeyboard,
                  ]}
                >
                  <DriverProfileForm
                    profile={profile}
                    onUpdate={onUpdate}
                    isEditing={true}
                  />
                </View>

                {!isKeyboardVisible && (
                  <View style={styles.dangerCard}>
                    <View style={styles.dangerHeader}>
                      <CircleAlert size={18} color="#dc2626" />
                      <Text style={styles.dangerTitle}>Аюултай үйлдэл</Text>
                    </View>
                    <Text style={styles.dangerDescription}>
                      Энэ хэсгийн үйлдлүүд нь профайлын одоогийн төлөвт
                      нөлөөлнө.
                    </Text>

                    <TouchableOpacity
                      style={[styles.secondaryButton, styles.deleteButton]}
                      onPress={() => {
                        Alert.alert(
                          "Профайл устгах уу?",
                          "Хадгалсан улсын дугаар устаж, апп эхний мэдээллийн хэсэг рүү буцна.",
                          [
                            { text: "Болих", style: "cancel" },
                            {
                              text: "Тийм, устга",
                              style: "destructive",
                              onPress: () => {
                                onDeleteAccount().catch((error) => {
                                  console.error(
                                    "Failed to delete profile:",
                                    error,
                                  );
                                });
                              },
                            },
                          ],
                        );
                      }}
                    >
                      <LogOut size={18} color="#b91c1c" />
                      <Text
                        style={[
                          styles.secondaryButtonText,
                          styles.deleteButtonText,
                        ]}
                      >
                        Профайл устгах
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              {!isKeyboardVisible && (
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.button, styles.closeActionButton]}
                    onPress={onClose}
                  >
                    <Text
                      style={[styles.buttonText, styles.closeActionButtonText]}
                    >
                      Хаах
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.button} onPress={onClose}>
                    <Text style={styles.buttonText}>Болсон</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 12 : 55,
  },
  formScrollView: {
    flex: 1,
  },
  formScrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  heroTextWrap: {
    flex: 1,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  profileAvatarText: {
    fontSize: 26,
    fontWeight: "900",
    color: PRIMARY_BLUE,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 2,
    color: "#0f172a",
  },
  profileCompany: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#1e3a8a",
    fontWeight: "600",
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: "#64748b",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 22,
    padding: 14,
    marginBottom: 16,
  },
  formCardKeyboard: {
    marginTop: 8,
  },
  dangerCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 22,
    padding: 14,
    marginBottom: 18,
  },
  dangerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#991b1b",
  },
  dangerDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: "#7f1d1d",
    marginBottom: 12,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: "#f8fafc",
  },
  button: {
    flex: 1,
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 13,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  deleteButton: {
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  deleteButtonText: {
    color: "#b91c1c",
  },
  resetButton: {
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
  },
  closeActionButton: {
    backgroundColor: "#e2e8f0",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  closeActionButtonText: {
    color: "#0f172a",
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});
