import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { SafeHtmlPipe } from '../../utils/safe-html.pipe';

export interface DropdownOption {
  value: any;
  label: string;
  icon?: string;
  color?: string;
}

@Component({
  selector: 'lib-custom-dropdown',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  template: `
    <div class="relative w-full pt-4 group" id="dropdown-container">
      <button
        type="button"
        (click)="toggle($event)"
        class="w-full flex items-center justify-between bg-transparent border-b-2 border-slate-200 dark:border-white/10 py-2.5 px-1 text-sm font-bold text-slate-900 dark:text-white transition-all hover:border-[var(--theme-primary)] focus:border-[var(--theme-primary)] outline-none group/btn"
      >
        <span class="flex items-center gap-3">
          @if (selectedOption()?.color) {
            <div
              [style.background]="selectedOption()?.color"
              class="w-2 h-2 rounded-full"
            ></div>
          }
          {{ selectedOption()?.label || '' }}
        </span>
        <svg
          class="w-4 h-4 text-slate-400 transition-transform duration-300"
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
        class="absolute left-1 transition-all duration-200 pointer-events-none uppercase font-black tracking-widest text-slate-400"
        [class.text-[10px]]="value() || isOpen()"
        [class.top-0]="value() || isOpen()"
        [class.text-primary]="isOpen()"
        [class.text-xs]="!value() && !isOpen()"
        [class.top-7]="!value() && !isOpen()"
      >
        {{ placeholder() }}
      </label>

      @if (isOpen()) {
        <div
          class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-elevated border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-dropdown-in backdrop-blur-xl"
        >
          <div class="max-h-60 overflow-y-auto custom-scrollbar">
            @for (option of options(); track option.value; let i = $index) {
              <button
                type="button"
                tabindex="-1"
                (click)="select(option)"
                class="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all text-left outline-none hover:bg-primary/10 hover:text-primary"
                [class.text-primary]="
                  option.value === value() || activeItemIndex() === i
                "
                [class.bg-primary/5]="
                  option.value === value() || activeItemIndex() === i
                "
                [class.text-slate-600]="
                  option.value !== value() && activeItemIndex() !== i
                "
                [class.dark:text-slate-300]="
                  option.value !== value() && activeItemIndex() !== i
                "
              >
                @if (option.color) {
                  <div
                    [style.background]="option.color"
                    class="w-2 h-2 rounded-full"
                  ></div>
                }
                @if (option.icon) {
                  <span
                    [innerHTML]="option.icon | safeHtml"
                    class="w-4 h-4 text-slate-400"
                  ></span>
                }
                {{ option.label }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes dropdown-in {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-dropdown-in {
        animation: dropdown-in 0.2s ease-out;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(109, 116, 255, 0.2);
        border-radius: 10px;
      }
    `,
  ],
})
export class CustomDropdownComponent {
  options = input<DropdownOption[]>([]);
  value = input<any>(null);
  placeholder = input<string>('Select Option');
  valueChange = output<any>();

  isOpen = signal(false);
  activeItemIndex = signal(-1);
  private eRef = inject(ElementRef);

  selectedOption = computed(() => {
    return this.options().find((o) => o.value === this.value());
  });

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (!this.isOpen() && (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter')) {
      event.preventDefault();
      this.open();
      return;
    }

    if (this.isOpen()) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.activeItemIndex.update((i) => (i + 1) % this.options().length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.activeItemIndex.update((i) => (i - 1 + this.options().length) % this.options().length);
          break;
        case 'Enter':
          event.preventDefault();
          if (this.activeItemIndex() >= 0) {
            this.select(this.options()[this.activeItemIndex()]);
          } else {
            this.close();
          }
          break;
        case 'Escape':
        case 'Tab':
          this.close();
          break;
      }
    }
  }

  toggle(event: Event) {
    event.stopPropagation();
    this.isOpen() ? this.close() : this.open();
  }

  open() {
    this.isOpen.set(true);
    const currentIndex = this.options().findIndex((o) => o.value === this.value());
    this.activeItemIndex.set(currentIndex >= 0 ? currentIndex : 0);
  }

  close() {
    this.isOpen.set(false);
    this.activeItemIndex.set(-1);
  }

  select(option: DropdownOption) {
    this.valueChange.emit(option.value);
    this.close();
  }
}
