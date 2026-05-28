import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, type OnInit, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import {
  CustomDropdownComponent,
  type DropdownOption,
  LoaderComponent,
  PageHeaderComponent,
  SearchService,
  SkeletonComponent,
  StatusBadgeComponent,
} from 'ui-shared';
import { CustomersService } from './customers.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SkeletonComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
    CustomDropdownComponent,
    LoaderComponent,
  ],
  template: `
    <div class="p-3 sm:p-6  min-h-screen animate-fade-in">
      <lib-page-header
        title="Customer Directory"
        subtitle="Manage your business relationships and client history."
        [stats]="service.headerStats()"
        [breadcrumbs]="breadcrumbs"
        [count]="service.allFilteredCustomers().length"
        [loading]="service.isLoading()"
        [isActionLoading]="service.isActionLoading()"
        actionLabel="Add New Customer"
        backLink="/inventory"
        (action)="router.navigate(['/inventory/customers/create'])"
      ></lib-page-header>

      <!-- Filters Bar (High Density) -->
      <div
        class="mb-5 flex flex-col md:flex-row gap-4 items-end bg-white dark:bg-white/5 p-2 rounded-xl"
      >
        <div class="flex-1 w-full relative group">
          <div class="floating-input-group">
            <input
              type="text"
              id="cust-search"
              [ngModel]="service.searchQuery()"
              (ngModelChange)="service.searchQuery.set($event)"
              placeholder=" "
              class="floating-input"
            />
            <label for="cust-search" class="floating-label"
              >Search Customer</label
            >
            <div class="absolute right-1 top-6">
              <svg
                class="w-3.5 h-3.5 text-slate-400"
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
          </div>
        </div>

        <div class="w-full md:w-40">
          <lib-custom-dropdown
            [options]="pageSizeOptions"
            [value]="service.pageSize()"
            [placeholder]="'Per Page'"
            (valueChange)="
              service.pageSize.set($event); service.currentPage.set(1)
            "
          ></lib-custom-dropdown>
        </div>
      </div>

      @if (service.isLoading()) {
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
            <div class="card-premium p-6 space-y-4">
              <div class="flex items-center gap-4">
                <lib-skeleton
                  width="50px"
                  height="50px"
                  shape="rounded"
                ></lib-skeleton>
                <div class="space-y-2 flex-1">
                  <lib-skeleton width="80%" height="1rem"></lib-skeleton>
                  <lib-skeleton width="40%" height="0.5rem"></lib-skeleton>
                </div>
              </div>
              <lib-skeleton width="100%" height="3rem"></lib-skeleton>
            </div>
          }
        </div>
      } @else {
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in"
        >
          @for (customer of service.paginatedCustomers(); track customer.id) {
            <div
              [routerLink]="[customer.id]"
              class="card-premium p-4 group hover:border-primary/50 transition-all cursor-pointer flex flex-col h-full relative overflow-hidden"
            >
              <div class="flex items-center gap-3 mb-4 relative z-10">
                <div
                  class="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-primary font-black text-sm group-hover:bg-primary group-hover:text-white transition-all shadow-sm border border-slate-100 dark:border-white/10"
                >
                  {{ customer.name.charAt(0) }}
                </div>
                <div class="flex-1 min-w-0">
                  <h3
                    class="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors"
                  >
                    {{ customer.name }}
                  </h3>
                  <p
                    class="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate"
                  >
                    {{ customer.company }}
                  </p>
                </div>
              </div>

              <div class="space-y-2 mb-4 flex-1 relative z-10">
                <div
                  class="flex items-center gap-2 text-[10px] font-medium text-slate-600 dark:text-slate-400 p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5"
                >
                  <svg
                    class="w-3.5 h-3.5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span class="truncate">{{ customer.email }}</span>
                </div>
              </div>

              <div
                class="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between relative z-10"
              >
                <div class="flex flex-col">
                  <span
                    class="text-[8px] font-black uppercase tracking-widest text-slate-400"
                    >Since</span
                  >
                  <span
                    class="text-[10px] font-black text-slate-900 dark:text-white"
                    >{{ customer.joinDate | date: "MMM d, yyyy" }}</span
                  >
                </div>
                <lib-status-badge
                  [status]="customer.status"
                  class="scale-90 origin-right"
                ></lib-status-badge>
              </div>
            </div>
          }
        </div>

        <!-- Pagination (Compact) -->
        @if (service.allFilteredCustomers().length > 0) {
          <div
            class="mt-8 p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm shadow-sm"
          >
            <div class="flex items-center gap-4">
              <span
                class="text-[10px] font-black uppercase text-slate-400 tracking-widest"
              >
                Records:
                <span class="text-slate-900 dark:text-white">{{
                  service.paginatedCustomers().length
                }}</span>
                / {{ service.allFilteredCustomers().length }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button
                [disabled]="service.currentPage() === 1"
                (click)="service.setPage(service.currentPage() - 1)"
                class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 hover:border-primary/50 hover:bg-white dark:hover:bg-white/5 transition-all disabled:opacity-20"
              >
                <lib-loader [loading]="service.isLoading()" [type]="'pulse'" [customClass]="'scale-50'">
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
                      d="M15 19l-7-7 7-7"
                    ></path>
                  </svg>
                </lib-loader>
              </button>

              <div class="flex items-center gap-1">
                @for (p of service.pages(); track p) {
                  @if (p <= 5 || p === service.totalPages()) {
                    <button
                      (click)="service.setPage(p)"
                      [class.bg-primary]="service.currentPage() === p"
                      [class.text-white]="service.currentPage() === p"
                      class="w-8 h-8 rounded-lg text-[10px] font-black transition-all hover:bg-primary/10"
                    >
                      {{ p }}
                    </button>
                  }
                }
              </div>

              <button
                [disabled]="service.currentPage() === service.totalPages()"
                (click)="service.setPage(service.currentPage() + 1)"
                class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 hover:border-primary/50 hover:bg-white dark:hover:bg-white/5 transition-all disabled:opacity-20"
              >
                <lib-loader [loading]="service.isLoading()" [type]="'pulse'" [customClass]="'scale-50'">
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
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </lib-loader>
              </button>
            </div>
          </div>
        }

        @if (service.allFilteredCustomers().length === 0) {
          <div
            class="flex flex-col items-center justify-center py-32 bg-white/50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 animate-fade-in"
          >
            <div
              class="w-20 h-20 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center text-slate-400 mb-6"
            >
              <svg
                class="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
            </div>
            <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2">
              No Customers Found
            </h3>
            <p class="text-slate-500 font-medium">
              Try adjusting your search or filters to find what you're looking
              for.
            </p>
          </div>
        }
      }
    </div>
  `,
  styles: [],
})
export class CustomersComponent implements OnInit {
  public service = inject(CustomersService);
  private searchService = inject(SearchService);
  public router = inject(Router);
  private destroyRef = inject(DestroyRef);

  breadcrumbs = [{ label: 'Inventory', link: '/inventory' }, { label: 'Customers' }];

  pageSizeOptions: DropdownOption[] = [
    { value: 12, label: '12 Per Page' },
    { value: 24, label: '24 Per Page' },
    { value: 48, label: '48 Per Page' },
    { value: 100, label: '100 Per Page' },
  ];

  constructor() {
    effect(() => {
      // track parameters reactively
      this.service.currentPage();
      this.service.pageSize();
      this.service.searchQuery();

      untracked(() => {
        const sub = this.service.loadCustomers().subscribe();
        this.destroyRef.onDestroy(() => sub.unsubscribe());
      });
    });
  }

  ngOnInit(): void {
    this.registerSearchProvider();
  }

  private registerSearchProvider(): void {
    this.searchService.registerProvider({
      id: 'inventory-customers',
      name: 'Customers',
      search: (query: string) => {
        const q = query.toLowerCase();
        const results = this.service
          .customers()
          .filter((c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q))
          .map((c) => ({
            id: `cust-${c.id}`,
            title: c.name,
            path: `/inventory/customers/${c.id}`,
            category: 'Customer',
            keywords: [c.company, c.email],
          }));
        return of(results);
      },
    });
  }
}
