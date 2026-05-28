import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'ui-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed z-[9999] flex flex-col gap-3 w-80 sm:w-96 pointer-events-none"
      [style.top]="
        notificationService.config().placement.startsWith('top')
          ? '1rem'
          : 'auto'
      "
      [style.bottom]="
        notificationService.config().placement.startsWith('bottom')
          ? '1rem'
          : 'auto'
      "
      [style.left]="
        notificationService.config().placement.endsWith('left')
          ? '1rem'
          : 'auto'
      "
      [style.right]="
        notificationService.config().placement.endsWith('right')
          ? '1rem'
          : 'auto'
      "
    >
      @for (toast of notificationService.activeToasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-300 relative group"
          [style.animation]="
            (notificationService.config().placement.includes('right')
              ? 'toast-in-right'
              : 'toast-in-left') + ' 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          "
          [ngClass]="{
            'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400':
              toast.type === 'success',
            'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400':
              toast.type === 'error',
            'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400':
              toast.type === 'info',
            'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400':
              toast.type === 'warning',
          }"
        >
          <!-- Icon -->
          <div class="mt-0.5">
            @if (toast.type === 'success') {
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            } @else if (toast.type === 'error') {
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            } @else if (toast.type === 'warning') {
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
            } @else {
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            }
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <h4 class="text-sm font-bold leading-tight">{{ toast.title }}</h4>
              @if (toast.urgent) {
                <span
                  class="px-1.5 py-0.5 bg-red-500 text-[8px] text-white font-black uppercase rounded tracking-wider"
                  >Urgent</span
                >
              }
            </div>
            <p class="text-xs opacity-90 leading-normal">{{ toast.message }}</p>
          </div>

          <button
            (click)="notificationService.removeToast(toast.id)"
            class="text-current opacity-50 hover:opacity-100 transition-opacity p-0.5 -mt-1 -mr-1"
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
      }
    </div>
  `,
  styles: [
    `
      @keyframes toast-in-right {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes toast-in-left {
        from {
          transform: translateX(-100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `,
  ],
})
export class NotificationToastComponent {
  notificationService = inject(NotificationService);
}
