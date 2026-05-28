import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models';

@Component({
  selector: 'lib-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full autocomplete-container">
      <div class="relative flex items-center">
        <input
          type="text"
          [placeholder]="placeholder()"
          [ngModel]="query()"
          (ngModelChange)="onQueryChange($event)"
          (focus)="isOpen.set(true)"
          class="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none dark:text-white transition-all pl-11"
        />
        <svg
          class="w-5 h-5 absolute left-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
      </div>

      <!-- Glassmorphic Autocomplete Dropdown -->
      @if (isOpen() && filteredItems().length > 0) {
        <ul
          class="absolute z-[9999] left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-2 space-y-1 backdrop-blur-3xl list-none drop-down-container card-premium"
        >
          @for (item of filteredItems(); track item.id) {
            <li
              (click)="selectItem(item)"
              class="flex items-center justify-between p-3 hover:bg-primary/10 rounded-xl cursor-pointer transition-all duration-150 group"
            >
              <div class="flex flex-col">
                <span class="text-xs font-black text-slate-800 dark:text-white group-hover:text-primary transition-colors">
                  {{ item.name }}
                </span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  SKU: {{ item.sku || 'N/A' }}
                </span>
              </div>
              <span class="text-xs font-black text-primary">
                {{ item.price | currency }}
              </span>
            </li>
          }
        </ul>
      } @else if (isOpen() && query().trim() !== '' && filteredItems().length === 0) {
        <div
          class="absolute z-[9999] left-0 right-0 mt-2 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-4 text-center backdrop-blur-3xl card-premium animate-fade-in"
        >
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            No matching products found
          </span>
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
        --color-dark-elevated: var(--theme-dark-elevated);
      }

      .card-premium {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(24px) saturate(180%);
        -webkit-backdrop-filter: blur(24px) saturate(180%);
      }

      .dark .card-premium {
        background: rgba(26, 26, 26, 0.85);
      }

      :root[data-theme='glass'] .card-premium {
        background: var(--glass-bg-light) !important;
        backdrop-filter: var(--glass-blur) !important;
        border: 1px solid var(--glass-border-light) !important;
      }

      :root[data-theme='glass'].dark .card-premium {
        background: var(--glass-bg-dark) !important;
        border: 1px solid var(--glass-border-dark) !important;
      }
    `,
  ],
})
export class AutocompleteComponent {
  items = input<Product[]>([]);
  placeholder = input<string>('Quick search product...');
  selected = output<Product>();

  query = signal<string>('');
  isOpen = signal<boolean>(false);
  private elementRef = inject(ElementRef);

  filteredItems = computed(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.items();
    if (!q) return all.slice(0, 5); // Default to top 5 products

    // Fuzzy matching by name or SKU
    return all.filter((item) => item.name.toLowerCase().includes(q) || (item.sku || '').toLowerCase().includes(q));
  });

  onQueryChange(value: string) {
    this.query.set(value);
    this.isOpen.set(true);
  }

  selectItem(item: Product) {
    this.selected.emit(item);
    this.query.set('');
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
