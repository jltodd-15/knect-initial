export interface UserStatus {
  isAvailable: boolean;
  activity: string;
  privacy: 'all' | 'close-friends' | 'specific-groups';
  timestamp: number; // MS timestamp of last update
}

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

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  busyHours: number[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  type: 'text' | 'system' | 'event-proposal' | 'vote';
  eventId?: string;
  eventDetails?: {
    id: string;
    title: string;
    location: string;
    time: number;
    endTime: number;
    color: string;
    proposerId?: string;
    participants?: string[];
    rsvps?: Record<string, 'going' | 'not_going' | 'pending'>;
  };
  voteDetails?: {
      question: string;
      options: { id: string; text: string; votes: string[] }[];
      mode: 'normal' | 'ranked';
      context?: { eventId?: string; field?: 'time' | 'location'; initialValue?: string };
      rankedVotes?: { userId: string; order: string[] }[];
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
  lastMessage: string;
  lastMessageTimestamp: number;
  isGroup: boolean;
  image?: string;
  admins?: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  timestamp: number; // MS timestamp of the start time
  endTime: number; // MS timestamp of the end time
  type?: string;
  location: string;
  participants: string[];
  color: string;
  attendees?: Attendee[];
  status: 'proposed' | 'confirmed';
  isAllDay: boolean;
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

export interface PollOption {
  id: string;
  text: string;
}

export interface Vote {
  userId: string;
  optionId?: string; // For 'pick one'
  rankedOptionIds?: string[]; // For 'ranked'
}

export interface EventProposal {
  id: string;
  originalEventId: string;
  title: string;
  timestamp: number;
  location: string;
  rsvps: Record<string, 'yes' | 'no'>;
  poll?: {
    id: string;
    type: 'pick-one' | 'ranked-choice';
    question: string;
    options: PollOption[];
    votes: Vote[];
    status: 'active' | 'closed';
    winnerId?: string;
    isTie?: boolean;
  };
}

export enum AppTab {
  PLANNER = 'planner',
  FEED = 'discover',
  SOCIAL = 'circle',
  PROFILE = 'profile'
}