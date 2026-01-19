import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const performGatekeeperCheck = async () => {
      // 1. Always get the LATEST ID directly from storage to avoid state lag
      const userId = await AsyncStorage.getItem("userId");
      const hasUser = !!userId;
      const isGuest = userId?.startsWith("guest_");

      const inTabsGroup = (segments as string[]).includes("(tabs)");
      const inAuthGroup = (segments as string[]).includes("(auth)");

      // 2. Logic: If no ID and trying to access app -> Go to Login
      if (!hasUser && inTabsGroup) {
        router.replace("/login");
      }
      // 3. Logic: If real member (not guest) and trying to access auth -> Go to Home
      // We allow Guests to stay in Auth so they can complete the "Conversion Deal"
      else if (hasUser && !isGuest && inAuthGroup) {
        router.replace("/(tabs)/home");
      }

      // 4. Finally, hide the loading spinner
      setIsReady(true);
    };

    performGatekeeperCheck();
  }, [segments]);

  // 3. Show Loading Spinner while checking storage
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Add your login and signup screens here */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="eventCreation/basicInfo"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="eventCreation/specificInfo"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="eventRegistration/register"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="modal" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
