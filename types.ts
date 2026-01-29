
export interface User {
  id: string;
  name: string;
  avatar: string;
  status?: string;
  isAvailable: boolean;
  interests?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
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
  date: number;
  type: string;
  location?: string;
  participants: string[];
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
