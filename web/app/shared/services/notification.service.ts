import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  autoClose?: boolean;
  urgent?: boolean;
  link?: string;
}

export type NotificationPlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface NotificationConfig {
  duration: number;
  placement: NotificationPlacement;
  urgentStick: boolean;
  dnd: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private _notifications = signal<Notification[]>([]);

  // All notifications for the side nav
  notifications = this._notifications.asReadonly();

  // Active toasts (recent and not closed)
  private _activeToasts = signal<Notification[]>([]);
  activeToasts = this._activeToasts.asReadonly();

  // Sidenav state
  sidenavOpen = signal(false);

  // Configuration
  config = signal<NotificationConfig>({
    duration: 4000,
    placement: 'top-right',
    urgentStick: true,
    dnd: false,
  });

  constructor() {
    // Load config from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notification_config');
      if (saved) {
        this.config.set(JSON.parse(saved));
      }
    }
  }

  updateConfig(newConfig: Partial<NotificationConfig>) {
    this.config.update((prev) => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('notification_config', JSON.stringify(updated));
      return updated;
    });
  }

  notify(type: NotificationType, title: string, message: string, urgent: boolean = false, link?: string) {
    const id = Math.random().toString(36).substring(2, 9);
    const config = this.config();

    const notification: Notification = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      autoClose: urgent ? !config.urgentStick : true,
      urgent,
      link,
    };

    // Add to main list
    this._notifications.update((prev) => [notification, ...prev]);

    // Add to toasts if DND is off OR if it's urgent
    if (!config.dnd || urgent) {
      this._activeToasts.update((prev) => [...prev, notification]);

      // Auto-remove from toasts if not urgent/sticking
      if (notification.autoClose) {
        setTimeout(() => {
          this.removeToast(id);
        }, config.duration);
      }
    }

    return id;
  }

  success(title: string, message: string, link?: string) {
    return this.notify('success', title, message, false, link);
  }

  error(title: string, message: string, link?: string) {
    return this.notify('error', title, message, false, link);
  }

  info(title: string, message: string, link?: string) {
    return this.notify('info', title, message, false, link);
  }

  warning(title: string, message: string, link?: string) {
    return this.notify('warning', title, message, false, link);
  }

  removeToast(id: string) {
    this._activeToasts.update((prev) => prev.filter((n) => n.id !== id));
  }

  removeNotification(id: string) {
    this._notifications.update((prev) => prev.filter((n) => n.id !== id));
    this.removeToast(id);
  }

  clearAll() {
    this._notifications.set([]);
    this._activeToasts.set([]);
  }

  markAsRead(id: string) {
    this._notifications.update((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }
}
