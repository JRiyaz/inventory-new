import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ChatService, ChatViewComponent, PageHeaderComponent } from 'ui-shared';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ChatViewComponent],
  template: `
    <div class="p-3  h-[calc(100vh-64px)] flex flex-col gap-3">
      <lib-page-header
        title="Support Terminal"
        subtitle="Manage live customer sessions"
        actionLabel="New Session"
        [showAction]="true"
      />

      <div class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0">
        <!-- Sidebar / Contact List -->
        <div
          class="lg:col-span-1 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col shadow-sm"
        >
          <div
            class="px-4 py-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5"
          >
            <h3
              class="text-[9px] font-black uppercase tracking-widest text-slate-500"
            >
              Live Queue
            </h3>
          </div>
          <div class="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
            <div
              (click)="selectCustomer({ id: 'c1', name: 'Customer #492' })"
              [class.bg-primary/10]="selectedCustomer()?.id === 'c1'"
              [class.border-primary/20]="selectedCustomer()?.id === 'c1'"
              class="p-2.5 rounded-xl border border-transparent flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
            >
              <div
                class="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-black text-base shadow-lg shadow-primary/10 group-hover:scale-105 transition-transform"
              >
                C
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center mb-0.5">
                  <h4
                    class="text-[12px] font-black text-slate-900 dark:text-white truncate"
                  >
                    Customer #492
                  </h4>
                  <span
                    class="text-[8px] font-black text-primary animate-pulse tracking-tighter"
                    >LIVE</span
                  >
                </div>
                <p
                  class="text-[9px] text-slate-400 truncate font-black uppercase tracking-widest leading-none"
                >
                  Active session
                </p>
              </div>
            </div>

            <div class="mt-4 p-4 text-center">
              <p
                class="text-[8px] font-black text-slate-300 uppercase tracking-widest"
              >
                More inquiries will appear here
              </p>
            </div>
          </div>
        </div>

        <!-- Chat Area -->
        <div
          class="lg:col-span-3 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col shadow-lg relative"
        >
          <div class="flex-1 flex flex-col relative z-10">
            @if (selectedCustomer()) {
              <div class="flex flex-col h-full animate-fade-in">
                <!-- Chat Header -->
                <div
                  class="px-4 py-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm"
                    >
                      C
                    </div>
                    <div>
                      <h3
                        class="text-[11px] font-black text-slate-900 dark:text-white leading-tight"
                      >
                        {{ selectedCustomer().name }}
                      </h3>
                      <p
                        class="text-[8px] text-emerald-500 font-black uppercase tracking-widest"
                      >
                        Encrypted Line
                      </p>
                    </div>
                  </div>
                  <button
                    (click)="selectedCustomer.set(null)"
                    class="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-all"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <!-- Chat View -->
                <div class="flex-1 overflow-hidden">
                  <ui-chat-view
                    currentRole="employee"
                    [userName]="'Support Agent'"
                    [isCompact]="true"
                  />
                </div>
              </div>
            } @else {
              <div
                class="p-8 text-center flex flex-col items-center justify-center h-full animate-fade-in"
              >
                <div
                  class="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary/30 mb-4 animate-bounce"
                >
                  <svg
                    class="w-8 h-8"
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
                </div>
                <h2
                  class="text-lg font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight"
                >
                  Support Terminal
                </h2>
                <p
                  class="text-[10px] text-slate-400 max-w-xs mx-auto font-black uppercase tracking-widest mb-6 leading-relaxed"
                >
                  Select a live session from the sidebar to begin responding.
                </p>

                <div class="flex gap-3">
                  <div
                    class="px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5"
                  >
                    <p class="text-lg font-black text-primary leading-none">
                      01
                    </p>
                    <p
                      class="text-[7px] font-black uppercase tracking-widest text-slate-400 mt-1"
                    >
                      In Queue
                    </p>
                  </div>
                  <div
                    class="px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5"
                  >
                    <p class="text-lg font-black text-emerald-500 leading-none">
                      100%
                    </p>
                    <p
                      class="text-[7px] font-black uppercase tracking-widest text-slate-400 mt-1"
                    >
                      SLA
                    </p>
                  </div>
                </div>
              </div>
            }
          </div>
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
        --color-dark-elevated: var(--theme-dark-elevated);
      }
    `,
  ],
})
export class SupportComponent {
  chatService = inject(ChatService);
  selectedCustomer = signal<any>(null);

  selectCustomer(customer: any) {
    this.selectedCustomer.set(customer);
  }
}
