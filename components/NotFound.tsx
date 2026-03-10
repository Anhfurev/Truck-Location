import { FileQuestion, Home } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  iconContainer: {
    width: 100,
    height: 100,
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 300,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function NotFound() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <FileQuestion size={48} color="#ccc" />
      </View>
      <Text style={styles.title}>404</Text>
      <Text style={styles.subtitle}>Хуудас олдсонгүй</Text>
      <Text style={styles.description}>
        Таны хайсан хуудас байхгүй эсвэл өөр тийш нүүсэн байна.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          /* Navigate home */
        }}
      >
        <Home size={20} color="white" />
        <Text style={styles.buttonText}>Нүүр хуудас руу буцах</Text>
      </TouchableOpacity>
    </View>
  );
}
