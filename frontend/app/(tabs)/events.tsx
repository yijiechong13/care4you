import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { EventCard } from '@/components/event-card';
import { Event, FilterTab, filterTabs } from '@/types/event';
import { eventListStyles as styles } from '@/styles';

// Mock data
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Bowling',
    date: new Date(),
    startTime: '2:00pm',
    endTime: '5:00pm',
    status: 'upcoming',
    icon: '🎳',
    importantNotice: 'Please bring your own water if needed.',
    venue: 'Yishun SAFRA',
    meetingPoint: 'Woodlands North MRT Exit 1',
  },
  {
    id: '2',
    title: 'Bowling',
    date: new Date(),
    startTime: '2:00pm',
    endTime: '5:00pm',
    status: 'completed',
    icon: '🎳',
    importantNotice: 'Please bring your own water if needed.',
    venue: 'Yishun SAFRA',
    meetingPoint: 'Yishun SAFRA',
  },
    {
    id: '3',
    title: 'Bowling',
    date: new Date(),
    startTime: '2:00pm',
    endTime: '5:00pm',
    status: 'completed',
    icon: '🎳',
    importantNotice: 'Please bring your own water if needed.',
    venue: 'Yishun SAFRA',
    meetingPoint: 'Yishun SAFRA',
  }
];

export default function EventsScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  //filtering for each tab
  const filteredEvents = mockEvents
    .filter((event) => {
      if (activeFilter === 'all') return event.status !== 'completed';
      return event.status === activeFilter;
    })
    .sort((event1, event2) => event1.date.getTime() - event2.date.getTime());

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Events</Text>
          <View style={styles.eventCountBadge}>
            <Text style={styles.eventCountText}>{mockEvents.filter(e => e.status !== 'completed').length} Events</Text>
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
