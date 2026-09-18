import { userStore } from '../utils/storage';
import { UserStatus } from '../types';

const STORAGE_KEY = 'knect_user_status';

type Listener = (status: UserStatus) => void;

class StatusService {
  private listeners: Listener[] = [];
  private currentStatus: UserStatus = {
    isAvailable: false,
    activity: '',
    privacy: 'all',
    timestamp: Date.now()
  };

  constructor() {
    this.loadStatus();
  }

  private async loadStatus() {
    const saved = await userStore.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: UserStatus = JSON.parse(saved);
        // Check if it's a new day
        const savedDate = new Date(parsed.timestamp);
        const now = new Date();

        if (savedDate.getDate() !== now.getDate() ||
            savedDate.getMonth() !== now.getMonth() ||
            savedDate.getFullYear() !== now.getFullYear()) {
          // It's a new day, reset
          this.currentStatus = {
              ...parsed,
              isAvailable: false,
              timestamp: Date.now()
          };
          this.save();
        } else {
          this.currentStatus = parsed;
        }
      } catch (e) {
        console.error('Failed to parse status', e);
        this.clearStatus();
        return;
      }
    }
    // Loading resolves after the constructor already handed back the hardcoded
    // default, so subscribers need a notify() here to pick up the loaded value.
    this.notify();
  }

  getStatus(): UserStatus {
    // Always check date on get to ensure we don't show stale status if app stayed open overnight
    const savedDate = new Date(this.currentStatus.timestamp);
    const now = new Date();
    if (this.currentStatus.isAvailable && (
        savedDate.getDate() !== now.getDate() || 
        savedDate.getMonth() !== now.getMonth() || 
        savedDate.getFullYear() !== now.getFullYear())) {
        this.clearStatus();
    }
    return this.currentStatus;
  }

  setStatus(status: Partial<UserStatus>) {
    this.currentStatus = {
      ...this.currentStatus,
      ...status,
      timestamp: Date.now()
    };
    this.save();
    this.notify();
  }

  clearStatus() {
    this.currentStatus = {
      ...this.currentStatus,
      isAvailable: false,
      timestamp: Date.now()
    };
    this.save();
    this.notify();
  }

  private async save() {
    try {
      await userStore.setItem(STORAGE_KEY, JSON.stringify(this.currentStatus));
    } catch (e) {
      console.error('Failed to save status', e);
    }
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentStatus));
  }
}

export const statusService = new StatusService();
