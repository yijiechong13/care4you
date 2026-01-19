import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loginUser } from "@/services/loginService";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const currentId = await AsyncStorage.getItem("userId");
      const result = await loginUser({
        email,
        password,
        guestId: currentId && currentId.startsWith("guest_") ? currentId : null,
      });
      if (result.success) {
        // Save the ID so the Gatekeeper in _layout.tsx can find it
        await AsyncStorage.setItem("userId", result.user.id.toString());

        // Navigate to the main app
        router.replace("/(tabs)/home");
        console.log("✅ Backend: Supabase returned rows");
      } else {
        Alert.alert("Login Failed", result.error);
      }
    } catch (error) {
      Alert.alert("Error", "Could not connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const generateGuestId = () => {
    const timestamp = Date.now().toString(36); // Base36 shortens the timestamp
    const randomPart = Math.random().toString(36).substring(2, 9); // Random 7-character string
    return `guest_${timestamp}_${randomPart}`; // e.g., guest_m4p2z9x1_7v2k8wq
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    try {
      // For guest mode, you can save a dummy ID or call a guest endpoint
      const uniqueGuestId = generateGuestId();
      await AsyncStorage.setItem("userId", uniqueGuestId);
      router.replace("/(tabs)/home"); // Navigate using Expo Router
    } catch (error) {
      Alert.alert("Error", "Failed to start guest session");
    } finally {
      setLoading(false);
    }
  };

  const showPassword = async () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Logo & Header */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/care4youlogo.png")}
          style={styles.logo}
        />
        <Text style={styles.welcomeText}>Welcome back!</Text>
      </View>

      {/* Input Fields */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          placeholder="Enter your email"
          placeholderTextColor="#A9A9A9"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>PASSWORD</Text>
          {/* Corrected: Capital 'V' on View and removed individual input margin */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput} // Renamed for clarity
              placeholder="Enter your password"
              placeholderTextColor="#A9A9A9"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
            />
            <Pressable onPress={showPassword} style={styles.toggleButton}>
              <MaterialCommunityIcons
                name={secureTextEntry ? "eye-off" : "eye"}
                size={24}
                color="gray"
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={styles.signInButton}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      {/* UPDATED FOOTER SECTION */}
      <Text style={styles.footerText}>
        Don't have an account?{" "}
        <Text
          style={styles.signUpText}
          onPress={() => router.push("/onboarding")} // ✅ Absolute path to onboarding
        >
          Sign up
        </Text>
      </Text>

      {/* GUEST MODE BUTTON */}
      <TouchableOpacity onPress={handleGuestSignIn} style={styles.guestLink}>
        <Text style={styles.guestText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#002B5B",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: "contain",
  },
  welcomeText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    textAlign: "center",
    marginTop: -10,
  },
  inputContainer: {
    marginBottom: 20,
  },

  label: {
    color: "#FFF",
    fontWeight: "bold",
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    color: "#000",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF", // Move white background here
    borderRadius: 10,
    paddingHorizontal: 10, // Space for the icon
    marginBottom: 20, // Margin belongs on the container now
  },
  passwordInput: {
    flex: 1, // Takes up all space except the icon
    paddingVertical: 15,
    paddingHorizontal: 5,
    fontSize: 16,
    color: "#000",
  },
  toggleButton: {
    padding: 10,
  },

  signInButton: {
    backgroundColor: "#6D7E8E", // Gray-ish blue from your image
    borderRadius: 10,
    padding: 18,
    alignItems: "center",
    elevation: 5,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 18,
  },
  footerText: {
    color: "#FFF",
    textAlign: "center",
    marginTop: 20,
  },
  signUpText: {
    color: "#ADD8E6",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  guestLink: {
    marginTop: 30,
    alignItems: "center",
  },
  guestText: {
    color: "#4FA8FF",
    textDecorationLine: "underline",
  },
});
