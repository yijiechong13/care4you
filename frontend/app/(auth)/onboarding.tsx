import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

type RoleType = "participant" | "volunteer" | "staff";

interface RoleOption {
  id: RoleType;
  titleKey: string;
  descriptionKey: string;
  image: number;
}

const roleData: RoleOption[] = [
  {
    id: "participant",
    titleKey: "onboarding.participant",
    descriptionKey: "onboarding.participantDesc",
    image: require("../../assets/images/participant logo.png"),
  },
  {
    id: "volunteer",
    titleKey: "onboarding.volunteer",
    descriptionKey: "onboarding.volunteerDesc",
    image: require("../../assets/images/volunteer logo.png"),
  },
  {
    id: "staff",
    titleKey: "onboarding.staff",
    descriptionKey: "onboarding.staffDesc",
    image: require("../../assets/images/staff logo.png"),
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();

  const handleRoleSelect = (role: RoleType) => {
    // Navigate to signup with selected role
    router.push({
      pathname: "/signup",
      params: { role },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      {/* Language Toggle */}
      <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
        <Text style={styles.langToggleText}>
          {language === 'en' ? '中文' : 'EN'}
        </Text>
      </TouchableOpacity>

      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/images/care4youlogo.png")}
          style={styles.logo}
        />
        <Text style={styles.tagline}>{t('onboarding.tagline')}</Text>
      </View>

      {/* Role Selection Section */}
      <View style={styles.roleSection}>
        <Text style={styles.roleHeader}>{t('onboarding.iAmA')}</Text>

        {roleData.map((role) => (
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
              <Text style={styles.roleTitle}>{t(role.titleKey)}</Text>
              <Text style={styles.roleDescription}>{t(role.descriptionKey)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#C6D2E2" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer - Login Link */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.footerText}>
          {t('onboarding.alreadyHaveAccount')}{" "}
          <Text style={styles.loginLink} onPress={() => router.push("/login")}>
            {t('onboarding.logIn')}
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
    marginBottom: 32,
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
  langToggle: {
    position: "absolute",
    top: 50,
    right: 22,
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
