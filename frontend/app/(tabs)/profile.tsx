import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  // Static data for UI building - we will replace this with real data later
  const userData = {
    name: "Jane Cooper",
    email: "janeper01@gmail.com",
    phone: "+65 XXXX XXXX",
    address: "19 Kent Ridge Cres, 119278",
    emergencyContact: "+65 XXXX XXXX",
    stats: { upcoming: 6, registered: 2, total: 12 },
  };

  return (
    <ScrollView style={styles.container}>
      {/* Blue Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="black" />
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={120} color="white" />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userData.stats.upcoming}</Text>
            <Text style={styles.statLabel}>UPCOMING</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userData.stats.registered}</Text>
            <Text style={styles.statLabel}>REGISTERED{"\n"}this month</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userData.stats.total}</Text>
            <Text style={styles.statLabel}>TOTAL{"\n"}REGISTERED</Text>
          </View>
        </View>
      </View>

      {/* Info List Section */}
      <View style={styles.infoSection}>
        <InfoItem label="Full Name" value={userData.name} />
        <InfoItem label="Email" value={userData.email} />
        <InfoItem label="Phone" value={userData.phone} />
        <InfoItem label="Address" value={userData.address} />
        <InfoItem label="Emergency Contact" value={userData.emergencyContact} />
      </View>
    </ScrollView>
  );
}

// Sub-component for info rows to keep code clean
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
      <View style={styles.separator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    backgroundColor: "#002B5B",
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  editButton: {
    position: "absolute",
    top: 50,
    right: 30,
    backgroundColor: "white",
    padding: 5,
    borderRadius: 5,
  },
  avatarContainer: { marginBottom: 20 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "90%",
    marginTop: 10,
  },
  statBox: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    width: width * 0.25,
    alignItems: "center",
    height: 70,
    justifyContent: "center",
  },
  statNumber: { fontSize: 18, fontWeight: "bold", color: "#002B5B" },
  statLabel: {
    fontSize: 8,
    color: "#002B5B",
    textAlign: "center",
    fontWeight: "600",
  },
  infoSection: { padding: 25 },
  infoItem: { marginBottom: 20 },
  infoLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#002B5B",
    marginBottom: 5,
  },
  infoValue: { fontSize: 14, color: "#6C757D" },
  separator: { height: 1, backgroundColor: "#DEE2E6", marginTop: 15 },
});
