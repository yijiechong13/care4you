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
import { useTranslation } from "react-i18next";

import { ThemedView } from "@/components/themed-view";
import { ImageGalleryModal, EventImage } from "@/components/ImageGalleryModal";
import { useRouter, useFocusEffect } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import React, { useEffect, useMemo, useState } from "react";
import { Calendar } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { Fontisto, Ionicons } from "@expo/vector-icons";
import { fetchEvents } from "@/services/eventService";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";

const { width, height } = Dimensions.get("window");
const EVENT_TYPE_ICONS: Record<string, any> = {
  'Activities at MTC Office': require('@/assets/images/office.png'),
  'Outings': require('@/assets/images/outing.png'),
  'Nature Walks': require('@/assets/images/walk.png'),
  'Gym and Dance': require('@/assets/images/gym.png'),
  'Reading': require('@/assets/images/read.png'),
};

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColour = Colors[colorScheme ?? "light"].themeColor;
  const currTime = new Date();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const userRole = (user?.user_type || "").trim().toLowerCase();
  const [selectedDay, setSelectedDay] = useState<string>(formatDate(currTime));
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [loading, setLoading] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [selectedEventImages, setSelectedEventImages] = useState<EventImage[]>(
    [],
  );
  // Translate dynamic content (titles only, location kept in English)
  const eventTitles = useMemo(() => events.map(e => e.title || ''), [events]);
  const translatedTitles = useTranslatedContent(eventTitles);
  const translatedMap = useMemo(() => {
    const map = new Map<string, { title: string }>();
    events.forEach((e, i) => {
      map.set(e.id, { title: translatedTitles[i] });
    });
    return map;
  }, [events, translatedTitles]);

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
      setSelectedEventImages([{ id: "1", url: event.imageUrl }]);
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
        setIsGuest(false);
        setIsStaff(false);
        return;
      }

      if (userId.startsWith("guest_")) {
        setIsGuest(true);
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
      setIsGuest(false);
      setIsStaff(false);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchEvents();
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
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
    setFilteredEvents(filteredEvents);
  }, [events, selectedDay]);

  // All upcoming/active events for list view (exclude past and cancelled)
  // Time-sensitive: hide events whose end time has already passed
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    return events
      .filter((event) => {
        if (event.eventStatus === 'cancelled') return false;

        const eventDate = new Date(event.date);
        const eventDateOnly = new Date(eventDate);
        eventDateOnly.setHours(0, 0, 0, 0);

        // Future dates: always show
        if (eventDateOnly > today) return true;

        // Past dates: hide
        if (eventDateOnly < today) return false;

        // Today: check if end time has passed
        // Parse endTime (format: "HH:MM" or "H:MM AM/PM")
        const endTimeParts = event.endTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!endTimeParts) return true; // Can't parse, show it

        let hours = parseInt(endTimeParts[1], 10);
        const minutes = parseInt(endTimeParts[2], 10);
        const ampm = endTimeParts[3];

        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
          if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
        }

        const eventEndTime = new Date(eventDate);
        eventEndTime.setHours(hours, minutes, 0, 0);

        return eventEndTime > now;
      })
      .sort((a, b) => {
        const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateDiff !== 0) return dateDiff;

        // Same date: sort by startTime
        const parseTime = (t: string) => {
          const parts = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
          if (!parts) return 0;
          let h = parseInt(parts[1], 10);
          const m = parseInt(parts[2], 10);
          const ap = parts[3];
          if (ap) {
            if (ap.toUpperCase() === 'PM' && h !== 12) h += 12;
            if (ap.toUpperCase() === 'AM' && h === 12) h = 0;
          }
          return h * 60 + m;
        };
        return parseTime(a.startTime) - parseTime(b.startTime);
      });
  }, [events]);

  return (
    <View style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.headerColour}>
          <View style={styles.headerTopRow}>
            <Text style={styles.helloText}>
              {t('home.hello', { name: user ? user.name : t('common.guest') })}
            </Text>
            <View style={styles.headerToggle}>
              <TouchableOpacity
                style={[styles.headerToggleBtn, viewMode === 'calendar' && styles.headerToggleBtnActive]}
                onPress={() => setViewMode('calendar')}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={viewMode === 'calendar' ? '#002C5E' : '#fff'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerToggleBtn, viewMode === 'list' && styles.headerToggleBtnActive]}
                onPress={() => setViewMode('list')}
              >
                <Ionicons
                  name="list-outline"
                  size={18}
                  color={viewMode === 'list' ? '#002C5E' : '#fff'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
        <ScrollView style={styles.body} contentContainerStyle={{ flexGrow: 1 }}>
          {viewMode === 'calendar' && (
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
          )}

          {viewMode === 'calendar' && <View style={styles.line} />}

          <View style={styles.bottomContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.events')}</Text>

              {isStaff ? (
                <View style={styles.staffButton}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t('home.staff')}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.createBtn}
                    onPress={handleCreateEvent}
                  >
                    <Text style={styles.createBtnText}>{t('home.create')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Calendar View - shows events for selected day */}
            {viewMode === 'calendar' && (
              filteredEvents.length === 0 ? (
                <View style={styles.noEventSection}>
                  <Text style={styles.noEventText}>
                    {t('home.noEvents')}
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
                      <View style={styles.headerRow}>
                        <View style={styles.headerTextStack}>
                          <Text style={styles.cardDateTime}>
                            {item.dateDisplay} • {item.startTime} - {item.endTime}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={styles.cardTitle}>{translatedMap.get(item.id)?.title ?? item.title}</Text>
                            {item.wheelchairAccessible && (
                              <Fontisto name="wheelchair" size={18} style={{ marginLeft: 6 }} />
                            )}
                          </View>
                        </View>
                        <Image
                          source={EVENT_TYPE_ICONS[item.tag]}
                          style={styles.typeIcon}
                          resizeMode="contain"
                        />
                      </View>

                      {/* Event Thumbnail */}
                      {(item.imageUrl ||
                        (item.images && item.images.length > 0)) && (
                        <TouchableOpacity
                          style={styles.thumbnailContainer}
                          onPress={() => handleImagePress(item)}
                          accessibilityLabel={`View ${item.title} photos`}
                          accessibilityRole="button"
                        >
                          <Image
                            source={{
                              uri: item.images?.[0]?.url || item.imageUrl,
                            }}
                            style={styles.thumbnail}
                            contentFit="cover"
                            transition={200}
                          />
                          {item.images && item.images.length > 1 && (
                            <View style={styles.imageCountBadge}>
                              <Ionicons name="images" size={14} color="#fff" />
                              <Text style={styles.imageCountText}>
                                {item.images.length}
                              </Text>
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
                          <Text style={styles.infoLabel}>{t('home.location')}</Text>
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
                          <Text style={styles.infoLabel}>{t('home.availability')}</Text>
                          {isStaff || userRole !== "volunteer" ? (
                            item.participantSlots ? (
                              <Text style={styles.infoText}>
                                {isStaff ? t('home.participant') : ""}{" "}
                                {item.takenSlots ?? 0}/{item.participantSlots}
                              </Text>
                            ) : (
                              <Text style={styles.infoText}>
                                {isStaff ? t('home.participant') : ""} {t('home.noCap')}
                              </Text>
                            )
                          ) : null}
                          {isStaff || userRole === "volunteer" ? (
                            item.volunteerSlots && item.volunteerSlots > 0 ? (
                              <Text style={styles.infoText}>
                                {isStaff ? t('home.volunteer') : ""}{" "}
                                {item.volunteerTakenSlots ?? 0}/
                                {item.volunteerSlots}
                              </Text>
                            ) : (
                              <Text style={styles.infoText}>
                                {isStaff ? t('home.volunteer') : ""} {t('home.notNeeded')}
                              </Text>
                            )
                          ) : null}
                        </View>
                      </View>

                      {/* Register Buttons */}
                      {!isStaff && (
                        <View style={styles.cardFooter}>
                          {currTime > new Date(item.dateDisplay) ? (
                            <View style={styles.registerClosedBtn}>
                              <Text style={styles.registerBtnText}>
                                {t('home.registrationClosed')}
                              </Text>
                            </View>
                          ) : item.eventStatus == "cancelled" ? (
                            <View style={styles.registerCancelBtn}>
                              <Text style={styles.registerBtnText}>
                                {t('home.cancelled')}
                              </Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.registerBtn}
                              onPress={() => handleRegister(item)}
                            >
                              {(userRole == "volunteer" && item.volunteerSlots <= item.volunteerTakenSlots) ||
                                ((userRole == "participant" || isGuest) &&
                                item.participantSlots &&
                                item.participantSlots <= item.takenSlots) ? (
                                  <Text style={styles.registerBtnText}>
                                    {t('home.joinWaitlist')}
                                  </Text>
                                ) : (
                                  <Text style={styles.registerBtnText}>
                                    {t('home.registerNow')}
                                  </Text>
                                )}
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                )}
              />
              )
            )}

            {/* List View - shows all upcoming events grouped by date */}
            {viewMode === 'list' && (
              upcomingEvents.length === 0 ? (
                <View style={styles.noEventSection}>
                  <Text style={styles.noEventText}>
                    {t('home.noUpcomingEvents')}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.listViewContainer}
                  contentContainerStyle={styles.listViewContent}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {(() => {
                    let lastDateKey = '';
                    return upcomingEvents.map((item) => {
                      const dateKey = formatDate(new Date(item.date));
                      const showHeader = dateKey !== lastDateKey;
                      lastDateKey = dateKey;

                      const dateObj = new Date(item.date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const eventDateOnly = new Date(dateObj);
                      eventDateOnly.setHours(0, 0, 0, 0);

                      let dateLabel = '';
                      if (eventDateOnly.getTime() === today.getTime()) {
                        dateLabel = t('home.today');
                      } else if (eventDateOnly.getTime() === tomorrow.getTime()) {
                        dateLabel = t('home.tomorrow');
                      } else {
                        const day = dateObj.getDate();
                        const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                        const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        dateLabel = `${weekday}, ${day} ${month}`;
                      }

                      return (
                        <React.Fragment key={item.id}>
                          {showHeader && (
                            <View style={styles.dateHeader}>
                              <View style={styles.dateChip}>
                                <Ionicons name="calendar-outline" size={18} color="#002C5E" style={{ marginRight: 8 }} />
                                <Text style={styles.dateHeaderText}>{dateLabel}</Text>
                              </View>
                              <View/>
                            </View>
                          )}
                          <View style={styles.timelineRow}>
                            {/* Timeline gutter */}
                            <View style={styles.timelineGutter}>
                              <View style={styles.timelineDot} />
                              <View style={styles.timelineLine} />
                            </View>
                            {/* Card */}
                            <View style={styles.timelineCard}>
                        <View style={styles.headerRow}>
                          <View style={styles.headerTextStack}>
                            <Text style={styles.cardDateTime}>
                              {item.startTime} - {item.endTime}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <Text style={styles.cardTitle}>{translatedMap.get(item.id)?.title ?? item.title}</Text>
                              {item.wheelchairAccessible && (
                                <Fontisto name="wheelchair" size={18} style={{ marginLeft: 6 }} />
                              )}
                            </View>
                          </View>
                          <Image
                            source={EVENT_TYPE_ICONS[item.tag]}
                            style={styles.typeIcon}
                            contentFit="contain"
                          />
                        </View>

                        {/* Event Thumbnail */}
                        {(item.imageUrl ||
                          (item.images && item.images.length > 0)) && (
                          <TouchableOpacity
                            style={styles.thumbnailContainer}
                            onPress={() => handleImagePress(item)}
                            accessibilityLabel={`View ${item.title} photos`}
                            accessibilityRole="button"
                          >
                            <Image
                              source={{
                                uri: item.images?.[0]?.url || item.imageUrl,
                              }}
                              style={styles.thumbnail}
                              contentFit="cover"
                              transition={200}
                            />
                            {item.images && item.images.length > 1 && (
                              <View style={styles.imageCountBadge}>
                                <Ionicons name="images" size={14} color="#fff" />
                                <Text style={styles.imageCountText}>
                                  {item.images.length}
                                </Text>
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
                            <Text style={styles.infoLabel}>{t('home.location')}</Text>
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
                            <Text style={styles.infoLabel}>{t('home.availability')}</Text>
                            {isStaff || userRole !== "volunteer" ? (
                              item.participantSlots ? (
                                <Text style={styles.infoText}>
                                  {isStaff ? t('home.participant') : ""}{" "}
                                  {item.takenSlots ?? 0}/{item.participantSlots}
                                </Text>
                              ) : (
                                <Text style={styles.infoText}>
                                  {isStaff ? t('home.participant') : ""} {t('home.noCap')}
                                </Text>
                              )
                            ) : null}
                            {isStaff || userRole === "volunteer" ? (
                              item.volunteerSlots && item.volunteerSlots > 0 ? (
                                <Text style={styles.infoText}>
                                  {isStaff ? t('home.volunteer') : ""}{" "}
                                  {item.volunteerTakenSlots ?? 0}/{item.volunteerSlots}
                                </Text>
                              ) : (
                                <Text style={styles.infoText}>
                                  {isStaff ? t('home.volunteer') : ""} {t('home.notNeeded')}
                                </Text>
                              )
                            ) : null}
                          </View>
                        </View>

                        {/* Register Buttons */}
                        {!isStaff && (
                          <View style={styles.cardFooter}>
                            {currTime > new Date(item.dateDisplay) ? (
                              <View style={styles.registerClosedBtn}>
                                <Text style={styles.registerBtnText}>
                                  {t('home.registrationClosed')}
                                </Text>
                              </View>
                            ) : item.eventStatus === "cancelled" ? (
                              <View style={styles.registerCancelBtn}>
                                <Text style={styles.registerBtnText}>
                                  {t('home.cancelled')}
                                </Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.registerBtn}
                                onPress={() => handleRegister(item)}
                              >
                                {(userRole === "volunteer" && item.volunteerSlots <= item.volunteerTakenSlots) ||
                                  ((userRole === "participant" || isGuest) &&
                                  item.participantSlots &&
                                  item.participantSlots <= item.takenSlots) ? (
                                    <Text style={styles.registerBtnText}>
                                      {t('home.joinWaitlist')}
                                    </Text>
                                  ) : (
                                    <Text style={styles.registerBtnText}>
                                      {t('home.registerNow')}
                                    </Text>
                                  )}
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  </React.Fragment>
                      );
                    });
                  })()}
                </ScrollView>
              )
            )}
          </View>
        </ScrollView>
      </ThemedView>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        visible={galleryVisible}
        images={selectedEventImages}
        onClose={() => setGalleryVisible(false)}
      />
    </View>
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
    justifyContent: "flex-end",
  },
  helloText: {
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
    lineHeight: 30,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  headerToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    padding: 2,
  },
  headerToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  headerToggleBtnActive: {
    backgroundColor: "#fff",
  },
  body: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: -50,
    borderRadius: 30,
  },
  calendarWrapper: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 9,
    borderRadius: 30,
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
    marginTop: 15,
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
    fontSize: 23,
    fontWeight: "bold",
    color: "#002C5E",
    marginRight: 12,
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
    paddingBottom: 20
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
    marginBottom: 8,
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerTextStack: {
    flex: 1,
    marginRight: 12,
  },
  wheelchairIcon: {
    alignSelf: "center"
  },
  typeIcon: {
    width: 60,
    height: 60,
  },
  cardDateTime: {
    color: "#6B7280",
    fontWeight: "500",
    fontSize: 12,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#002C5E",
    marginRight: 10
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    marginTop: 7,
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
    marginTop: 4
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
  viewToggle: {
    flexDirection: "row",
    marginLeft: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: "#002C5E",
  },
  listViewContainer: {
    flex: 1,
  },
  listViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  cardWrapperVertical: {
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
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2F7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
  },
  dateHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#002C5E",
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineGutter: {
    width: 16,
    alignItems: "center",
    marginRight: 10,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#002C5E",
    zIndex: 1,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#D1D5DB",
  },
  timelineCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 15,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
});
