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
import { signupUser } from "../../services/signupService";
import { useRouter } from "expo-router";

export default function HomeScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const router = useRouter();

  const handleCreateAccount = async () => {
    if (!email || !name || !retypePassword || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== retypePassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const userData = {
        name: name,
        email: email,
        password: password,
        user_type: "member", // Setting them as a registered member
      };

      // Call your API
      const result = await signupUser(userData);

      // CHECK THIS LINE:
      if (result && result.user && result.user.id) {
        // This is what puts it in Chrome's "Application" tab
        await AsyncStorage.setItem("userId", result.user.id.toString());

        // Then move to the app
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message);
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
        <Text style={styles.label}>FULL NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#A9A9A9"
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
        />

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
              placeholder="Create a secure password"
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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>CONFIRM PASSWORD</Text>
          {/* Corrected: Capital 'V' on View and removed individual input margin */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput} // Renamed for clarity
              placeholder="Re-enter your password"
              placeholderTextColor="#A9A9A9"
              value={retypePassword}
              onChangeText={setRetypePassword}
              secureTextEntry
            />
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={styles.signInButton}
        onPress={handleCreateAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      {/* UPDATED FOOTER SECTION */}
      <Text style={styles.footerText}>
        Already have an account? <Text style={styles.signUpText}></Text>
        <Text
          style={styles.signUpText}
          onPress={() => router.push("/login")} // ✅ Absolute path to login
        >
          Log In
        </Text>
      </Text>
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
