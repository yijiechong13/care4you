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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { loginUser } from "@/services/loginService";

export default function HomeScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({ email, password });
      if (result.success) {
        // Save the ID so the Gatekeeper in _layout.tsx can find it
        await AsyncStorage.setItem("userId", result.user.id.toString());

        // Navigate to the main app
        router.replace("/home");
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

  const handleGuestSignIn = async () => {
    setLoading(true);
    try {
      // For guest mode, you can save a dummy ID or call a guest endpoint
      await AsyncStorage.setItem("userId", "guest_user");
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
    <View style={styles.container}>
      {/* Logo & Header */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/care4youlogo.png")} // Replace with your actual logo path
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
          onPress={() => router.push("/signup")} // ✅ Absolute path to signup
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
    padding: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: "contain",
    marginBottom: -40,
  },

  welcomeText: {
    color: "#FFF",
    fontSize: 18,
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
