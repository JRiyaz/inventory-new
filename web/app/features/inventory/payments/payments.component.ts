import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, type OnInit, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import {
  CustomDropdownComponent,
  type DropdownOption,
  LoaderComponent,
  NotificationService,
  PageHeaderComponent,
  SearchService,
  SkeletonComponent,
  StatusBadgeComponent,
} from 'ui-shared';
import { PaymentsService } from './payments.service';

@Component({
  selector: 'app-payments',
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
        [title]="headerInfo().title"
        [subtitle]="headerInfo().subtitle"
        [stats]="service.headerStats()"
        [breadcrumbs]="breadcrumbs()"
        [count]="service.allFilteredPayments().length"
        [loading]="service.isLoading()"
        [isActionLoading]="service.isActionLoading()"
        actionLabel="Process Refund"
        backLink="/inventory"
        (action)="initiateRefund()"
      ></lib-page-header>

      <!-- Filters Bar (High Density) -->
      <div
        class="flex flex-col md:flex-row gap-4 mb-5 items-end bg-white dark:bg-white/5 p-2 rounded-xl"
      >
        <div class="flex-1 w-full relative group">
          <div class="floating-input-group">
            <input
              type="text"
              id="pay-search"
              [ngModel]="service.searchQuery()"
              (ngModelChange)="service.searchQuery.set($event)"
              placeholder=" "
              class="floating-input"
            />
            <label for="pay-search" class="floating-label"
              >Filter {{ headerInfo().title }}</label
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

        <div
          class="flex bg-slate-100 dark:bg-white/[0.05] p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-inner"
        >
          @for (
            m of ["All Status", "Completed", "Pending", "Failed"];
            track m
          ) {
            <button
              (click)="service.statusFilter.set(m); service.currentPage.set(1)"
              [class.bg-white]="service.statusFilter() === m"
              [class.dark:bg-white/10]="service.statusFilter() === m"
              [class.shadow-sm]="service.statusFilter() === m"
              [class.text-primary]="service.statusFilter() === m"
              class="px-4 py-1.5 text-[9px] font-black rounded-lg transition-all uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              {{ m }}
            </button>
          }
        </div>
      </div>

      @if (service.isLoading()) {
        <div class="card-premium overflow-hidden">
          <div class="p-6 space-y-4">
            @for (i of [1, 2, 3, 4, 5]; track i) {
              <lib-skeleton
                width="100%"
                height="60px"
                shape="rounded"
              ></lib-skeleton>
            }
          </div>
        </div>
      } @else {
        <div class="card-premium overflow-hidden animate-fade-in">
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead
                class="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06]"
              >
                <tr>
                  <th
                    (click)="toggleSort('id')"
                    class="px-6 py-3.5 cursor-pointer group"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors"
                        >Transaction</span
                      >
                      <svg
                        class="w-2.5 h-2.5 transition-all duration-300"
                        [class.text-primary]="sortField() === 'id'"
                        [class.text-slate-200]="sortField() !== 'id'"
                        [class.rotate-180]="
                          sortField() === 'id' && sortOrder() === 'desc'
                        "
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </th>
                  <th
                    (click)="toggleSort('method')"
                    class="px-6 py-3.5 cursor-pointer group"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors"
                        >Method</span
                      >
                      <svg
                        class="w-2.5 h-2.5 transition-all duration-300"
                        [class.text-primary]="sortField() === 'method'"
                        [class.text-slate-200]="sortField() !== 'method'"
                        [class.rotate-180]="
                          sortField() === 'method' && sortOrder() === 'desc'
                        "
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </th>
                  <th
                    (click)="toggleSort('status')"
                    class="px-6 py-3.5 cursor-pointer group"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors"
                        >Status</span
                      >
                      <svg
                        class="w-2.5 h-2.5 transition-all duration-300"
                        [class.text-primary]="sortField() === 'status'"
                        [class.text-slate-200]="sortField() !== 'status'"
                        [class.rotate-180]="
                          sortField() === 'status' && sortOrder() === 'desc'
                        "
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </th>
                  <th
                    (click)="toggleSort('amount')"
                    class="px-6 py-3.5 text-right cursor-pointer group"
                  >
                    <div class="flex items-center justify-end gap-2">
                      <span
                        class="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors"
                        >Amount</span
                      >
                      <svg
                        class="w-2.5 h-2.5 transition-all duration-300"
                        [class.text-primary]="sortField() === 'amount'"
                        [class.text-slate-200]="sortField() !== 'amount'"
                        [class.rotate-180]="
                          sortField() === 'amount' && sortOrder() === 'desc'
                        "
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </th>
                  <th class="px-6 py-3.5"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 dark:divide-white/[0.04]">
                @for (
                  payment of service.paginatedPayments();
                  track payment.id
                ) {
                  <tr
                    class="group hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer"
                    [routerLink]="['/inventory/payments', payment.id]"
                  >
                    <td class="px-6 py-2.5">
                      <p
                        class="text-xs font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors"
                      >
                        {{ payment.id }}
                      </p>
                      <p
                        class="text-[9px] text-slate-400 font-bold uppercase tracking-widest"
                      >
                        {{ payment.date | date: "MMM d, yyyy" }}
                      </p>
                    </td>
                    <td class="px-6 py-2.5">
                      <div class="flex items-center gap-2">
                        <div
                          class="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors border border-slate-100 dark:border-white/10"
                        >
                          @if (payment.method === "Stripe") {
                            <svg
                              class="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M13.962 10.935c0-1.103.623-1.756 1.826-1.756 1.577 0 2.431 1.253 2.431 1.253l1.869-1.428s-1.418-2.38-4.591-2.38c-3.41 0-5.405 2.022-5.405 4.931 0 5.316 7.439 4.457 7.439 6.756 0 1.383-1.231 1.977-2.71 1.977-1.787 0-3.396-1.45-3.396-1.45l-1.926 1.698s1.753 2.127 5.55 2.127c3.48 0 6.519-1.841 6.519-5.185.001-5.452-7.61-4.654-7.61-6.544zM3.697 10.37h3.919V6.659H3.697v3.711zm0 2.226h3.919V22.5H3.697V12.596zm15.774-2.226h3.919V6.659h-3.919v3.711zm0 2.226h3.919V22.5h-3.919V12.596zM11.529 10.37h3.919V6.659h-3.919v3.711zm0 2.226h3.919V22.5h-3.919V12.596z"
                              />
                            </svg>
                          } @else {
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
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                          }
                        </div>
                        <span
                          class="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest"
                          >{{ payment.method }}</span
                        >
                      </div>
                    </td>
                    <td class="px-6 py-2.5">
                      <lib-status-badge
                        [status]="payment.status"
                        class="scale-90 origin-left"
                      ></lib-status-badge>
                    </td>
                    <td class="px-6 py-2.5 text-right">
                      <p
                        class="text-sm font-black text-slate-900 dark:text-white"
                      >
                        {{ payment.amount | currency }}
                      </p>
                    </td>
                    <td class="px-6 py-2.5 text-right">
                      <svg
                        class="w-4 h-4 text-slate-200 group-hover:text-primary group-hover:translate-x-0.5 transition-all inline"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination (Compact) -->
          @if (service.allFilteredPayments().length > 0) {
            <div
              class="px-5 py-3 bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-200 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div class="flex items-center gap-4">
                <span
                  class="text-[10px] font-black uppercase text-slate-400 tracking-widest"
                >
                  Records:
                  <span class="text-slate-900 dark:text-white">{{
                    service.paginatedPayments().length
                  }}</span>
                  / {{ service.allFilteredPayments().length }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  [disabled]="service.currentPage() === 1"
                  (click)="service.setPage(service.currentPage() - 1)"
                  class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5 transition-all disabled:opacity-20"
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
        </div>

        @if (service.allFilteredPayments().length === 0) {
          <div
            class="py-20 text-center bg-white/50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 mt-8"
          >
            <p class="text-slate-400 font-medium italic">
              No transactions match your current search criteria.
            </p>
          </div>
        }
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
export class PaymentsComponent implements OnInit {
  public service = inject(PaymentsService);
  private route = inject(ActivatedRoute);
  private searchService = inject(SearchService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  sortField = this.service.sortField;
  sortOrder = this.service.sortOrder;

  headerInfo = computed(() => {
    const type = this.route.snapshot.data['type'] || 'global';
    switch (type) {
      case 'sales':
        return {
          title: 'Sales Ledger',
          subtitle: 'Monitor all inbound payments and revenue streams from customers.',
        };
      case 'procurement':
        return {
          title: 'Procurement Ledger',
          subtitle: 'Track outbound transactions and expenditures for stock and supplies.',
        };
      default:
        return {
          title: 'Unified Ledger',
          subtitle: 'Consolidated financial records across the entire organization.',
        };
    }
  });

  breadcrumbs = computed(() => [{ label: 'Inventory', link: '/inventory' }, { label: this.headerInfo().title }]);

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
      this.service.statusFilter();
      this.service.sortField();
      this.service.sortOrder();

      untracked(() => {
        const sub = this.service.loadPayments().subscribe();
        this.destroyRef.onDestroy(() => sub.unsubscribe());
      });
    });
  }

  ngOnInit(): void {
    this.registerSearchProvider();
  }

  private registerSearchProvider(): void {
    this.searchService.registerProvider({
      id: 'inventory-payments',
      name: 'Payments',
      search: (query: string) => {
        const q = query.toLowerCase();
        const results = this.service
          .payments()
          .filter((p) => p.id.toLowerCase().includes(q) || p.method.toLowerCase().includes(q))
          .map((p) => ({
            id: `payment-${p.id}`,
            title: `Payment ${p.id}`,
            path: `/inventory/payments/${p.id}`,
            category: 'Payment',
            keywords: [p.method, p.status, p.reference],
          }));
        return of(results);
      },
    });
  }

  toggleSort(field: string) {
    this.service.toggleSort(field);
  }

  initiateRefund(): void {
    this.notificationService.success(
      'Refund Engine Ready',
      'Please select a completed transaction to initiate the refund process.',
    );
  }
}
