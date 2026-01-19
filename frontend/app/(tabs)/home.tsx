import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";

import { ThemedView } from "@/components/themed-view";
import { ImageGalleryModal, EventImage } from "@/components/ImageGalleryModal";
import { useRouter, useFocusEffect } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import React, { useEffect, useMemo, useState } from "react";
import { Calendar } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { Ionicons } from "@expo/vector-icons";
import { fetchEvents } from "@/services/eventService";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColour = Colors[colorScheme ?? "light"].themeColor;
  const currTime = new Date();
  const [user, setUser] = useState<any>(null);
  const [isStaff, setIsStaff] = useState(false);
  const userRole = (user?.user_type || "").trim().toLowerCase();
  const [selectedDay, setSelectedDay] = useState<string>(
    formatDate(currTime),
  );
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [selectedEventImages, setSelectedEventImages] = useState<EventImage[]>([]);
  const EVENT_CARD_WIDTH = width * 0.85;
  const SPACING = 0.15;
  const SNAP_INTERVAL = EVENT_CARD_WIDTH + SPACING;

  const handleCreateEvent = () => {
    router.push("../eventCreation/basicInfo");
  };

  const handleRegister = (event: any) => {
    router.push({
      pathname: "../eventRegistration/register",
      params: {
        eventId: event.id,
        eventTitle: event.title,
      },
    });
  };

  const handleImagePress = (event: any) => {
    if (event.images && event.images.length > 0) {
      setSelectedEventImages(event.images);
      setGalleryVisible(true);
    } else if (event.imageUrl) {
      // Fallback for single image format
      setSelectedEventImages([{ id: '1', url: event.imageUrl }]);
      setGalleryVisible(true);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
    }, []),
  );

  const getUser = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        setUser(null);
        setIsStaff(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, name, user_type")
        .eq("id", userId)
        .single();

      if (!userError && userData) {
        setUser(userData);
        setIsStaff(userData.user_type?.toLowerCase() === "staff");
      } else {
        setUser(null);
        setIsStaff(false);
      }
    } catch (error) {
      console.log("Not logged in");
      setUser(null);
      setIsStaff(false);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    const data = await fetchEvents();
    setEvents(data);
    setLoading(false);
  };

  function formatDate(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const markedDates: MarkedDates = useMemo(() => {
    const dict: Record<string, any> = {};

    events.forEach((event) => {
      const date = formatDate(new Date(event.date));
      dict[date] = {
        marked: true,
        dotColor: themeColour,
      };
    });

    if (selectedDay && dict[selectedDay]) {
      dict[selectedDay] = {
        marked: true,
        selected: true,
        dotColor: "white",
        customStyles: {
          container: {
            backgroundColor: themeColour,
            width: 38,
            height: 38,
            borderRadius: 25,
            alignSelf: "center",
            justifyContent: "center",
            alignItems: "center",
            marginTop: -7,
          },
        },
      };
    } else if (selectedDay) {
      dict[selectedDay] = {
        selected: true,
        customStyles: {
          container: {
            backgroundColor: themeColour,
            width: 38,
            height: 38,
            borderRadius: 25,
            alignSelf: "center",
            justifyContent: "center",
            marginTop: -7,
          },
        },
      };
    }

    return dict;
  }, [selectedDay, events]);

  useEffect(() => {
    const filteredEvents = events.filter(
      (event) => formatDate(new Date(event.date)) === selectedDay,
    );
    setFilteredEvents(filteredEvents)
  }, [events, selectedDay]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.headerColour}>
          <Text style={styles.helloText}>
            Hello, {user ? user.name : "Guest"}
          </Text>
        </ThemedView>
        <ThemedView style={styles.body}>
          <View style={styles.calendarWrapper}>
            <Calendar
              markingType="custom"
              onDayPress={(day) => {
                setSelectedDay(day.dateString);
              }}
              markedDates={markedDates}
              enableSwipeMonths={true}
              style={{ borderRadius: 10 }}
              theme={{
                backgroundColor: "#000000",
                calendarBackground: "#ffffff",
                textSectionTitleColor: "#b6c1cd",
                selectedDayBackgroundColor: themeColour,
                selectedDayTextColor: "#ffffff",
                todayTextColor: "#6558f0",
                dayTextColor: "black",
                textDisabledColor: "lightgray",
                arrowColor: themeColour,
                textMonthFontSize: 18,
                textMonthFontWeight: "bold",
                textDayHeaderFontSize: 12,
                textDayHeaderFontWeight: "600",
                textDayFontSize: 14,
                textDayFontWeight: "500",
                arrowWidth: 30,
                dotColor: themeColour,
                selectedDotColor: "white",
                // @ts-ignore
                "stylesheet.calendar.header": {
                  header: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottomWidth: 1,
                    borderBottomColor: "#adafb3",
                    paddingBottom: 4,
                    marginBottom: 4,
                    marginHorizontal: 10,
                  },
                },
                "stylesheet.day.basic": {
                  base: {
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                },
              }}
            />
          </View>

          <View style={styles.line} />

          <View style={styles.bottomContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.eventText}>
                <Text style={styles.sectionTitle}>Events</Text>
              </View>

              {isStaff ? (
                <View style={styles.staffButton}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>STAFF</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.createBtn}
                    onPress={handleCreateEvent}
                  >
                    <Text style={styles.createBtnText}>+ CREATE</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {filteredEvents.length === 0 ? (
              <View style={styles.noEventSection}>
                <Text style={styles.noEventText}>
                  No event happening today!
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredEvents}
                horizontal={true}
                showsHorizontalScrollIndicator={true}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate="fast"
                pagingEnabled={false}
                disableIntervalMomentum={true}
                onRefresh={loadEvents}
                refreshing={loading}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingBottom: 30,
                }}
                ItemSeparatorComponent={() => (
                  <View style={{ width: SPACING }} />
                )}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.cardWrapperHorizontal}>
                    {/* Blue Line */}
                    <View style={styles.blueLine} />

                    <View style={styles.cardContent}>
                      <Text style={styles.cardDateTime}>{item.dateDisplay} • {item.startTime}</Text>
                      <Text style={styles.cardTitle}>{item.title}</Text>

                      {/* Event Thumbnail */}
                      {(item.imageUrl || (item.images && item.images.length > 0)) && (
                        <TouchableOpacity
                          style={styles.thumbnailContainer}
                          onPress={() => handleImagePress(item)}
                          accessibilityLabel={`View ${item.title} photos`}
                          accessibilityRole="button"
                        >
                          <Image
                            source={{ uri: item.images?.[0]?.url || item.imageUrl }}
                            style={styles.thumbnail}
                            contentFit="cover"
                            transition={200}
                          />
                          {item.images && item.images.length > 1 && (
                            <View style={styles.imageCountBadge}>
                              <Ionicons name="images" size={14} color="#fff" />
                              <Text style={styles.imageCountText}>{item.images.length}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Location */}
                      <View style={styles.infoBox}>
                        <Ionicons
                          name="location-sharp"
                          size={20}
                          color="#002C5E"
                          style={styles.infoIcon}
                        />
                        <View>
                          <Text style={styles.infoLabel}>LOCATION</Text>
                          <Text style={styles.infoText}>{item.location}</Text>
                        </View>
                      </View>

                      {/* Availability */}
                      <View style={styles.infoBox}>
                        <Ionicons
                          name="people"
                          size={20}
                          color="#002C5E"
                          style={styles.infoIcon}
                        />
                        <View>
                          <Text style={styles.infoLabel}>AVAILABILITY</Text>
                          {isStaff || userRole !== "volunteer" ? (
                            item.participantSlots ? (
                              <Text style={styles.infoText}>
                                {isStaff ? "Participant:" : ""}{" "}
                                {item.takenSlots ?? 0}/{item.participantSlots}
                              </Text>
                            ) : (
                              <Text style={styles.infoText}>
                                {isStaff ? "Participant:" : ""} No cap
                              </Text>
                            )
                          ) : null}
                          {isStaff || userRole === "volunteer" ? (
                            item.volunteerSlots && item.volunteerSlots > 0 ? (
                              <Text style={styles.infoText}>
                                {isStaff ? "Volunteer:" : ""}{" "}
                                {item.volunteerTakenSlots ?? 0}/{item.volunteerSlots}
                              </Text>
                            ) : (
                              <Text style={styles.infoText}>
                                {isStaff ? "Volunteer:" : ""} Not needed
                              </Text>
                            )
                          ) : null}
                        </View>
                      </View>

                      {/* Register Buttons */}
                      {isStaff && (
                        <View style={styles.cardFooter}>
                          {currTime > new Date(item.dateDisplay) || 
                          userRole == "volunteer" && item.volunteerSlots <= item.volunteerTakenSlots || 
                          userRole == "participant" && item.participantSlots && item.participantSlots <= item.takenSlots ? (
                            <View
                              style={styles.registerClosedBtn}
                            >
                              <Text style={styles.registerBtnText}>
                                REGISTRATION CLOSED
                              </Text>
                            </View>
                          ) : item.eventStatus == "cancelled" ? (
                            <View
                              style={styles.registerCancelBtn}
                            >
                              <Text style={styles.registerBtnText}>
                                CANCELLED
                              </Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.registerBtn}
                              onPress={() => handleRegister(item)}
                            >
                              <Text style={styles.registerBtnText}>
                                REGISTER NOW
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </ThemedView>
      </ThemedView>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        visible={galleryVisible}
        images={selectedEventImages}
        onClose={() => setGalleryVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  headerColour: {
    flexDirection: "column",
    width: "100%",
    backgroundColor: "#002C5E",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 60,
    height: "20%",
    justifyContent: "flex-end"
  },
  helloText: {
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
    lineHeight: 30,
  },
  body: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: -50,
    borderRadius: 30
  },
  calendarWrapper: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 9,
    borderRadius: 30
  },
  line: {
    borderWidth: 0.5,
    borderColor: "#adafb3",
    marginHorizontal: 13,
  },
  bottomContainer: {
    paddingTop: 8,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 15
  },
  eventText: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  staffButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#002C5E",
  },
  badge: {
    backgroundColor: "#002C5E",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  createBtn: {
    backgroundColor: "#002C5E",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  cardWrapperHorizontal: {
    width: width * 0.85,
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  blueLine: {
    width: 6,
    backgroundColor: "#002C5E",
  },
  cardContent: {
    flex: 1,
    padding: 12,
    backgroundColor: "white",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderText: {
    flex: 1,
    marginRight: 12,
  },
  cardThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  thumbnailContainer: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  imageCountBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 44, 94, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  imageCountText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  cardDateTime: {
    color: "#6B7280",
    fontWeight: "500",
    fontSize: 12,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#002C5E",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    marginTop: 7
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  registerBtn: {
    backgroundColor: "#002C5E",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  registerBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  registerClosedBtn: {
    backgroundColor: "#494c4f",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  registerCancelBtn: {
    backgroundColor: "#ff3030",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  noEventSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  noEventText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#9CA3AF",
    textAlign: "center",
  },
});
