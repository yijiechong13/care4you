import { StyleSheet } from 'react-native';
import { colors } from '../colors';
import { spacing, borderRadius, fontSize, fontWeight, shadow } from '../common';

export const eventCardStyles = StyleSheet.create({
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
});

export const statusColors = {
  today: colors.primary,
  upcoming: colors.primary,
  completed: colors.gray[500],
} as const;

export const statusLabels = {
  today: "TODAY'S EVENT",
  upcoming: 'UPCOMING',
  completed: 'COMPLETED',
} as const;
