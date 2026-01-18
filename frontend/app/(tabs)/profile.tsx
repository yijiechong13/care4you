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

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleEditProfile = () => {
    if (userData.name === "Guest User") {
      Alert.alert("Access Denied", "Please log in to edit your profile.");
      return;
    }
    setEditName(userData.name);
    setEditPhone(userData.phone);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editPhone.trim()) {
      Alert.alert("Error", "Name and Phone cannot be empty.");
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
        Alert.alert("Success", "Profile updated successfully!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update profile.");
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

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("userId"); //removing userId from device, old registered events gone
          router.replace("/onboarding");
        },
      },
    ]);
  };

  // Inside ProfileScreen component
  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");

        if (userId === "guest_user" || !userId) {
          // It's a guest! Set data and STOP here.
          setUserData(dummy_data);
          setLoading(false);
          return; // This return is crucial
        }

        // Only runs if userId exists
        const result = await fetchUserProfile();
        const userEvents = await fetchUserRegistrations(userId);
        const upcomingCount = userEvents.filter((event: any) => {
          const eventDate = new Date(event.date);
          const now = new Date();
          return eventDate >= now;
        }).length;
        const totalCount = userEvents.length;
        const thisMonth = new Date();
        const monthCount = userEvents.filter((event: any) => {
          const eventDate = new Date(event.date);
          return eventDate.getMonth() === thisMonth.getMonth();
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
  if (!userData) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
          paddingHorizontal: spacing.xl,
        }}
      >
        <Ionicons name="person-circle-outline" size={80} color={colors.gray[400]} />
        <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.gray[700], marginTop: spacing.lg }}>
          Welcome, Guest
        </Text>
        <Text style={{ fontSize: fontSize.md, color: colors.gray[500], textAlign: "center", marginTop: spacing.sm }}>
          Log in to view your profile and registered events
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.xxl,
            borderRadius: borderRadius.lg,
            marginTop: spacing.xl,
          }}
          onPress={() => router.push("/login")}
        >
          <Text style={{ color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.semibold }}>
            Log In
          </Text>
        </TouchableOpacity>
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
        <View style={styles.statsContainer}>
          <StatCard number={userData.stats.upcoming} label="Upcoming" />
          <StatCard
            number={userData.stats.registered}
            label="This Month"
            highlight
          />
          <StatCard number={userData.stats.total} label="Total" />
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoCard}>
          <InfoRow
            icon="person-outline"
            label="Full Name"
            value={userData?.name}
          />
          <InfoRow icon="mail-outline" label="Email" value={userData?.email} />
          <InfoRow
            icon="call-outline"
            label="Phone"
            value={userData?.phone}
            isLast // This is now the last row
          />
        </View>
      </View>

      {/* Actions Section */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.inputLabel}>EMAIL (Non-editable)</Text>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: "#f0f0f0", color: "#999" },
              ]}
              value={userData.email}
              editable={false}
            />

            <Text style={styles.inputLabel}>PHONE NUMBER</Text>
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
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProfile}
                style={styles.saveBtn}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: "#FFF" }}>Save</Text>
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
});
