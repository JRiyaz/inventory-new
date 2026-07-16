import { CommonModule } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'ui-notification-sidenav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[60] pointer-events-none">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
        (click)="close.emit()"
      ></div>

      <!-- Sidenav -->
      <aside
        class="absolute top-0 right-0 h-full w-80 sm:w-96 bg-white dark:bg-dark-surface border-l border-slate-200 dark:border-white/[0.08] shadow-2xl pointer-events-auto flex flex-col animate-slide-in transition-all duration-300"
      >
        <!-- Header -->
        <div
          class="p-6 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between"
        >
          <div>
            <h2
              class="text-xl font-black tracking-tight text-slate-900 dark:text-white"
            >
              Notifications
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Keep track of your latest updates
            </p>
          </div>
          <button
            (click)="close.emit()"
            class="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
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

        <!-- Notification List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3 sidebar-scroll">
          @for (n of notificationService.notifications(); track n.id) {
            <div
              (click)="onItemClick(n)"
              [class.cursor-pointer]="n.link"
              class="p-4 rounded-2xl border transition-all duration-200 group relative"
              [ngClass]="{
                'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06]':
                  n.read,
                'bg-white dark:bg-white/[0.04] border-primary/20 dark:border-primary/30 shadow-sm':
                  !n.read,
              }"
            >
              <div class="flex gap-3">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  [ngClass]="{
                    'bg-emerald-500/10 text-emerald-500': n.type === 'success',
                    'bg-rose-500/10 text-rose-500': n.type === 'error',
                    'bg-blue-500/10 text-blue-500': n.type === 'info',
                    'bg-amber-500/10 text-amber-500': n.type === 'warning',
                  }"
                >
                  @if (n.type === 'success') {
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  } @else if (n.type === 'error') {
                    <svg
                      class="w-4 h-4"
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
                  } @else if (n.type === 'warning') {
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      ></path>
                    </svg>
                  } @else {
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  }
                </div>
                <div class="flex-1 min-w-0 pr-6">
                  <h5
                    class="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1"
                  >
                    {{ n.title }}
                  </h5>
                  <p
                    class="text-xs text-slate-500 dark:text-slate-400 leading-normal"
                  >
                    {{ n.message }}
                  </p>
                  <p
                    class="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-2"
                  >
                    {{ n.timestamp | date: 'shortTime' }}
                  </p>
                </div>
              </div>

              <!-- Item Close/Delete Button -->
              <button
                (click)="notificationService.removeNotification(n.id)"
                class="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg
                  class="w-4 h-4"
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
          } @empty {
            <div
              class="h-full flex flex-col items-center justify-center text-center p-8 opacity-50"
            >
              <div
                class="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4"
              >
                <svg
                  class="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  ></path>
                </svg>
              </div>
              <p class="text-sm font-bold text-slate-900 dark:text-white">
                All caught up!
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                No new notifications at the moment.
              </p>
            </div>
          }
        </div>

        <!-- Footer -->
        <div
          class="p-4 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-black/10"
        >
          <button
            (click)="notificationService.clearAll()"
            class="w-full py-2.5 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-rose-500 transition-colors"
          >
            Clear All Notifications
          </button>
        </div>
      </aside>
    </div>
  `,
  styles: [
    `
      @keyframes slide-in {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }
      .animate-slide-in {
        animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .sidebar-scroll::-webkit-scrollbar {
        width: 4px;
      }
      .sidebar-scroll::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
      }
      .dark .sidebar-scroll::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.05);
      }
    `,
  ],
})
export class NotificationSidenavComponent {
  notificationService = inject(NotificationService);
  close = output<void>();
  private router = inject(Router);

  onItemClick(n: any) {
    this.notificationService.markAsRead(n.id);
    if (n.link) {
      this.router.navigateByUrl(n.link);
      this.close.emit();
    }
  }
}
