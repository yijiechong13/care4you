import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import { EventCard } from '@/components/event-card';
import { Event, FilterTab, filterTabs } from '@/types/event';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { fetchEvents, fetchUserRegistrations } from '@/services/eventService';
import { fetchAnnouncements } from '@/services/announmentService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function EventsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>();
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    initialLoad();
  }, []);

  const initialLoad = async () => {
    setIsLoading(true);
    const userData = await getUser(); 
    await getAnnouncements(userData);
    setIsLoading(false);
  };

  const onRefresh = useCallback(async () => {
      setRefreshing(true);
      await getAnnouncements(user);
      setRefreshing(false);
    }, []);

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
        setIsStaff(false);
      }
    } catch (error) {
      console.log("Not logged in");
      setIsStaff(false);
    }
  };

  const getAnnouncements = async (currentUser: any) => {
    try {
      const isUserStaff = currentUser?.isStaff ?? isStaff;
      const currentUserId = currentUser?.id ?? user?.id;

      let data;
      if (isUserStaff) {
        data = await fetchAnnouncements();
      } else {
        data = await fetchAnnouncements(currentUserId);
      }
      setAnnouncements(data || []);
    } catch (error) {
      console.log("Failed to fetch announcements", error);
    }
  };

  const handleCreateAnnouncement = () => {
    router.push("../announcement/createAnnouncement");
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('announcements.title')}</Text>
          {isStaff && (
            <TouchableOpacity style={styles.eventCountBadge} onPress={handleCreateAnnouncement}>
              <Text style={styles.eventCountText}>{t('announcements.create')}</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]} // Android spinner color
            tintColor={colors.primary} // iOS spinner color
          />
        }
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

              {/* Location (kept in English) */}
              {item.location && (
                <Text style={styles.cardLocation}>📍 {item.location}</Text>
              )}

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
            <Text style={styles.emptyText}>{t('announcements.noAnnouncements')}</Text>
            <Text style={styles.emptySubtext}>{t('announcements.checkBack')}</Text>
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
    marginBottom: spacing.sm,
  },
  cardLocation: {
    fontSize: fontSize.sm,
    color: '#6B7280',
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
