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
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { loginUser } from "@/services/loginService";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();

  // const handleSignIn = async () => {
  //   if (!email || !password) {
  //     Alert.alert("Error", "Please enter your email and password.");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const currentId = await AsyncStorage.getItem("userId");
  //     const result = await loginUser({
  //       email,
  //       password,
  //       guestId: currentId && currentId.startsWith("guest_") ? currentId : null,
  //     });
  //     if (result.success) {
  //       // Save the ID so the Gatekeeper in _layout.tsx can find it
  //       await AsyncStorage.setItem("userId", result.user.id.toString());

  //       // Navigate to the main app
  //       router.replace("/(tabs)/home");
  //       console.log("✅ Backend: Supabase returned rows");
  //     } else {
  //       Alert.alert("Login Failed", result.error);
  //     }
  //   } catch (error) {
  //     Alert.alert("Error", "Could not connect to the server");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.enterEmailPassword'));
      return;
    }

    setLoading(true);
    try {
      const currentId = await AsyncStorage.getItem("userId");
      const result = await loginUser({
        email,
        password,
        guestId:
          currentId && currentId.toString().startsWith("guest_")
            ? currentId
            : null,
      });
      if (result.success) {
        // Save the ID so the Gatekeeper in _layout.tsx can find it
        await AsyncStorage.setItem("userId", result.user.id.toString());

        // Navigate to the main app
        router.replace("/(tabs)/home");
        console.log("✅ Backend: Supabase returned rows");
      } else {
        Alert.alert(t('auth.loginFailed'), result.error);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.couldNotConnect'));
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
      Alert.alert(t('common.error'), t('auth.failedGuestSession'));
    } finally {
      setLoading(false);
    }
  };

  const showPassword = async () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Language Toggle */}
      <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
        <Text style={styles.langToggleText}>
          {language === 'en' ? '中文' : 'EN'}
        </Text>
      </TouchableOpacity>

      {/* Logo & Header */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/care4youlogo.png")}
          style={styles.logo}
        />
        <Text style={styles.welcomeText}>{t('auth.welcomeBack')}</Text>
      </View>

      {/* Input Fields */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.email')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          placeholder={t('auth.emailPlaceholder')}
          placeholderTextColor="#A9A9A9"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.password')}</Text>
          {/* Corrected: Capital 'V' on View and removed individual input margin */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput} // Renamed for clarity
              placeholder={t('auth.passwordPlaceholder')}
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
          <Text style={styles.buttonText}>{t('auth.signIn')}</Text>
        )}
      </TouchableOpacity>

      {/* UPDATED FOOTER SECTION */}
      <Text style={styles.footerText}>
        {t('auth.noAccount')}{" "}
        <Text
          style={styles.signUpText}
          onPress={() => router.push("/onboarding")}
        >
          {t('auth.signUp')}
        </Text>
      </Text>

      {/* GUEST MODE BUTTON */}
      <TouchableOpacity onPress={handleGuestSignIn} style={styles.guestLink}>
        <Text style={styles.guestText}>{t('auth.continueAsGuest')}</Text>
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
  langToggle: {
    position: "absolute",
    top: 50,
    right: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  langToggleText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
