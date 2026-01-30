import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from "react-native";
import { EventCard } from "@/components/event-card";
import { Event, FilterTab, filterTabs } from "@/types/event";
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  spacing,
} from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import {
  fetchEvents,
  fetchUserRegistrations,
  fetchRegistrationsForExport,
} from "@/services/eventService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function EventsScreen() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("active");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [exportingEventId, setExportingEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isWheelchairOnly, setIsWheelchairOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasActiveFilters = isWheelchairOnly;

  useEffect(() => {
    checkUserAndLoadEvents();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkUserAndLoadEvents(); // Reuse your existing loading logic
    setRefreshing(false);
  }, []);

  // Refresh data when screen comes into focus (for real-time updates)
  useFocusEffect(
    useCallback(() => {
      checkUserAndLoadEvents();
    }, []),
  );

  // Export registrations to CSV
  const handleExportCSV = async (eventId: string, eventTitle: string) => {
    try {
      setExportingEventId(eventId);

      // Fetch registration data
      const registrations = await fetchRegistrationsForExport(eventId);

      if (registrations.length === 0) {
        Alert.alert(
          t("events.noRegistrations"),
          t("events.noRegistrationsMessage"),
        );
        setExportingEventId(null);
        return;
      }

      // Generate CSV content
      const headers = [
        "S/N",
        "Name",
        "Role",
        "Email",
        "Contact",
        "Emergency Contact",
        "Special Requirements",
        "Responses",
        "Registered On",
        "Attendance",
      ];
      const csvRows = [headers.join(",")];

      registrations.forEach((reg: any) => {
        const row = [
          reg.sn,
          `"${(reg.name || "").replace(/"/g, '""')}"`,
          `"${(reg.userType || "").replace(/"/g, '""')}"`,
          `"${(reg.email || "").replace(/"/g, '""')}"`,
          `"${(reg.contact || "").replace(/"/g, '""')}"`,
          `"${(reg.emergencyContact || "").replace(/"/g, '""')}"`,
          `"${(reg.specialRequirements || "").replace(/"/g, '""')}"`,
          `"${(reg.responses || "").replace(/"/g, '""')}"`,
          `"${(reg.registeredAt || "").replace(/"/g, '""')}"`,
          "", // Empty attendance column for staff to fill
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\n");

      // Create filename with event title and date
      const sanitizedTitle = eventTitle
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 30);
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${sanitizedTitle}_Attendance_${dateStr}.csv`;

      // Write file using new expo-file-system API
      const file = new File(Paths.cache, filename);
      file.write(csvContent);

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: t("events.exportDialogTitle", { title: eventTitle }),
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert(
          t("common.success"),
          t("events.exportSavedMessage", { path: file.uri }),
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(t("events.exportFailed"), t("events.exportFailedMessage"));
    } finally {
      setExportingEventId(null);
    }
  };

  const checkUserAndLoadEvents = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        setIsStaff(false);
        setEvents([]);
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("user_type")
        .eq("id", userId)
        .single();

      const staffRole = userData?.user_type?.toLowerCase() === "staff";
      setIsStaff(staffRole);

      if (staffRole) {
        // Staff sees ALL events - uses same data source as home page
        const allEvents = await fetchEvents();

        // Transform to match Event type with status (uses takenSlots from events table)
        const transformedEvents = allEvents.map((event: any) => {
          const dateObj = new Date(event.date);
          const now = new Date();
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          const eventDate = new Date(
            dateObj.getFullYear(),
            dateObj.getMonth(),
            dateObj.getDate(),
          );

          let status: "today" | "upcoming" | "completed" | "cancelled";
          if (event.eventStatus == "cancelled") {
            status = "cancelled";
          } else if (eventDate.getTime() === today.getTime()) {
            status = "today";
          } else if (eventDate < today) {
            status = "completed";
          } else {
            status = "upcoming";
          }

          return {
            ...event,
            reminders: event.reminders,
            date: dateObj,
            status,
            venue: event.location,
            participantSlots: event.participantSlots,
            volunteerSlots: event.volunteerSlots,
            takenSlots: event.takenSlots,
            volunteerTakenSlots: event.volunteerTakenSlots,
            eventStatus: event.eventStatus,
          };
        });
        setEvents(transformedEvents);
      } else {
        // Regular user sees only their registered events
        const userEvents = await fetchUserRegistrations(userId);
        setEvents(userEvents);
      }
    } catch (error) {
      console.error("Error loading events:", error);
      setEvents([]);
    }
    setLoading(false);
  };

  //filtering for each tab
  const filteredEvents = events
    .filter((event) => {
      // Search
      const matchesSearch =
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Accessibility
      if (isWheelchairOnly && !event.wheelchairAccessible) return false;

      // Tab Status
      if (activeFilter === "active") {
        return event.status !== "cancelled" && event.status !== "completed";
      }
      return event.status === activeFilter;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const activeEventCount = events.filter(
    (event) =>
      event.status === "completed" ||
      event.status === "upcoming" ||
      event.status === "today" ||
      event.status === "waitlist",
  ).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {isStaff ? t("events.allEvents") : t("events.title")}
            </Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t("events.loadingEvents")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isStaff ? t("events.allEvents") : t("events.title")}
          </Text>
          <View style={styles.eventCountBadge}>
            <Text style={styles.eventCountText}>
              {t("events.eventsCount", { count: activeEventCount })}
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBarRow}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={18}
              color={colors.gray[400]}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t("events.searchPlaceholder") || "Search events..."}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.filterIconButton,
              hasActiveFilters && styles.filterIconButtonActive,
            ]}
            onPress={() => setIsFilterModalVisible(true)}
          >
            <Ionicons
              name={hasActiveFilters ? "filter" : "filter-outline"}
              size={22}
              color={hasActiveFilters ? colors.white : colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true} // MUST be horizontal
        persistentScrollbar={true} // Keeps the bar visible on Android
        indicatorStyle="black" // "black", "white", or "default" for iOS
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContentContainer}
      >
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              activeFilter === tab.key && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(tab.key as FilterTab)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === tab.key && styles.filterTabTextActive,
              ]}
            >
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Event List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        alwaysBounceVertical={true}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]} // Android spinner color
            tintColor={colors.primary} // iOS spinner color
          />
        }
      >
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard
              key={event.registrationId || event.id}
              event={event}
              isStaff={isStaff}
              onExport={handleExportCSV}
              isExporting={exportingEventId === event.id}
              regId={isStaff ? null : event.registrationId}
              regStatus={isStaff ? null : event.registrationStatus}
              onStatusChange={checkUserAndLoadEvents}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t("events.noEvents")}</Text>
          </View>
        )}
      </ScrollView>
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterMenu}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>
                {t("events.filterOptions") || "Filters"}
              </Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.gray[700]} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>
                {t("events.accessibility") || "Accessibility"}
              </Text>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsWheelchairOnly(!isWheelchairOnly)}
              >
                <View
                  style={[
                    styles.checkbox,
                    isWheelchairOnly && styles.checkboxChecked,
                  ]}
                >
                  {isWheelchairOnly && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  {t("events.wheelchairAccess") || "Wheelchair Accessible"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setIsFilterModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>
                {t("common.apply") || "Apply Filters"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsWheelchairOnly(false);
                setIsFilterModalVisible(false);
              }}
              style={styles.resetButton}
            >
              <Text style={styles.resetButtonText}>
                {t("common.reset") || "Reset All"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 60,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  eventCountBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  eventCountText: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  filterContainer: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200], // Acts as the track for the scrollbar
  },
  filterContentContainer: {
    paddingHorizontal: spacing.lg, // Forces the last item to be cut off
    paddingVertical: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  filterTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    fontWeight: fontWeight.medium,
  },
  filterTabTextActive: {
    color: colors.white,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.gray[400],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.gray[500],
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background, // Or colors.primary if you want it merged
  },

  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.gray[700],
  },
  searchBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  filterIconButton: {
    width: 48,
    height: 48,
    backgroundColor: "#F3F4F6", // Light gray background
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  filterIconButtonActive: {
    backgroundColor: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end", // Opens from bottom
  },
  filterMenu: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  filterTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[700],
  },
  filterSection: {
    marginBottom: spacing.xl,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[500],
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: fontSize.md,
    color: colors.gray[700],
  },
  applyButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  applyButtonText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
  resetButton: {
    padding: spacing.md,
    alignItems: "center",
  },
  resetButtonText: {
    color: colors.gray[500],
    fontSize: fontSize.sm,
  },
});
