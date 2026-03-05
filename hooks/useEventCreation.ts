import { useState, useCallback } from 'react';
import { Friend } from '../types';

export type CreationStep = 'info' | 'calendar' | 'friends' | 'hours';
export type SelectionMode = 'start' | 'end';

export const useEventCreation = (allFriends: Friend[]) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [pickedStartTime, setPickedStartTime] = useState<number | null>(null);
  const [pickedEndTime, setPickedEndTime] = useState<number | null>(null);
  const [color, setColor] = useState('#10b981');
  const [step, setStep] = useState<CreationStep>('info');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('start');

  const getConflictingHours = useCallback(() => {
    const conflicts = new Set<number>();
    selectedFriends.forEach((friendId) => {
      const friend = allFriends.find((f) => f.id === friendId);
      if (friend) {
        friend.busyHours.forEach((hour) => conflicts.add(hour));
      }
    });
    return Array.from(conflicts).sort((a, b) => a - b);
  }, [selectedFriends, allFriends]);

  const isFriendBusy = useCallback((friendId: string) => {
    if (pickedStartTime === null) return false;
    const date = new Date(pickedStartTime);
    const hour = date.getHours();
    const friend = allFriends.find((f) => f.id === friendId);
    if (!friend) return false;
    return friend.busyHours.includes(hour);
  }, [allFriends, pickedStartTime]);

  return {
    title,
    setTitle,
    location,
    setLocation,
    isAllDay,
    setIsAllDay,
    selectedFriends,
    setSelectedFriends,
    pickedStartTime,
    setPickedStartTime,
    pickedEndTime,
    setPickedEndTime,
    color,
    setColor,
    step,
    setStep,
    selectionMode,
    setSelectionMode,
    getConflictingHours,
    isFriendBusy,
  };
};