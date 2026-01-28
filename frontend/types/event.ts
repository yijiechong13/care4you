export type EventStatus = 'today' | 'upcoming' | 'completed';

export type FilterTab = 'active' | 'today' | 'upcoming' | 'completed';

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
  { key: 'active', labelKey: 'events.filterActive' },
  { key: 'today', labelKey: 'events.filterToday' },
  { key: 'upcoming', labelKey: 'events.filterUpcoming' },
  { key: 'waitlist', labelKey: 'events.filterWaitlist'},
  { key: 'completed', labelKey: 'events.filterCompleted' },
  { key: 'cancelled', labelKey: 'events.filterCancelled'},
] as const;
