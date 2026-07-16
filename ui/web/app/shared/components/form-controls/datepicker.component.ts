import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';

@Component({
  selector: 'lib-custom-datepicker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="floating-input-group w-full" id="datepicker-container">
      <button
        type="button"
        (click)="toggle($event)"
        [class.border-primary]="isOpen()"
        class="floating-input flex items-center justify-between text-left group"
      >
        <span class="flex items-center gap-3">
          <span class="tracking-tight">{{ formattedDate() }}</span>
        </span>
        <svg
          class="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-transform duration-300"
          [class.rotate-180]="isOpen()"
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
      </button>

      <label
        class="floating-label"
        [class.floating-active]="formattedDate() || isOpen()"
      >
        {{ label() || placeholder() }}
      </label>

      @if (isOpen()) {
        <div
          class="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-dark-elevated border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[100] p-5 animate-datepicker-in backdrop-blur-xl card-premium overflow-hidden"
        >
          <div
            class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400 opacity-50"
          ></div>

          <!-- Calendar Header -->
          <div class="flex items-center justify-between mb-6">
            <button
              (click)="prevMonth()"
              class="p-2 hover:bg-primary/10 rounded-xl text-slate-400 hover:text-primary transition-all active:scale-90"
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
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
            </button>
            <div class="flex flex-col items-center">
              <span
                class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-0.5"
              >
                {{ viewDate().getFullYear() }}
              </span>
              <span
                class="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white"
              >
                {{ monthNames[viewDate().getMonth()] }}
              </span>
            </div>
            <button
              (click)="nextMonth()"
              class="p-2 hover:bg-primary/10 rounded-xl text-slate-400 hover:text-primary transition-all active:scale-90"
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
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </button>
          </div>

          <!-- Weekdays -->
          <div class="grid grid-cols-7 mb-3">
            @for (day of weekDays; track day) {
              <div
                class="text-center text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest py-1"
              >
                {{ day }}
              </div>
            }
          </div>

          <!-- Days Grid -->
          <div class="grid grid-cols-7 gap-1.5">
            @for (day of calendarDays(); track day.date.getTime()) {
              <button
                (click)="selectDate(day.date)"
                [disabled]="!day.isCurrentMonth"
                [class.opacity-30]="!day.isCurrentMonth"
                [class.calendar-selected]="isSelected(day.date)"
                [class.hover:bg-slate-100]="
                  !isSelected(day.date) && day.isCurrentMonth
                "
                [class.dark:hover:bg-white/5]="
                  !isSelected(day.date) && day.isCurrentMonth
                "
                class="aspect-square flex items-center justify-center text-[11px] font-bold rounded-xl transition-all relative group/day"
              >
                @if (isToday(day.date)) {
                  <div
                    class="absolute bottom-1 w-1 h-1 bg-primary rounded-full"
                  ></div>
                }
                <span class="relative z-10">{{ day.date.getDate() }}</span>
              </button>
            }
          </div>

          <!-- Today shortcut -->
          <div
            class="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.05]"
          >
            <button
              (click)="selectToday()"
              class="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors text-center"
            >
              Go to Today
            </button>
          </div>
        </div>
      }
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

      .floating-input-group {
        position: relative;
        padding-top: 0.85rem;
        width: 100%;
      }

      .floating-input {
        width: 100%;
        background: transparent;
        border: none !important;
        border-bottom: 2px solid
          color-mix(in srgb, currentColor, transparent 90%) !important;
        border-radius: 0 !important;
        padding: 0.4rem 0 !important;
        font-size: 0.75rem !important;
        font-weight: 700 !important;
        color: inherit;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        outline: none !important;
        box-shadow: none !important;
      }

      .floating-input:hover,
      .floating-input.border-primary {
        border-bottom-color: var(--theme-primary) !important;
      }

      .floating-label {
        position: absolute;
        top: 1.25rem;
        left: 0;
        font-size: 0.75rem;
        font-weight: 500;
        color: color-mix(in srgb, currentColor, transparent 50%);
        pointer-events: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .floating-active {
        top: 0;
        font-size: 0.6rem;
        font-weight: 800;
        color: var(--theme-primary);
        letter-spacing: 0.1em;
      }

      .animate-datepicker-in {
        animation: datepickerIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      @keyframes datepickerIn {
        from {
          opacity: 0;
          transform: translateY(10px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .calendar-selected {
        background: var(--theme-primary) !important;
        color: white !important;
        box-shadow: 0 4px 12px
          color-mix(in srgb, var(--theme-primary), transparent 60%);
      }

      :root[data-theme='glass'] .card-premium {
        background: var(--glass-bg-light) !important;
        border: 1px solid var(--glass-border-light) !important;
      }

      :root[data-theme='glass'].dark .card-premium {
        background: var(--glass-bg-dark) !important;
        border: 1px solid var(--glass-border-dark) !important;
      }
    `,
  ],
})
export class CustomDatePickerComponent {
  label = input<string>('');
  value = input<string | Date>('');
  placeholder = input<string>('Select Date');
  dateChange = output<string>();

  isOpen = signal(false);
  viewDate = signal(new Date());

  monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  private eRef = inject(ElementRef);

  formattedDate = computed(() => {
    const val = this.value();
    if (!val) return '';
    const date = typeof val === 'string' ? new Date(val) : val;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  });

  calendarDays = computed(() => {
    const date = this.viewDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = firstDay.getDay();
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month filler
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month filler
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  });

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggle(event: Event) {
    event.stopPropagation();
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      const val = this.value();
      if (val) this.viewDate.set(typeof val === 'string' ? new Date(val) : val);
    }
  }

  prevMonth() {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth() {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  selectDate(date: Date) {
    // Return ISO string or custom format
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    this.dateChange.emit(adjustedDate.toISOString().split('T')[0]);
    this.isOpen.set(false);
  }

  isSelected(date: Date): boolean {
    const val = this.value();
    if (!val) return false;
    const current = typeof val === 'string' ? new Date(val) : val;
    return (
      date.getDate() === current.getDate() &&
      date.getMonth() === current.getMonth() &&
      date.getFullYear() === current.getFullYear()
    );
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  selectToday() {
    const today = new Date();
    this.viewDate.set(today);
    this.selectDate(today);
  }
}
