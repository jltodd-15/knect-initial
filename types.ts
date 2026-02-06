export interface User {
  id: string;
  name: string;
  avatar: string;
  status?: string;
  isAvailable: boolean;
  interests?: string[];
  location?: string;
  bio?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  type?: 'text' | 'invite';
  eventId?: string;
  eventDetails?: {
    title: string;
    location: string;
    time: string;
    color: string;
  };
}

export interface Attendee {
  userId: string;
  name: string;
  avatar: string;
  status: 'confirmed' | 'declined' | 'pending';
}

export interface Conversation {
  id: string;
  title: string;
  participants: string[];
  lastMessage?: string;
  isGroup: boolean;
  image?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  timestamp: number; // MS timestamp of the start time
  endTime?: number; // MS timestamp of the end time
  type: string;
  location?: string;
  participants: string[];
  color?: string;
  attendees?: Attendee[];
  status?: 'proposed' | 'confirmed';
  isAllDay?: boolean;
}

export interface TimeWindow {
  start: string;
  end: string;
  score: number;
  reasoning: string;
}

export interface DiscoveryItem {
  id: string;
  title: string;
  description: string;
  image: string;
  isAd: boolean;
  category: string;
  url?: string;
  location?: string;
}

export enum AppTab {
  PLANNER = 'planner',
  FEED = 'discover',
  SOCIAL = 'circle',
  PROFILE = 'profile'
}