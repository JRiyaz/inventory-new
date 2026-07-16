import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'lib-empty-state',
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  template: `
    <div
      class="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in"
    >
      <div
        class="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 relative group"
      >
        <div
          class="absolute inset-0 bg-primary/10 rounded-full scale-0 group-hover:scale-125 transition-transform duration-700"
        ></div>
        <svg
          class="w-10 h-10 text-slate-300 group-hover:text-primary transition-colors duration-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            [attr.d]="icon()"
          ></path>
        </svg>
      </div>
      <h3
        class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2"
      >
        {{ title() }}
      </h3>
      <p
        class="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide max-w-xs mb-8"
      >
        {{ message() }}
      </p>

      @if (actionLabel()) {
        <button
          (click)="action.emit()"
          [disabled]="isActionLoading()"
          class="btn-primary-premium flex items-center justify-center min-w-[140px]"
        >
          <lib-loader
            [loading]="isActionLoading()"
            [label]="actionLabel() || ''"
          ></lib-loader>
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class EmptyStateComponent {
  title = input<string>('No records found');
  message = input<string>('Try adjusting your search or filters to find what you are looking for.');
  icon = input<string>('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z');
  actionLabel = input<string | null>(null);
  isActionLoading = input<boolean>(false);

  action = output<void>();
}
