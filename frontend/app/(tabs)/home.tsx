import { Image } from 'expo-image';
import { Dimensions, FlatList, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import React, { useEffect, useMemo, useState } from 'react';
import { Calendar } from 'react-native-calendars';
import { MarkedDates } from 'react-native-calendars/src/types';
import { Ionicons } from '@expo/vector-icons';
import { fetchEvents } from '@/services/eventService';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const themeColour = Colors[colorScheme ?? 'light'].themeColor;
  const currTime = new Date();
  const [user, setUser] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<string>(currTime.toDateString());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const EVENT_CARD_WIDTH = width * 0.85;
  const SPACING = 0.15;
  const SNAP_INTERVAL = EVENT_CARD_WIDTH + SPACING;

  const handleCreateEvent = () => {
    console.log("Create event button pressed");
  }

  const handleRegister = () => {
    console.log("User want to register");
  }

  useEffect(() => {
    getUser();
    loadEvents();
  }, []);

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user)
      }
    } catch (error) {
      console.log("Not logged in");
      setUser(null)
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    const data = await fetchEvents();
    setEvents(data);
    setLoading(false);
  }

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

  const filteredEvents = useMemo(() => {
    return events.filter((event) => formatDate(new Date(event.date)) == selectedDay);
  }, [events, selectedDay])

  return (
    <ScrollView 
    style={{ flex: 1 }}
    contentContainerStyle={{ flexGrow: 1 }}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.headerColour}>
          <Text style={styles.helloText}>Hello, </Text>
          <Text style={styles.nameText}>{user ? user.name : "Guest123"}</Text>
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
                textMonthFontSize: 24,
                textMonthFontWeight: "bold",
                textDayHeaderFontSize: 14,
                textDayHeaderFontWeight: "600",
                textDayFontSize: 18,
                textDayFontWeight: "500",
                arrowWidth: 40,
                dotColor: themeColour,
                selectedDotColor: "white",
                // @ts-ignore
                'stylesheet.calendar.header': {
                  header: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottomWidth: 2,
                    borderBottomColor: '#adafb3',
                    paddingBottom: 5,
                    marginBottom: 5,
                    marginHorizontal: 10
                  }
                }
              }}
            />
          </View>

          <View style={styles.line}/>

          <View style={styles.bottomContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.eventText}>
                <Text style={styles.sectionTitle}>Events</Text>
              </View>

              {user && user.role == "STAFF" ? (
                <View style={styles.staffButton}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>STAFF</Text>
                  </View>
                  <TouchableOpacity style={styles.createBtn}>
                    <Text style={styles.createBtnText}>+ CREATE</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View />
              )}
            </View>

            {filteredEvents.length == 0 ? (
              <View style={styles.noEventSection}>
                <Text style={styles.noEventText}>No event happening today!</Text>
              </View>
            ) : (
              <FlatList
                data={events}
                horizontal={true}
                showsHorizontalScrollIndicator={true}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate="fast"
                pagingEnabled={false}
                disableIntervalMomentum={true}
                onRefresh={loadEvents}
                refreshing={loading}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
                ItemSeparatorComponent={() => <View style={{ width: SPACING }} />}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.cardWrapperHorizontal}>
                    {/* Blue Line */}
                    <View style={styles.blueLine} />
                    
                    <View style={styles.cardContent}>
                      <Text style={styles.cardDateTime}>{item.time}</Text>
                      <Text style={styles.cardTitle}>{item.title}</Text>

                      {/* Location */}
                      <View style={styles.infoBox}>
                        <Ionicons name="location-sharp" size={20} color="#002147" style={styles.infoIcon} />
                        <View>
                          <Text style={styles.infoLabel}>LOCATION</Text>
                          <Text style={styles.infoText}>{item.location}</Text>
                        </View>
                      </View>

                      {/* Availability */}
                      <View style={styles.infoBox}>
                        <Ionicons name="people" size={20} color="#002147" style={styles.infoIcon} />
                        <View>
                          <Text style={styles.infoLabel}>AVAILABILITY</Text>
                          <Text style={styles.infoText}>{item.totalSlots - item.takenSlots}/{item.totalSlots} slots</Text>
                        </View>
                      </View>

                      {/* Register Buttons */}
                      <View style={styles.cardFooter}>
                        <TouchableOpacity style={styles.registerBtn}>
                          <Text style={styles.registerBtnText}>REGISTER NOW</Text>
                        </TouchableOpacity>
                      </View>

                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start"
  },
  headerColour: {
    flexDirection: "column",
    height: height * 0.2,
    width: "100%",
    backgroundColor: "#100678",
    paddingLeft: width * 0.1,
    justifyContent: "flex-end",
    paddingBottom: 60
  },
  helloText: {
    fontSize: 18,
    fontWeight: 600,
    color: "#fff"
  },
  nameText: {
    fontSize: 22,
    fontWeight: 700,
    color: "#fff"
  },
  body: {
    flex: 1
  },
  calendarWrapper: {
    backgroundColor: '#fff', 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    paddingHorizontal: 10, 
    paddingBottom: 10,
    marginTop: -50,
    paddingTop: 8
  },
  line: {
    borderWidth: 0.5,
    borderColor: "#adafb3",
    marginHorizontal: 10
  },
  bottomContainer: {
    paddingTop: 15,
    flex: 1
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  eventText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  staffButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#002147',
  },
  badge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  createBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardWrapperHorizontal: {
    width: width * 0.85,
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    
    // Shadows
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  blueLine: {
    width: 10,
    backgroundColor: '#002147',
  },
  cardContent: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
  },
  cardDateTime: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#002147',
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ebee',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: "flex-end",
    marginTop: 5,
  },
  registerBtn: {
    backgroundColor: '#002147',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginBottom: 5,
  },
  registerBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  noEventSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 50
  },
  noEventText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: "center"
  }
});
