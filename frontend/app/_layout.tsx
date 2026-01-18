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
  const [hasUser, setHasUser] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const userId = await AsyncStorage.getItem("userId");
      setHasUser(!!userId); // true if ID exists
      setIsReady(true);
    };
    checkUser();
  }, [segments]); // 🚀 KEY: Re-check storage whenever the path changes

  useEffect(() => {
    if (!isReady) return;

    // Use .includes to catch your folder groups safely
    const inTabsGroup = (segments as string[]).includes("(tabs)");
    const inAuthGroup = (segments as string[]).includes("(auth)");

    if (!hasUser && inTabsGroup) {
      // No user? Stay at/go to login
      router.replace("/login");
    } else if (hasUser && inAuthGroup) {
      // User found but on auth screens (login/signup)? Force them into the app
      router.replace("/home");
    }
    // Allow logged-in users to access eventCreation, eventRegistration, etc.
  }, [hasUser, segments, isReady]);

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
        <Stack.Screen name="eventCreation/basicInfo" options={{ headerShown: false }} />
        <Stack.Screen name="eventCreation/specificInfo" options={{ headerShown: false }} />
        <Stack.Screen name="eventRegistration/register" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
