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
  image: number;
}

const roles: RoleOption[] = [
  {
    id: "participant",
    title: "Participant",
    description: "I want to join activities and events",
    image: require("../../assets/images/participant logo.png"),
  },
  {
    id: "volunteer",
    title: "Volunteer",
    description: "I want to help and support events",
    image: require("../../assets/images/volunteer logo.png"),
  },
  {
    id: "staff",
    title: "Staff",
    description: "I organise and manage activities",
    image: require("../../assets/images/staff logo.png"),
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
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/images/care4youlogo.png")}
          style={styles.logo}
        />
        <Text style={styles.tagline}>
          Making a difference together in our {"\n"} community
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
              <Image source={role.image} style={styles.roleIcon} />
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#C6D2E2" />
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
    paddingHorizontal: 22,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 30,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: "contain",
  },
  tagline: {
    color: "rgba(234, 242, 251, 0.82)",
    fontSize: 14,
    textAlign: "center",
    marginTop: -18,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  roleSection: {
    flex: 1,
  },
  roleHeader: {
    color: "#EAF2FB",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 18,
  },
  roleCard: {
    backgroundColor: "#F9FBFF",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    paddingRight: 24,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#0A1E33",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
  },
  roleIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#EEF4FB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  roleIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B2A4A",
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: "#5F6E80",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    color: "#EAF2FB",
    fontSize: 14,
  },
  loginLink: {
    color: "#D8E6F7",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
