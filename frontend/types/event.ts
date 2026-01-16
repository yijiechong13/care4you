export type EventStatus = 'today' | 'upcoming' | 'completed';

export type FilterTab = 'all' | 'today' | 'upcoming' | 'completed';


export interface Event {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: EventStatus;
  icon?: string;
  importantNotice?: string;
  venue: string;
  meetingPoint?: string;
}

export interface EventCardProps {
  event: Event;
}

export const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
] as const;
