import { StyleSheet } from 'react-native';
import { colors } from '../colors';
import { spacing, fontSize, fontWeight } from '../common';

export const navbarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  tabActive: {
    // Active state styling
  },
  icon: {
    fontSize: fontSize.xl,
    color: colors.gray[400],
    marginBottom: spacing.xs,
  },
  iconActive: {
    color: colors.primary,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    fontWeight: fontWeight.medium,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});

export const navbarItems = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'events', label: 'My Events', icon: '📋' },
  { key: 'announcement', label: 'Announcement', icon: '📢' },
  { key: 'profile', label: 'Profile', icon: '👤' },
] as const;

export type NavbarItemKey = typeof navbarItems[number]['key'];
