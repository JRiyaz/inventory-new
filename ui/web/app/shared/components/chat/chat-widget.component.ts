import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, effect, inject, input, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { ChatViewComponent } from './chat-view.component';

@Component({
  selector: 'ui-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatViewComponent],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
      <!-- Chat Window -->
      @if (isOpen()) {
        <div
          class="w-[380px] h-[520px] bg-white dark:bg-dark-elevated rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-chat-in backdrop-blur-xl card-premium"
        >
          <!-- Header -->
          <div
            class="p-4 bg-gradient-to-r from-primary to-blue-600 text-white flex items-center justify-between shadow-lg"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md relative"
              >
                <span class="text-lg font-black">{{
                  isCustomer() ? 'S' : 'C'
                }}</span>
                <div
                  [class]="
                    chatService.isConnecting()
                      ? 'bg-amber-400 animate-pulse'
                      : chatService.isSocketActive()
                      ? 'bg-emerald-400'
                      : 'bg-rose-400'
                  "
                  class="absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-primary rounded-full"
                ></div>
              </div>
              <div>
                <h3 class="text-sm font-black uppercase tracking-tight">
                  {{ isCustomer() ? 'Support Team' : 'Customer Support' }}
                </h3>
                <p
                  class="text-[9px] opacity-90 font-bold uppercase tracking-widest"
                >
                  {{
                    chatService.isConnecting()
                      ? 'Connecting...'
                      : chatService.isSocketActive()
                      ? 'Live Support (Secure)'
                      : 'Simulated Local Support'
                  }}
                </p>
              </div>
            </div>
            <button
              (click)="isOpen.set(false)"
              class="p-2 hover:bg-white/10 rounded-xl transition-all"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          <!-- Messages Area (via Shared View) -->
          <div class="flex-1 overflow-hidden">
            <ui-chat-view
              [currentRole]="currentRole()"
              [userName]="userName()"
            />
          </div>
        </div>
      }

      <!-- Chat Bubble Icon -->
      <button
        (click)="toggle()"
        class="group relative w-14 h-14 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center overflow-hidden animate-float"
      >
        <div
          class="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        ></div>

        @if (!isOpen()) {
          <svg
            class="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            ></path>
          </svg>
        } @else {
          <svg
            class="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        }

        <!-- Unread Badge -->
        @if (unreadCount() > 0 && !isOpen()) {
          <div
            class="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-dark-base animate-bounce"
          >
            {{ unreadCount() }}
          </div>
        }
      </button>
    </div>
  `,
  styles: [
    `
      @reference "tailwindcss";
      @custom-variant dark (&:where(.dark, .dark *));

      @theme {
        --color-primary: var(--theme-primary);
        --color-dark-base: var(--theme-dark-base);
        --color-dark-surface: var(--theme-dark-surface);
        --color-dark-elevated: var(--theme-dark-elevated);
        --color-dark-card: var(--theme-dark-card);
      }

      .animate-chat-in {
        animation: chatIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        transform-origin: bottom right;
      }

      @keyframes chatIn {
        from {
          opacity: 0;
          transform: scale(0.8) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      :root[data-theme='glass'] .card-premium {
        background: var(--glass-bg-light) !important;
        backdrop-filter: var(--glass-blur) !important;
        border: 1px solid var(--glass-border-light) !important;
      }

      :root[data-theme='glass'].dark .card-premium {
        background: var(--glass-bg-dark) !important;
        border: 1px solid var(--glass-border-dark) !important;
      }
    `,
  ],
})
export class ChatWidgetComponent {
  currentRole = input<'customer' | 'employee'>('customer');
  userName = input<string>('Guest');

  chatService = inject(ChatService);
  scrollContainer = viewChild<ElementRef>('scrollContainer');

  isOpen = this.chatService.isChatOpen;
  newMessage = '';

  isCustomer = computed(() => this.currentRole() === 'customer');

  unreadCount = computed(() => {
    if (this.currentRole() === 'employee') {
      return this.chatService.unreadCount();
    }
    return 0; // Customers don't track unread in this simple model yet
  });

  showTyping = computed(() => {
    return this.isCustomer() ? this.chatService.isEmployeeTyping() : this.chatService.isCustomerTyping();
  });

  constructor() {
    // Auto-scroll on new message
    effect(() => {
      const _msgs = this.chatService.allMessages();
      const container = this.scrollContainer();
      if (container) {
        setTimeout(() => {
          container.nativeElement.scrollTop = container.nativeElement.scrollHeight;
        }, 100);
      }
    });
  }

  toggle() {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen() && this.currentRole() === 'employee') {
      this.chatService.markAllAsRead();
    }
  }

  send() {
    if (!this.newMessage.trim()) return;

    this.chatService.sendMessage(
      this.newMessage,
      `user-${Math.random().toString(36).substring(7)}`,
      this.userName(),
      this.currentRole(),
    );

    this.newMessage = '';
    this.chatService.setTyping(this.currentRole(), false);
  }

  onTyping() {
    this.chatService.setTyping(this.currentRole(), true);
    // Clear typing after 2 seconds of inactivity
    setTimeout(() => {
      this.chatService.setTyping(this.currentRole(), false);
    }, 2000);
  }
}
