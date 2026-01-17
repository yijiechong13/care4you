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

  // 1. Check for existing session on startup
  useEffect(() => {
    const checkUser = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        setHasUser(!!userId); // Converts string to boolean
      } catch (e) {
        console.error("Error checking login state", e);
      } finally {
        setIsReady(true);
      }
    };
    checkUser();
  }, []);

  // 2. Handle Redirection
  useEffect(() => {
    if (!isReady) return;

    // Check if the user is currently in the main app area
    const inAuthGroup = segments[0] === "(tabs)";

    if (!hasUser && inAuthGroup) {
      // No user found? Kick them to login
      router.replace("/login");
    } else if (hasUser && !inAuthGroup) {
      // User found? Send them to home
      router.replace("/(tabs)/home");
    }
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
      <Stack>
        {/* Add your login and signup screens here */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
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
