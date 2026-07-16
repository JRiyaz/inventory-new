import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, type OnInit, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import {
  CustomDropdownComponent,
  type DropdownOption,
  EmptyStateComponent,
  LoaderComponent,
  PageHeaderComponent,
  SearchService,
  SkeletonComponent,
  StatusBadgeComponent,
} from 'ui-shared';
import { SuppliersService } from './suppliers.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SkeletonComponent,
    CustomDropdownComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    LoaderComponent,
  ],
  template: `
    <div class="p-3 sm:p-5  animate-fade-in">
      <lib-page-header
        title="Suppliers Network"
        subtitle="Manage your global vendor relationships and procurement sources."
        [stats]="service.headerStats()"
        [breadcrumbs]="breadcrumbs"
        [count]="service.allFilteredSuppliers().length"
        [loading]="service.isLoading()"
        [isActionLoading]="service.isActionLoading()"
        actionLabel="Add New Supplier"
        backLink="/inventory"
        (action)="router.navigate(['/inventory/suppliers/create'])"
      ></lib-page-header>

      <!-- Filters & Controls Bar -->
      <div class="mb-6">
        <div class="flex flex-col lg:flex-row justify-between items-end gap-5">
          <!-- Search & Status -->
          <div
            class="flex flex-col sm:flex-row items-end gap-5 w-full lg:w-auto"
          >
            <!-- Search Input -->
            <div class="floating-input-group w-full sm:w-72">
              <input
                type="text"
                [ngModel]="service.searchQuery()"
                (ngModelChange)="service.searchQuery.set($event)"
                placeholder=" "
                class="floating-input"
                id="supplier-search"
              />
              <label class="floating-label" for="supplier-search"
                >Search Suppliers</label
              >
              <div class="absolute right-0 top-7">
                @if (service.searchQuery()) {
                  <button
                    (click)="service.searchQuery.set('')"
                    class="p-1 text-slate-400 hover:text-rose-500 transition-colors"
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
                } @else {
                  <svg
                    class="w-4 h-4 text-slate-400"
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
                }
              </div>
            </div>

            <div class="w-full sm:w-56">
              <lib-custom-dropdown
                [options]="statusOptions"
                [value]="service.statusFilter()"
                [placeholder]="'Filter Status'"
                (valueChange)="
                  service.statusFilter.set($event); service.currentPage.set(1)
                "
              ></lib-custom-dropdown>
            </div>

            <div class="w-full sm:w-40">
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

          <!-- View Toggle -->
          <div
            class="flex items-center gap-4 w-full lg:w-auto justify-end pb-1"
          >
            <span
              class="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2"
              >Layout</span
            >
            <div
              class="flex bg-slate-100 dark:bg-white/[0.05] p-1 rounded-xl border border-slate-200 dark:border-white/[0.08]"
            >
              <button
                (click)="viewType.set('grid')"
                [class.bg-white]="viewType() === 'grid'"
                [class.dark:bg-white/10]="viewType() === 'grid'"
                [class.shadow-md]="viewType() === 'grid'"
                class="p-2.5 rounded-lg transition-all text-slate-500 hover:text-primary"
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
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  ></path>
                </svg>
              </button>
              <button
                (click)="viewType.set('list')"
                [class.bg-white]="viewType() === 'list'"
                [class.dark:bg-white/10]="viewType() === 'list'"
                [class.shadow-md]="viewType() === 'list'"
                class="p-2.5 rounded-lg transition-all text-slate-500 hover:text-primary"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      @if (service.isLoading()) {
        <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (i of [1, 2, 3, 4]; track i) {
            <div
              class="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 space-y-3"
            >
              <lib-skeleton
                width="100%"
                height="100px"
                shape="rounded"
              ></lib-skeleton>
              <lib-skeleton width="75%" height="1rem"></lib-skeleton>
            </div>
          }
        </div>
      } @else {
        <div class="mt-5 animate-fade-in">
          @if (service.allFilteredSuppliers().length > 0) {
            @if (viewType() === "grid") {
              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in"
              >
                @for (
                  supplier of service.paginatedSuppliers();
                  track supplier.id
                ) {
                  <div
                    [routerLink]="[supplier.id]"
                    class="card-premium p-3 hover:border-primary/50 transition-all group cursor-pointer"
                  >
                    <div class="flex items-center gap-3 mb-4">
                      <div
                        class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-xl"
                      >
                        {{ supplier.name[0] }}
                      </div>
                      <div>
                        <h3
                          class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate"
                        >
                          {{ supplier.name }}
                        </h3>
                        <p
                          class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest"
                        >
                          {{ supplier.category }}
                        </p>
                      </div>
                    </div>

                    <div class="space-y-2 mb-4">
                      <div
                        class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                      >
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
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          ></path>
                        </svg>
                        {{ supplier.email }}
                      </div>
                      <div
                        class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                      >
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          ></path>
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          ></path>
                        </svg>
                        {{ supplier.location }}
                      </div>
                    </div>

                    <div
                      class="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/5"
                    >
                      <lib-status-badge
                        [status]="supplier.status"
                        class="scale-75 origin-left"
                      ></lib-status-badge>
                      <span
                        class="text-[10px] font-black text-slate-400 uppercase"
                      >
                        Score:
                        <span class="text-primary"
                          >{{ supplier.reliability }}%</span
                        >
                      </span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="space-y-2 animate-fade-in">
                @for (
                  supplier of service.paginatedSuppliers();
                  track supplier.id
                ) {
                  <div
                    [routerLink]="[supplier.id]"
                    class="card-premium p-2 px-3 flex items-center gap-3 hover:border-primary/50 transition-all shadow-sm group cursor-pointer"
                  >
                    <div
                      class="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-xl flex-shrink-0 flex items-center justify-center text-primary font-black"
                    >
                      {{ supplier.name[0] }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-3 mb-0.5">
                        <h3
                          class="text-sm font-bold text-slate-900 dark:text-white truncate"
                        >
                          {{ supplier.name }}
                        </h3>
                        <span
                          class="px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 rounded text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                        >
                          {{ supplier.category }}
                        </span>
                      </div>
                      <p
                        class="text-xs text-slate-500 dark:text-slate-400 truncate"
                      >
                        {{ supplier.email }} • {{ supplier.location }}
                      </p>
                    </div>
                    <div class="text-right flex flex-col items-end gap-2 pr-4">
                      <lib-status-badge
                        [status]="supplier.status"
                        class="scale-75 origin-right"
                      ></lib-status-badge>
                      <span class="text-[10px] font-black text-slate-400"
                        >Reliability: {{ supplier.reliability }}%</span
                      >
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Pagination (Compact) -->
            <div
              class="mt-6 p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm backdrop-blur-sm"
            >
              <div class="flex items-center gap-4">
                <span
                  class="text-[10px] font-black uppercase text-slate-400 tracking-widest"
                >
                  Records:
                  <span class="text-slate-900 dark:text-white">{{
                    service.paginatedSuppliers().length
                  }}</span>
                  / {{ service.allFilteredSuppliers().length }}
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
          } @else {
            <lib-empty-state
              title="No Suppliers Found"
              message="We couldn't find any vendors matching your current search or status filter."
              actionLabel="Clear Filters"
              (action)="
                service.searchQuery.set('');
                service.statusFilter.set('All Statuses')
              "
            ></lib-empty-state>
          }
        </div>
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
export class SuppliersComponent implements OnInit {
  public service = inject(SuppliersService);
  private searchService = inject(SearchService);
  public router = inject(Router);
  private destroyRef = inject(DestroyRef);

  viewType = signal<'grid' | 'list'>('grid');

  breadcrumbs = [{ label: 'Inventory', link: '/inventory' }, { label: 'Suppliers' }];

  pageSizeOptions: DropdownOption[] = [
    { value: 8, label: '8 Per Page' },
    { value: 16, label: '16 Per Page' },
    { value: 32, label: '32 Per Page' },
    { value: 50, label: '50 Per Page' },
  ];

  statusOptions: DropdownOption[] = [
    { value: 'All Statuses', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Inactive', label: 'Inactive' },
  ];

  constructor() {
    effect(() => {
      // track parameters reactively
      this.service.currentPage();
      this.service.pageSize();
      this.service.searchQuery();
      this.service.statusFilter();

      untracked(() => {
        const sub = this.service.loadSuppliers().subscribe();
        this.destroyRef.onDestroy(() => sub.unsubscribe());
      });
    });
  }

  ngOnInit(): void {
    this.registerSearchProvider();
  }

  private registerSearchProvider(): void {
    this.searchService.registerProvider({
      id: 'inventory-suppliers',
      name: 'Suppliers',
      search: (query: string) => {
        const q = query.toLowerCase();
        const results = this.service
          .suppliers()
          .filter((s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
          .map((s) => ({
            id: `supplier-${s.id}`,
            title: s.name,
            path: `/inventory/suppliers/${s.id}`,
            category: 'Supplier',
            keywords: [s.location, s.status],
          }));
        return of(results);
      },
    });
  }
}
