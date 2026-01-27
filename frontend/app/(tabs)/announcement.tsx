import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { EventCard } from '@/components/event-card';
import { Event, FilterTab, filterTabs } from '@/types/event';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { fetchEvents, fetchUserRegistrations } from '@/services/eventService';
import { fetchAnnouncements } from '@/services/announmentService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';

export default function EventsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getUser();
      getAnnouncements()
    }, [])
  );

  const getUser = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        setIsStaff(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, name, user_type")
        .eq("id", userId)
        .single();

      if (!userError && userData) {
        setIsStaff(userData.user_type?.toLowerCase() === "staff");
      } else {
        setIsStaff(false);
      }
    } catch (error) {
      console.log("Not logged in");
      setIsStaff(false);
    }
  };

  const getAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await fetchAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.log("Failed to fetch announcements");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Announcements</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      </View>
    );
  }

  const handleCreateAnnouncement = () => {
    router.push("../announcement/createAnnouncement");
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Announcements</Text>
          {isStaff && (
            <TouchableOpacity style={styles.eventCountBadge} onPress={handleCreateAnnouncement}>
              <Text style={styles.eventCountText}>+ Create</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Announcement List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        alwaysBounceVertical={true}
        scrollEnabled={true}
      >
        {announcements.length > 0 ? (
          announcements.map((item, index) => (
            <View key={item.id} style={[styles.cardContainer, index === announcements.length - 1 && styles.lastCard]}>

              {/* Title */}
              <Text style={styles.cardTitle}>{item.title}</Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Message Body */}
              <Text style={styles.cardMessage}>{item.message}</Text>

              {/* Date at Bottom Right */}
              {item.date && (
                <View style={styles.dateContainer}>
                  <Text style={styles.cardDate}>{item.date}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No announcements yet</Text>
            <Text style={styles.emptySubtext}>Check back later for updates</Text>
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
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lastCard: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#002C5E',
    marginBottom: spacing.sm,
    lineHeight: 28,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: spacing.sm,
  },
  cardMessage: {
    fontSize: fontSize.md,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  cardDate: {
    fontSize: fontSize.xs,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 3,
  },
  emptyText: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: '#D1D5DB',
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
