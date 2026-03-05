import { Friend, User } from './types';

export const CURRENT_USER: User = {
  id: 'me',
  name: 'You',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
  isAvailable: true
};

export const MOCK_FRIENDS: Friend[] = [
  { id: '1', name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', busyHours: [18, 19] },
  { id: '2', name: 'Marcus', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', busyHours: [20, 21] },
  { id: '3', name: 'Elena', avatar: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=100&h=100&fit=crop', busyHours: [14, 15, 16] },
  { id: '4', name: 'David', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop', busyHours: [9, 10] },
  { id: '5', name: 'Jessica', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', busyHours: [12, 13] },
];
