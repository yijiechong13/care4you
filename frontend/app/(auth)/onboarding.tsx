import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type RoleType = "participant" | "volunteer" | "staff";

interface RoleOption {
  id: RoleType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const roles: RoleOption[] = [
  {
    id: "participant",
    title: "Participant",
    description: "I want to join activities and events",
    icon: "person-outline",
  },
  {
    id: "volunteer",
    title: "Volunteer",
    description: "I want to help and support events",
    icon: "people-outline",
  },
  {
    id: "staff",
    title: "Staff",
    description: "I organise and manage activities",
    icon: "people",
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRoleSelect = (role: RoleType) => {
    // Navigate to signup with selected role
    router.push({
      pathname: "/signup",
      params: { role },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/images/care4youlogo.png")}
          style={styles.logo}
        />
        <Text style={styles.tagline}>
          Making a difference together in our community
        </Text>
      </View>

      {/* Role Selection Section */}
      <View style={styles.roleSection}>
        <Text style={styles.roleHeader}>I am a...</Text>

        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={styles.roleCard}
            onPress={() => handleRoleSelect(role.id)}
            activeOpacity={0.8}
          >
            <View style={styles.roleIconContainer}>
              <Ionicons name={role.icon} size={28} color="#002B5B" />
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#A0AEC0" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer - Login Link */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Text style={styles.loginLink} onPress={() => router.push("/login")}>
            Log In
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#002B5B",
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: "contain",
  },
  tagline: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    textAlign: "center",
    marginTop: -10,
    paddingHorizontal: 20,
  },
  roleSection: {
    flex: 1,
  },
  roleHeader: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  roleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8F4FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#002B5B",
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: "#718096",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  loginLink: {
    color: "#ADD8E6",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
