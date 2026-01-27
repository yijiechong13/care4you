import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { signupUser } from "../../services/signupService";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();

  const handleCreateAccount = async () => {
    // 1. Validation
    if (!email || !name || !retypePassword || !phone || !password) {
      Alert.alert(t('common.error'), t('signup.fillAllFields'));
      return;
    }

    if (password !== retypePassword) {
      Alert.alert(t('common.error'), t('signup.passwordsNoMatch'));
      return;
    }

    setLoading(true);
    try {
      // 2. Retrieve the Guest ID for the "Conversion Deal"
      const currentGuestId = await AsyncStorage.getItem("userId");
      const isGuest = currentGuestId && currentGuestId.startsWith("guest_");

      const userData = {
        name,
        email,
        password,
        phone,
        user_type: role || "participant",
        guestId: isGuest ? currentGuestId : null, // Send to backend for migration
      };

      // 3. Call API
      const result = await signupUser(userData);

      if (result && result.user && result.user.id) {
        // 4. Overwrite Guest ID with permanent User ID
        await AsyncStorage.setItem("userId", result.user.id.toString());
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      Alert.alert(t('signup.signUpFailed'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#002B5B" }}>
      <KeyboardAvoidingView
        style={styles.mainWrapper}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: insets.top + 20, paddingBottom: 60 },
            ]}
          >
            {/* Header Section */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
                <Text style={styles.langToggleText}>
                  {language === 'en' ? '中文' : 'EN'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.header}>
              <Image
                source={require("../../assets/images/care4youlogo.png")}
                style={styles.logo}
              />
              <Text style={styles.welcomeText}>{t('signup.createYourAccount')}</Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <Text style={styles.label}>{t('signup.fullName')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('signup.namePlaceholder')}
                placeholderTextColor="#A9A9A9"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>{t('signup.email')}</Text>
              <TextInput
                style={styles.input}
                keyboardType="email-address"
                placeholder={t('signup.emailPlaceholder')}
                placeholderTextColor="#A9A9A9"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />

              <Text style={styles.label}>{t('signup.phone')}</Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                placeholder={t('signup.phonePlaceholder')}
                placeholderTextColor="#A9A9A9"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.label}>{t('signup.password')}</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('signup.passwordPlaceholder')}
                  placeholderTextColor="#A9A9A9"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureTextEntry}
                />
                <Pressable
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  style={styles.toggleIcon}
                >
                  <MaterialCommunityIcons
                    name={secureTextEntry ? "eye-off" : "eye"}
                    size={22}
                    color="gray"
                  />
                </Pressable>
              </View>

              <Text style={styles.label}>{t('signup.confirmPassword')}</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('signup.confirmPasswordPlaceholder')}
                  placeholderTextColor="#A9A9A9"
                  value={retypePassword}
                  onChangeText={setRetypePassword}
                  secureTextEntry={true}
                />
              </View>
            </View>

            {/* Submit Action */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateAccount}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>{t('signup.createAccount')}</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footerText}>
              {t('signup.alreadyHaveAccount')}{" "}
              <Text
                style={styles.linkText}
                onPress={() => router.push("/login")}
              >
                {t('signup.logIn')}
              </Text>
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: "#002B5B",
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  backButton: {
    padding: 8,
    alignSelf: "flex-start",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  welcomeText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 18,
    fontWeight: "600",
    marginTop: -10,
  },
  formContainer: {
    width: "100%",
  },
  label: {
    color: "#FFF",
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 12,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 18,
    fontSize: 16,
    color: "#000",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginBottom: 18,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#000",
  },
  toggleIcon: {
    paddingRight: 15,
  },
  submitButton: {
    backgroundColor: "#6D7E8E",
    borderRadius: 10,
    padding: 18,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  footerText: {
    color: "#FFF",
    textAlign: "center",
    marginTop: 25,
    fontSize: 14,
  },
  linkText: {
    color: "#ADD8E6",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  langToggle: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  langToggleText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
