import { computed, Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { NotificationService } from './notification.service';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  role: 'customer' | 'employee';
  isRead: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private notificationService = inject(NotificationService);
  private messages = signal<ChatMessage[]>([]);

  // WebSocket Connection States
  private socket?: WebSocket;
  isConnecting = signal(false);
  isSocketActive = signal(false);

  // Programmatic controls
  isChatOpen = signal(false);

  // Observable for real-time updates
  private messageSubject = new Subject<ChatMessage>();
  message$ = this.messageSubject.asObservable();

  // Typing indicators
  isCustomerTyping = signal(false);
  isEmployeeTyping = signal(false);

  allMessages = computed(() => this.messages());
  unreadCount = computed(() => this.messages().filter((m) => !m.isRead && m.role === 'customer').length);

  constructor() {
    // Attempt real WebSocket connection in constructor if browser context is active
    if (typeof window !== 'undefined') {
      this.initWebSocket();
    }
  }

  private initWebSocket() {
    this.isConnecting.set(true);

    // Developer Shared JWT Access Token for support channels (signed via settings shared key)
    const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJSaXlheiIsIm9sZSI6IkFkbWluIn0.c94029'; // Simplified signature matching settings
    const wsUrl = `ws://localhost:3000/api/chat/ws?token=${devToken}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting.set(false);
        this.isSocketActive.set(true);
        console.log('[WebSocket Chat] Connected successfully to micro-backend support server.');
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'message') {
            const newMessage: ChatMessage = {
              id: data.id || Math.random().toString(36).substring(7),
              senderId: data.senderId,
              senderName: data.senderName,
              text: data.text,
              timestamp: new Date(data.timestamp || new Date()),
              role: data.role,
              isRead: data.role !== 'customer',
            };

            this.messages.update((msgs) => [...msgs, newMessage]);
            this.messageSubject.next(newMessage);

            if (data.role === 'customer') {
              this.notificationService.info(
                'Live Support Request',
                `${data.senderName}: ${data.text.substring(0, 30)}${data.text.length > 30 ? '...' : ''}`,
              );
            }
          } else if (data.type === 'typing') {
            const isTyping = data.isTyping || false;
            if (data.role === 'customer') {
              this.isCustomerTyping.set(isTyping);
            } else {
              this.isEmployeeTyping.set(isTyping);
            }
          }
        } catch (e) {
          console.error('[WebSocket Chat] Failed to parse payload:', e);
        }
      };

      this.socket.onerror = () => {
        this.fallbackToMock();
      };

      this.socket.onclose = () => {
        this.isSocketActive.set(false);
        this.isConnecting.set(false);
      };
    } catch (_error) {
      this.fallbackToMock();
    }
  }

  private fallbackToMock() {
    this.isConnecting.set(false);
    this.isSocketActive.set(false);
    console.warn('[WebSocket Chat] Connection failed. Safely falling back to local simulated mock chat.');
  }

  sendMessage(text: string, senderId: string, senderName: string, role: 'customer' | 'employee') {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      senderId,
      senderName,
      text,
      timestamp: new Date(),
      role,
      isRead: role !== 'customer',
    };

    // If socket is active, stream to Python WebSocket backend!
    if (this.isSocketActive() && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'message',
          senderName,
          text,
          timestamp: new Date().toISOString(),
        }),
      );
    } else {
      // Fallback: simulated local mock delivery
      this.messages.update((msgs) => [...msgs, newMessage]);
      this.messageSubject.next(newMessage);

      if (role === 'customer') {
        this.notificationService.info(
          'Support Request',
          `${senderName}: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
        );
      }
    }
  }

  markAllAsRead() {
    this.messages.update((msgs) => msgs.map((m) => ({ ...m, isRead: true })));
  }

  setTyping(role: 'customer' | 'employee', isTyping: boolean) {
    if (this.isSocketActive() && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'typing',
          isTyping,
          role,
        }),
      );
    } else {
      // Fallback: simulated typing indicator
      if (role === 'customer') {
        this.isCustomerTyping.set(isTyping);
      } else {
        this.isEmployeeTyping.set(isTyping);
      }
    }
  }
}
