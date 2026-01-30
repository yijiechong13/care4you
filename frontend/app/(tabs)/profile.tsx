import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadow,
} from "@/constants/theme";
import { fetchUserProfile, updateUserProfile } from "@/services/userService";
import { fetchUserRegistrations } from "@/services/eventService";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/hooks/useLanguage";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const handleEditProfile = () => {
    if (userData.name === "Guest User") {
      Alert.alert(t('profile.accessDenied'), t('profile.loginToEdit'));
      return;
    }
    setEditName(userData.name);
    setEditPhone(userData.phone);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editPhone.trim()) {
      Alert.alert(t('common.error'), t('profile.namePhoneRequired'));
      return;
    }

    setSaving(true);
    try {
      const result = await updateUserProfile({
        name: editName,
        phone: editPhone,
      });
      if (result.success) {
        setUserData({ ...userData, name: editName, phone: editPhone });
        setIsEditModalVisible(false);
        Alert.alert(t('common.success'), t('profile.profileUpdated'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.failedToUpdate'));
    } finally {
      setSaving(false);
    }
  };

  // Static data for UI building - we will replace this with real data later
  const dummy_data = {
    name: "Guest User",
    email: "guest@email.com",
    phone: "+65 XXXX XXXX",
    stats: { upcoming: 0, registered: 0, total: 0 },
  };

  const handleSignUp = () => {
    router.push({
      pathname: "/signup",
      params: { role: "participant" },
    });
  };

  const handleLogout = async () => {
    // Alert.alert(t('profile.logOut'), t('profile.logOutConfirm'), [
    //   { text: t('common.cancel'), style: "cancel" },
    //   {
    //     text: t('profile.logOut'),
    //     style: "destructive",
    //     onPress: async () => {
    //       await AsyncStorage.removeItem("userId"); //removing userId from device, old registered events gone
    //       router.replace("/login");
    //     },
    //   },
    // ]);

    await AsyncStorage.removeItem("userId"); //removing userId from device, old registered events gone
    router.replace("/login");
  };

  // Inside ProfileScreen component
  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");

        if (!userId || userId.startsWith("guest_")) {
          setUserData(dummy_data);
          setLoading(false);
          return;
        }

        // Only runs if userId exists
        const result = await fetchUserProfile();
        const userEvents = await fetchUserRegistrations(userId);
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        // Upcoming: future events that are not cancelled
        const upcomingCount = userEvents.filter((event: any) => {
          const eventDate = new Date(event.date);
          return eventDate >= now && event.status !== 'cancelled';
        }).length;

        // Total: completed events (date passed + was confirmed, not cancelled)
        const totalCount = userEvents.filter((event: any) => {
          return event.status === 'completed';
        }).length;

        // This Month: completed events in current month
        const monthCount = userEvents.filter((event: any) => {
          const eventDate = new Date(event.date);
          return event.status === 'completed' &&
                 eventDate.getMonth() === thisMonth &&
                 eventDate.getFullYear() === thisYear;
        }).length;

        if (result.success) {
          setUserData({
            ...result.data,
            stats: {
              upcoming: upcomingCount,
              registered: monthCount,
              total: totalCount,
            },
          });
        }

        const { data: userData } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', userId)
          .single();
        const staffRole = userData?.user_type?.toLowerCase() === 'staff';
        setIsStaff(staffRole);
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Could not load profile information.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Guest user - show login prompt
  if (!userData || userData.name === "Guest User") {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestCard}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="person-outline" size={40} color={colors.primary} />
          </View>

          <Text style={styles.guestTitle}>{t('profile.joinCommunity')}</Text>
          <Text style={styles.guestSubtitle}>
            {t('profile.joinSubtitle')}
          </Text>

          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={handleSignUp}
          >
            <Text style={styles.primaryActionText}>{t('profile.createAccount')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.secondaryActionText}>
              {t('profile.alreadyHaveAccount')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Language Section for Guests */}
        <View style={styles.guestLanguageSection}>
          <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
          <View style={styles.languageCard}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'en' && styles.languageOptionActive,
              ]}
              onPress={() => setLanguage('en')}
            >
              <Text
                style={[
                  styles.languageText,
                  language === 'en' && styles.languageTextActive,
                ]}
              >
                {t('profile.english')}
              </Text>
              {language === 'en' && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
            <View style={styles.languageDivider} />
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'zh' && styles.languageOptionActive,
              ]}
              onPress={() => setLanguage('zh')}
            >
              <Text
                style={[
                  styles.languageText,
                  language === 'zh' && styles.languageTextActive,
                ]}
              >
                {t('profile.chinese')}
              </Text>
              {language === 'zh' && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={handleEditProfile}
        >
          <Ionicons name="create-outline" size={22} color={colors.white} />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color={colors.primary} />
            </View>
          </View>
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={14} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Name */}
        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userEmail}>{userData.email}</Text>

        {/* Stats Cards */}
        {!isStaff && (
          <View style={styles.statsContainer}>
            <StatCard number={userData.stats.upcoming} label={t('profile.upcoming')} />
            <StatCard
              number={userData.stats.registered}
              label={t('profile.thisMonth')}
              highlight
            />
            <StatCard number={userData.stats.total} label={t('profile.total')} />
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
        <View style={styles.infoCard}>
          <InfoRow
            icon="person-outline"
            label={t('profile.fullName')}
            value={userData?.name}
          />
          <InfoRow icon="mail-outline" label={t('profile.email')} value={userData?.email} />
          <InfoRow
            icon="call-outline"
            label={t('profile.phone')}
            value={userData?.phone}
            isLast // This is now the last row
          />
        </View>
      </View>

      {/* Language Section */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
        <View style={styles.languageCard}>
          <TouchableOpacity
            style={[
              styles.languageOption,
              language === 'en' && styles.languageOptionActive,
            ]}
            onPress={() => setLanguage('en')}
          >
            <Text
              style={[
                styles.languageText,
                language === 'en' && styles.languageTextActive,
              ]}
            >
              {t('profile.english')}
            </Text>
            {language === 'en' && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
          <View style={styles.languageDivider} />
          <TouchableOpacity
            style={[
              styles.languageOption,
              language === 'zh' && styles.languageOptionActive,
            ]}
            onPress={() => setLanguage('zh')}
          >
            <Text
              style={[
                styles.languageText,
                language === 'zh' && styles.languageTextActive,
              ]}
            >
              {t('profile.chinese')}
            </Text>
            {language === 'zh' && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Actions Section */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutButtonText}>{t('profile.logOut')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.editProfile')}</Text>

            <Text style={styles.inputLabel}>{t('profile.fullName').toUpperCase()}</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.inputLabel}>{t('profile.emailNonEditable').toUpperCase()}</Text>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: "#f0f0f0", color: "#999" },
              ]}
              value={userData.email}
              editable={false}
            />

            <Text style={styles.inputLabel}>{t('profile.phoneNumber').toUpperCase()}</Text>
            <TextInput
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProfile}
                style={styles.saveBtn}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: "#FFF" }}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Stat Card Component
function StatCard({
  number,
  label,
  highlight = false,
}: {
  number: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <Text
        style={[styles.statNumber, highlight && styles.statNumberHighlight]}
      >
        {number}
      </Text>
      <Text style={[styles.statLabel, highlight && styles.statLabelHighlight]}>
        {label}
      </Text>
    </View>
  );
}

// Info Row Component
function InfoRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingBottom: spacing.xxl,
    alignItems: "center",
    borderBottomLeftRadius: borderRadius.xl * 2,
    borderBottomRightRadius: borderRadius.xl * 2,
  },
  editProfileButton: {
    position: "absolute",
    top: 60,
    right: spacing.xl,
    padding: spacing.sm,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing.md,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    padding: 4,
  },
  avatar: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: fontSize.md,
    color: "rgba(255,255,255,0.7)",
    marginBottom: spacing.xl,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: width * 0.25,
    alignItems: "center",
  },
  statCardHighlight: {
    backgroundColor: colors.white,
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  statNumberHighlight: {
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  statLabelHighlight: {
    color: colors.gray[500],
  },
  infoSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    ...shadow.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[400],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.gray[700],
  },
  actionsSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadow.sm,
  },
  logoutButtonText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: "#DC2626",
    marginLeft: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 25,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
    marginTop: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    flex: 0.45,
    alignItems: "center",
  },
  cancelBtn: {
    padding: 15,
    flex: 0.45,
    alignItems: "center",
  },
  guestContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing.xl,
  },
  guestCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    ...shadow.md, // Uses your theme's shadow
  },
  guestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`, // Light version of primary
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  guestTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  guestSubtitle: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
    width: "100%",
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  primaryActionText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  secondaryActionBtn: {
    width: "100%",
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  secondaryActionText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  guestLanguageSection: {
    marginTop: spacing.xxl,
  },
  languageCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    ...shadow.md,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  languageOptionActive: {
    backgroundColor: `${colors.primary}08`,
  },
  languageText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.gray[500],
  },
  languageTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  languageDivider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginHorizontal: spacing.lg,
  },
});
