import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, effect, inject, input, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'ui-chat-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-white dark:bg-dark-surface">
      <!-- Messages Area -->
      <div
        #scrollContainer
        [class]="isCompact() ? 'p-4 space-y-3' : 'p-6 space-y-6'"
        class="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-black/10"
      >
        @if (chatService.isConnecting()) {
          <!-- Premium Pulsing Chat Loading Skeletons -->
          <div class="space-y-4 animate-pulse">
            <div class="flex items-end gap-2">
              <div class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10"></div>
              <div class="bg-slate-200/50 dark:bg-white/5 h-10 w-2/3 rounded-xl rounded-tl-none border border-slate-200/20 dark:border-white/5"></div>
            </div>
            <div class="flex items-end gap-2 flex-row-reverse">
              <div class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10"></div>
              <div class="bg-primary/20 h-12 w-1/2 rounded-xl rounded-tr-none"></div>
            </div>
            <div class="flex items-end gap-2">
              <div class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10"></div>
              <div class="bg-slate-200/50 dark:bg-white/5 h-8 w-3/4 rounded-xl rounded-tl-none border border-slate-200/20 dark:border-white/5"></div>
            </div>
          </div>
        } @else if (chatService.allMessages().length === 0) {
          <div
            class="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in"
          >
            <div
              [class]="isCompact() ? 'w-12 h-12' : 'w-20 h-20'"
              class="bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 mb-4 border-2 border-dashed border-slate-200 dark:border-white/10"
            >
              <svg
                [class]="isCompact() ? 'w-6 h-6' : 'w-10 h-10'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                ></path>
              </svg>
            </div>
            <h3
              [class]="isCompact() ? 'text-[11px]' : 'text-sm'"
              class="font-black text-slate-400 uppercase tracking-widest"
            >
              No Messages Yet
            </h3>
          </div>
        } @else {
          @for (msg of chatService.allMessages(); track msg.id) {
            <div
              class="flex flex-col"
              [class.items-end]="msg.role === currentRole()"
            >
              <div
                class="flex items-end gap-2"
                [class.flex-row-reverse]="msg.role === currentRole()"
              >
                <div
                  [class]="
                    isCompact() ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'
                  "
                  class="rounded-lg bg-slate-200 dark:bg-white/10 flex-shrink-0 flex items-center justify-center font-black shadow-sm"
                >
                  {{ msg.senderName.charAt(0) }}
                </div>
                <div
                  [class]="
                    msg.role === currentRole()
                      ? 'bg-primary text-white rounded-xl rounded-tr-none shadow-md shadow-primary/10'
                      : 'bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 rounded-xl rounded-tl-none border border-slate-200 dark:border-white/5 shadow-sm'
                  "
                  [class.px-3]="isCompact()"
                  [class.py-2]="isCompact()"
                  [class.px-5]="!isCompact()"
                  [class.py-3]="!isCompact()"
                  [class.text-[11px]]="isCompact()"
                  [class.text-xs]="!isCompact()"
                  class="font-medium max-w-[85%] leading-relaxed"
                >
                  {{ msg.text }}
                </div>
              </div>
              <span
                [class]="isCompact() ? 'px-8 text-[7px]' : 'px-11 text-[8px]'"
                class="font-black text-slate-400 mt-1 uppercase tracking-widest"
              >
                {{ msg.senderName }} • {{ msg.timestamp | date: 'shortTime' }}
              </span>
            </div>
          }
        }

        <!-- Typing Indicator -->
        @if (showTyping()) {
          <div class="flex items-center gap-3 animate-fade-in pl-1">
            <div
              class="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center"
            >
              <div class="flex gap-1">
                <div
                  class="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                ></div>
                <div
                  class="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"
                ></div>
                <div
                  class="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"
                ></div>
              </div>
            </div>
            <span
              class="text-[9px] font-black text-slate-400 uppercase tracking-widest italic"
              >{{ isCustomer() ? 'Employee' : 'Customer' }} is typing...</span
            >
          </div>
        }
      </div>

      <!-- Input Area -->
      <div
        class="p-6 bg-white dark:bg-dark-surface border-t border-slate-200 dark:border-white/5"
      >
        <div class="relative flex items-center gap-4">
          <input
            [(ngModel)]="newMessage"
            (keyup.enter)="send()"
            (input)="onTyping()"
            placeholder="Type your message here..."
            class="flex-1 bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-6 py-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none dark:text-white transition-all"
          />
          <button
            (click)="send()"
            [disabled]="!newMessage.trim()"
            class="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale shadow-xl shadow-primary/20 group"
          >
            <svg
              class="w-6 h-6 rotate-45 -translate-y-0.5 -translate-x-0.5 group-hover:translate-x-0 group-hover:-translate-y-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              ></path>
            </svg>
          </button>
        </div>
      </div>
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
        --color-dark-card: var(--theme-dark-card);
      }
    `,
  ],
})
export class ChatViewComponent {
  currentRole = input<'customer' | 'employee'>('customer');
  userName = input<string>('Guest');
  isCompact = input<boolean>(false);

  chatService = inject(ChatService);
  scrollContainer = viewChild<ElementRef>('scrollContainer');

  newMessage = '';
  isCustomer = computed(() => this.currentRole() === 'customer');

  showTyping = computed(() => {
    return this.isCustomer() ? this.chatService.isEmployeeTyping() : this.chatService.isCustomerTyping();
  });

  constructor() {
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
    setTimeout(() => {
      this.chatService.setTyping(this.currentRole(), false);
    }, 2000);
  }
}
