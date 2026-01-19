import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '@/types/event';
import { borderRadius, colors, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';

interface EventCardProps {
  event: Event;
  isStaff?: boolean;
  onExport?: (eventId: string, eventTitle: string) => void;
  isExporting?: boolean;
}

export function EventCard({ event, isStaff, onExport, isExporting }: EventCardProps) {
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

      {/* Registration Counts - Staff View (uses same data as home page) */}
      {isStaff && (
        <View style={styles.registrationContainer}>
          <View style={styles.signUpHeader}>
            <Text style={styles.signUpTitle}>SIGN-UPS</Text>
            {onExport && (
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => onExport(event.id, event.title)}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={16} color={colors.primary} />
                    <Text style={styles.exportButtonText}>Export</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.countsRow}>
            <View style={styles.countItem}>
              <Text style={styles.countNumber}>
                {event.takenSlots ?? 0}
                {event.participantSlots != null && <Text style={styles.countCap}> / {event.participantSlots}</Text>}
              </Text>
              <Text style={styles.countLabel}>Participants</Text>
            </View>
            <View style={styles.countDivider} />
            <View style={styles.countItem}>
              <Text style={styles.countNumber}>
                {event.volunteerTakenSlots ?? 0}
                {event.volunteerSlots != null && event.volunteerSlots > 0 && (
                  <Text style={styles.countCap}> / {event.volunteerSlots}</Text>
                )}
              </Text>
              <Text style={styles.countLabel}>Volunteers</Text>
            </View>
          </View>
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

        {event.selectedResponses?.length ? (
          <View style={styles.qaContainer}>
            <Text style={styles.qaTitle}>YOUR RESPONSES</Text>
            {event.selectedResponses.map((item, index) => (
              <View key={`${item.question}-${index}`} style={styles.qaRow}>
                <Text style={styles.qaQuestion}>{item.question}</Text>
                <Text style={styles.qaAnswer}>{item.answer}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: fontSize.sm - 1,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  dateTime: {
    fontSize: fontSize.md,
    color: colors.gray[500],
  },
  icon: {
    fontSize: 40,
  },
  noticeContainer: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  noticeText: {
    fontSize: fontSize.sm + 1,
    color: colors.warningDark,
  },
  detailsContainer: {
    marginTop: spacing.sm,
  },
  detailsTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[400],
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailIcon: {
    fontSize: fontSize.xl,
    marginRight: spacing.md,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.gray[400],
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.gray[700],
  },
  qaContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  qaTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.gray[500],
    marginBottom: spacing.sm,
    letterSpacing: 0.4,
  },
  qaRow: {
    marginBottom: spacing.sm,
  },
  qaQuestion: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: 2,
  },
  qaAnswer: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  registrationContainer: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  signUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  signUpTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[400],
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  exportButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
    marginLeft: 4,
  },
  capacityText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  countItem: {
    alignItems: 'center',
    flex: 1,
  },
  countNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  countCap: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.gray[400],
  },
  countLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  countDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
  },
  totalCount: {
    color: colors.success,
  },
});

const statusColors = {
  today: colors.primary,
  upcoming: colors.primary,
  completed: colors.gray[500],
} as const;

const statusLabels = {
  today: "TODAY'S EVENT",
  upcoming: 'UPCOMING',
  completed: 'COMPLETED',
} as const;
