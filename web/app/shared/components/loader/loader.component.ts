import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { type LoaderType, ThemeService } from '../../services/theme.service';

export type { LoaderType };

@Component({
  selector: 'lib-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="relative flex items-center justify-center min-h-[1.5em] w-full h-full"
      [style.--loader-speed]="themeService.animationSpeed()"
    >
      <!-- Loader Animation -->
      @if (isAnimating()) {
        <div
          [class]="containerClass()"
          [ngClass]="customClass()"
          class="animate-fade-in"
        >
          @if (actualType() === 'jitter') {
            <div class="jitter-loader">
              <span></span><span></span><span></span><span></span><span></span
              ><span></span><span></span><span></span>
            </div>
          } @else if (actualType() === 'windows') {
            <div class="windows-loader">
              <span></span><span></span><span></span><span></span><span></span
              ><span></span><span></span><span></span>
            </div>
          } @else if (actualType() === 'bloom') {
            <div class="bloom-loader">
              <span></span><span></span><span></span><span></span><span></span
              ><span></span>
            </div>
          } @else if (actualType() === 'flower') {
            <div class="flower-loader">
              <span></span><span></span><span></span><span></span><span></span
              ><span></span>
            </div>
          } @else if (actualType() === 'gravity') {
            <div class="gravity-orbit"><span></span><span></span></div>
          } @else if (actualType() === 'pulse') {
            <div class="pulse-rings"><span></span><span></span></div>
          } @else if (actualType() === 'liquid') {
            <div class="liquid-pulse"></div>
          }
        </div>
      }

      <!-- Label/Content -->
      <span
        [class.opacity-0]="isAnimating()"
        [class.scale-95]="isAnimating()"
        class="transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2"
      >
        <ng-content></ng-content>
        @if (label()) {
          {{ label() }}
        }
      </span>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        width: 100%;
        height: 100%;
        vertical-align: middle;
      }
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `,
  ],
})
export class LoaderComponent {
  public themeService = inject(ThemeService);

  loading = input<boolean>(false);
  label = input<string>('');
  type = input<LoaderType | undefined>(undefined);
  customClass = input<string | string[] | { [key: string]: boolean }>('');
  containerClass = input<string>('absolute inset-0 flex items-center justify-center');

  actualType = computed(() => this.type() || this.themeService.currentLoader());

  // Internal state to hold the loader visible for a minimum time
  private internalLoading = signal(false);
  private lastStartTime = 0;

  isAnimating = computed(() => this.internalLoading());

  constructor() {
    effect(() => {
      const externalLoading = this.loading();
      const minDuration = this.themeService.loaderDuration();

      if (externalLoading) {
        this.lastStartTime = Date.now();
        this.internalLoading.set(true);
      } else {
        const elapsed = Date.now() - this.lastStartTime;
        const remaining = Math.max(0, minDuration - elapsed);

        if (remaining > 0) {
          setTimeout(() => {
            // Only hide if the input hasn't become true again in the meantime
            if (!this.loading()) {
              this.internalLoading.set(false);
            }
          }, remaining);
        } else {
          this.internalLoading.set(false);
        }
      }
    });
  }
}
