export type EventStatus = 'today' | 'upcoming' | 'completed';

export type FilterTab = 'all' | 'today' | 'upcoming' | 'completed';

export interface EventImage {
  id: string;
  url: string;
  caption?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

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
  selectedResponses?: { question: string; answer: string }[];
  participantSlots?: number;
  volunteerSlots?: number;
  takenSlots?: number;
  volunteerTakenSlots?: number;
  imageUrl?: string;
  images?: EventImage[];
  eventStatus: string
}

export interface EventCardProps {
  event: Event;
}

export const filterTabs = [
  { key: 'all', labelKey: 'events.filterAll' },
  { key: 'today', labelKey: 'events.filterToday' },
  { key: 'upcoming', labelKey: 'events.filterUpcoming' },
  { key: 'completed', labelKey: 'events.filterCompleted' },
] as const;
