import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'ui-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loadingService.isLoading()) {
      <div
        class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-base transition-all duration-500"
      >
        <!-- Premium Background Effects -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse"
          ></div>
          <div
            class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse"
            style="animation-delay: 2s"
          ></div>
        </div>

        <div class="relative flex flex-col items-center text-center px-6">
          <!-- Logo/Icon Loader -->
          <div class="relative w-24 h-24 mb-8">
            <!-- Inner Rotating Ring -->
            <div
              class="absolute inset-0 border-4 border-slate-200 dark:border-white/5 rounded-2xl"
            ></div>
            <div
              class="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-2xl animate-spin-slow"
            ></div>

            <!-- Outer Pulsing Ring -->
            <div
              class="absolute -inset-4 border border-primary/20 rounded-3xl animate-pulse"
            ></div>

            <!-- Center Content -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div
                class="w-10 h-10 bg-gradient-to-br from-primary to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
              >
                <span class="text-white font-black text-xl">I</span>
              </div>
            </div>
          </div>

          <!-- Text Content -->
          <div class="space-y-3">
            <h2
              class="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase tracking-widest"
            >
              {{ loadingService.loadingText() }}
            </h2>
            <div class="flex items-center justify-center gap-1.5">
              <div
                class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                style="animation-delay: 0s"
              ></div>
              <div
                class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                style="animation-delay: 0.2s"
              ></div>
              <div
                class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                style="animation-delay: 0.4s"
              ></div>
            </div>
          </div>

          <!-- Progress Bar (Indeterminate) -->
          <div
            class="w-48 h-1 bg-slate-200 dark:bg-white/5 rounded-full mt-10 overflow-hidden relative"
          >
            <div
              class="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-primary w-1/2 rounded-full animate-shimmer"
            ></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .animate-spin-slow {
        animation: spin 3s linear infinite;
      }
      .animate-shimmer {
        animation: shimmer 2s infinite linear;
      }
      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(200%);
        }
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoadingComponent {
  loadingService = inject(LoadingService);
}
