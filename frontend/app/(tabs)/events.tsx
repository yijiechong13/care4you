import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { EventCard } from '@/components/event-card';
import { Event, FilterTab, filterTabs } from '@/types/event';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { fetchEvents, fetchUserRegistrations, fetchRegistrationCounts } from '@/services/eventService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EventsScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    checkUserAndLoadEvents();
  }, []);

  const checkUserAndLoadEvents = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setIsStaff(false);
        setEvents([]);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', userId)
        .single();

      const staffRole = userData?.user_type?.toLowerCase() === 'staff';
      setIsStaff(staffRole);

      if (staffRole) {
        // Staff sees ALL events
        const allEvents = await fetchEvents();

        // Fetch registration counts for all events
        const eventIds = allEvents.map((e: any) => e.id);
        const counts = await fetchRegistrationCounts(eventIds);

        // Transform to match Event type with status and registration counts
        const transformedEvents = allEvents.map((event: any) => {
          const dateObj = new Date(event.date);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const eventDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

          let status: 'today' | 'upcoming' | 'completed';
          if (eventDate.getTime() === today.getTime()) {
            status = 'today';
          } else if (eventDate < today) {
            status = 'completed';
          } else {
            status = 'upcoming';
          }

          return {
            ...event,
            date: dateObj,
            status,
            venue: event.location,
            participantSlots: event.participantSlots,
            volunteerSlots: event.volunteerSlots,
            registrationCounts: counts[event.id] || { volunteer: 0, participant: 0, total: 0 },
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
    .filter((event: Event) => {
      if (activeFilter === 'all') return event.status !== 'completed';
      return event.status === activeFilter;
    })
    .sort((event1: Event, event2: Event) => event1.date.getTime() - event2.date.getTime());

  const activeEventCount = events.filter((e: Event) => e.status !== 'completed').length;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{isStaff ? 'All Events' : 'My Events'}</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{isStaff ? 'All Events' : 'My Events'}</Text>
          <View style={styles.eventCountBadge}>
            <Text style={styles.eventCountText}>{activeEventCount} Events</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
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
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Event List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        alwaysBounceVertical={true}
        scrollEnabled={true}
      >
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No events found</Text>
          </View>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  eventCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.gray[400],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.gray[500],
  },
});
