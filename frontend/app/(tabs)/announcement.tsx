import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { EventCard } from '@/components/event-card';
import { Event, FilterTab, filterTabs } from '@/types/event';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { fetchEvents, fetchUserRegistrations } from '@/services/eventService';
import { fetchAnnouncements } from '@/services/announmentService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function EventsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    getUser();
    getAnnouncements();
  }, [])

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
          announcements.map((item) => (
            <View key={item.id} style={styles.cardContainer}>
              <View style={styles.cardContent}>
                
                {/* Title & Date Row */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {item.date && (
                    <Text style={styles.cardDate}>{item.date}</Text>
                  )}
                </View>

                {/* Message Body */}
                <Text style={styles.cardMessage}>{item.message}</Text>
              </View>

              <View style={styles.separator} />
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No announcements found</Text>
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
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  cardContainer: {
    backgroundColor: '#fff',
  },
  cardContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#002C5E',
    flex: 1, 
    marginRight: 10,
  },
  cardDate: {
    fontSize: fontSize.xs,
    color: '#6B7280',
    marginTop: 4,
  },
  cardMessage: {
    fontSize: fontSize.md,
    color: '#374151',
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: spacing.lg,
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
