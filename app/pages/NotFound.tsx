import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Page Not Found</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
});
