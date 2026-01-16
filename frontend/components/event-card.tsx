import React from 'react';
import { View, Text } from 'react-native';
import { Event } from '@/types/event';
import { eventCardStyles as styles, statusColors, statusLabels } from '@/styles';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const formatTime = (start: string, end: string) => `${start} - ${end}`;

  const formatDate = (date: Date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.card}>
      {/* Status Badge */}
      <View style={styles.statusContainer}>
        <View style={styles.statusDot} />
        <Text style={[styles.statusText, { color: statusColors[event.status] }]}>
          {statusLabels[event.status]}
        </Text>
      </View>

      {/* Event Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.dateTime}>
            {formatDate(event.date)} • {formatTime(event.startTime, event.endTime)}
          </Text>
        </View>
        {event.icon && <Text style={styles.icon}>{event.icon}</Text>}
      </View>

      {/* Important Notice */}
      {event.importantNotice && (
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeTitle}>IMPORTANT NOTICE</Text>
          <Text style={styles.noticeText}>{event.importantNotice}</Text>
        </View>
      )}

      {/* Event Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>EVENT DETAILS</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <View>
            <Text style={styles.detailLabel}>VENUE</Text>
            <Text style={styles.detailValue}>{event.venue}</Text>
          </View>
        </View>

        {event.meetingPoint && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🚇</Text>
            <View>
              <Text style={styles.detailLabel}>YOUR MEETING POINT</Text>
              <Text style={styles.detailValue}>{event.meetingPoint}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
