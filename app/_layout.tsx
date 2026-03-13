// Register background location task before any component renders.
// Expo / Android require tasks to be defined synchronously at the module level,
// prior to React rendering – this import satisfies that requirement and also
// ensures the task handler is ready when the OS wakes the app in the background
// (e.g. after the user has closed the app but the foreground service is still
// running, or when the app is relaunched by the OS for a pending location event).
import "@/lib/location-tracking-service";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
