import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'lib-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [ngClass]="classes()"
      [style.width]="width()"
      [style.height]="height()"
      class="bg-slate-200 dark:bg-white/10 animate-pulse-fast relative overflow-hidden"
    >
      <!-- Shimmer Highlight Layer -->
      <div class="absolute inset-0 shimmer-gradient"></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        width: var(--skeleton-width, auto);
        height: var(--skeleton-height, auto);
      }

      .animate-pulse-fast {
        animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .shimmer-gradient {
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.05) 50%,
          transparent 100%
        );
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
      }

      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
    `,
  ],
})
export class SkeletonComponent {
  width = input<string>('100%');
  height = input<string>('1rem');
  shape = input<'rect' | 'circle' | 'rounded'>('rounded');
  customClass = input<string>('');

  classes = computed(() => {
    const base = this.customClass();
    const shapeClass =
      this.shape() === 'circle' ? 'rounded-full' : this.shape() === 'rounded' ? 'rounded-xl' : 'rounded-none';
    return `${base} ${shapeClass}`;
  });
}
