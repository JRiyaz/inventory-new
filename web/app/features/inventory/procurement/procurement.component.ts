import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, type OnInit, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  CustomDropdownComponent,
  type DropdownOption,
  EmptyStateComponent,
  PageHeaderComponent,
  SkeletonComponent,
  StatusBadgeComponent,
} from 'ui-shared';
import { ProcurementService } from './procurement.service';

@Component({
  selector: 'app-procurement',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SkeletonComponent,
    CustomDropdownComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="p-3 sm:p-6  min-h-screen animate-fade-in">
      <lib-page-header
        title="Stock Procurement"
        subtitle="Manage and track all purchase orders sent to industrial suppliers."
        [stats]="service.headerStats()"
        [breadcrumbs]="breadcrumbs"
        [count]="service.allFilteredOrders().length"
        [loading]="service.isLoading()"
        [isActionLoading]="service.isActionLoading()"
        actionLabel="Create Stock Order"
        backLink="/inventory"
        (action)="
          router.navigate(['/inventory/procurement/stock-order/create'])
        "
      ></lib-page-header>

      <!-- Filters Bar -->
      <div
        class="mb-3 flex flex-col lg:flex-row justify-between items-end gap-3 bg-white dark:bg-white/5 p-2 rounded-xl"
      >
        <div class="flex flex-col sm:flex-row items-end gap-3 w-full lg:w-auto">
          <div class="floating-input-group w-full sm:w-60">
            <input
              type="text"
              [ngModel]="service.searchQuery()"
              (ngModelChange)="service.searchQuery.set($event)"
              placeholder=" "
              class="floating-input"
              id="po-search"
            />
            <label class="floating-label" for="po-search"
              >Search PO / Supplier</label
            >
            <div class="absolute right-1 top-6">
              @if (!service.searchQuery()) {
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
              } @else {
                <button
                  (click)="service.searchQuery.set('')"
                  class="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <svg
                    class="w-3.5 h-3.5"
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
              }
            </div>
          </div>

          <div class="w-full sm:w-48">
            <lib-custom-dropdown
              [options]="statusOptions"
              [value]="service.statusFilter()"
              [placeholder]="'Order Status'"
              (valueChange)="
                service.statusFilter.set($event); service.currentPage.set(1)
              "
            ></lib-custom-dropdown>
          </div>
        </div>
      </div>

      @if (service.isLoading()) {
        <div class="card-premium overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none animate-pulse">
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr class="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06]">
                  <th class="px-6 py-4"><lib-skeleton width="50px" height="10px"></lib-skeleton></th>
                  <th class="px-6 py-4"><lib-skeleton width="120px" height="10px"></lib-skeleton></th>
                  <th class="px-6 py-4"><lib-skeleton width="80px" height="10px"></lib-skeleton></th>
                  <th class="px-6 py-4"><lib-skeleton width="80px" height="10px"></lib-skeleton></th>
                  <th class="px-6 py-4 text-right"><div class="flex justify-end"><lib-skeleton width="85px" height="10px"></lib-skeleton></div></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-white/[0.04]">
                @for (x of [1, 2, 3, 4, 5]; track x) {
                  <tr>
                    <td class="px-6 py-4"><lib-skeleton width="70px" height="14px"></lib-skeleton></td>
                    <td class="px-6 py-4">
                      <div class="space-y-1">
                        <lib-skeleton width="160px" height="14px"></lib-skeleton>
                        <lib-skeleton width="90px" height="10px"></lib-skeleton>
                      </div>
                    </td>
                    <td class="px-6 py-4"><lib-skeleton width="60px" height="24px" shape="rounded"></lib-skeleton></td>
                    <td class="px-6 py-4"><lib-skeleton width="100px" height="14px"></lib-skeleton></td>
                    <td class="px-6 py-4 text-right"><div class="flex justify-end"><lib-skeleton width="70px" height="14px"></lib-skeleton></div></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else {
        <div
          class="card-premium overflow-hidden animate-fade-in shadow-xl shadow-slate-200/50 dark:shadow-none"
        >
          @if (service.allFilteredOrders().length > 0) {
            <div class="overflow-x-auto custom-scrollbar">
              <table class="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr
                    class="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06]"
                  >
                    <th
                      (click)="service.toggleSort('id')"
                      class="px-6 py-4 cursor-pointer group"
                    >
                      <div class="flex items-center gap-2">
                        <span
                          class="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors"
                          >PO #</span
                        >
                        <svg
                          class="w-2.5 h-2.5 transition-all duration-300"
                          [class.text-primary]="service.sortField() === 'id'"
                          [class.text-slate-200]="service.sortField() !== 'id'"
                          [class.rotate-180]="
                            service.sortField() === 'id' &&
                            service.sortOrder() === 'desc'
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
                      (click)="service.toggleSort('supplierName')"
                      class="px-6 py-4 cursor-pointer group"
                    >
                      <div class="flex items-center gap-2">
                        <span
                          class="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors"
                          >Supplier</span
                        >
                        <svg
                          class="w-2.5 h-2.5 transition-all duration-300"
                          [class.text-primary]="
                            service.sortField() === 'supplierName'
                          "
                          [class.text-slate-200]="
                            service.sortField() !== 'supplierName'
                          "
                          [class.rotate-180]="
                            service.sortField() === 'supplierName' &&
                            service.sortOrder() === 'desc'
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
                    <th class="px-6 py-4">
                      <span
                        class="text-[9px] font-black uppercase tracking-widest text-slate-400"
                        >Status</span
                      >
                    </th>
                    <th
                      (click)="service.toggleSort('date')"
                      class="px-6 py-4 cursor-pointer group"
                    >
                      <div class="flex items-center gap-2">
                        <span
                          class="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors"
                          >Date</span
                        >
                        <svg
                          class="w-2.5 h-2.5 transition-all duration-300"
                          [class.text-primary]="service.sortField() === 'date'"
                          [class.text-slate-200]="
                            service.sortField() !== 'date'
                          "
                          [class.rotate-180]="
                            service.sortField() === 'date' &&
                            service.sortOrder() === 'desc'
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
                      (click)="service.toggleSort('amount')"
                      class="px-6 py-4 text-right cursor-pointer group"
                    >
                      <div class="flex items-center justify-end gap-2">
                        <span
                          class="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors"
                          >Total Amount</span
                        >
                        <svg
                          class="w-2.5 h-2.5 transition-all duration-300"
                          [class.text-primary]="
                            service.sortField() === 'amount'
                          "
                          [class.text-slate-200]="
                            service.sortField() !== 'amount'
                          "
                          [class.rotate-180]="
                            service.sortField() === 'amount' &&
                            service.sortOrder() === 'desc'
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
                  </tr>
                </thead>
                <tbody
                  class="divide-y divide-slate-100 dark:divide-white/[0.04]"
                >
                  @for (order of service.paginatedOrders(); track order.id) {
                    <tr
                      [routerLink]="['/inventory/procurement', order.id]"
                      class="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-all group cursor-pointer"
                    >
                      <td class="px-6 py-3">
                        <span class="text-xs font-black text-primary"
                          >#{{ order.id }}</span
                        >
                      </td>
                      <td class="px-6 py-3">
                        <div class="flex flex-col">
                          <p
                            class="text-xs font-bold text-slate-900 dark:text-white"
                          >
                            {{ order.supplierName }}
                          </p>
                          <p
                            class="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none"
                          >
                            Primary Vendor
                          </p>
                        </div>
                      </td>
                      <td class="px-6 py-3">
                        <lib-status-badge
                          [status]="order.status"
                          class="scale-90 origin-left"
                        ></lib-status-badge>
                      </td>
                      <td class="px-6 py-3">
                        <span class="text-[10px] font-bold text-slate-500">{{
                          order.date | date: "mediumDate"
                        }}</span>
                      </td>
                      <td class="px-6 py-3 text-right">
                        <span
                          class="text-sm font-black text-slate-900 dark:text-white"
                          >{{ order.amount | currency }}</span
                        >
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination (Compact) -->
            <div
              class="px-5 py-3 bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-200 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <span
                class="text-[10px] font-black uppercase text-slate-400 tracking-widest"
              >
                Records:
                <span class="text-slate-900 dark:text-white">{{
                  service.paginatedOrders().length
                }}</span>
                / {{ service.allFilteredOrders().length }}
              </span>
              <div class="flex items-center gap-2">
                <button
                  [disabled]="service.currentPage() === 1"
                  (click)="service.setPage(service.currentPage() - 1)"
                  class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5 transition-all disabled:opacity-20 text-slate-600 dark:text-slate-400"
                >
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
                </button>
                <div class="flex items-center gap-1">
                  @for (
                    p of [].constructor(service.totalPages());
                    track $index
                  ) {
                    @if ($index < 5 || $index === service.totalPages() - 1) {
                      <button
                        (click)="service.setPage($index + 1)"
                        [class.bg-primary]="
                          $index + 1 === service.currentPage()
                        "
                        [class.text-white]="
                          $index + 1 === service.currentPage()
                        "
                        class="w-8 h-8 rounded-lg text-[10px] font-black transition-all hover:bg-primary/10"
                      >
                        {{ $index + 1 }}
                      </button>
                    }
                  }
                </div>
                <button
                  [disabled]="service.currentPage() === service.totalPages()"
                  (click)="service.setPage(service.currentPage() + 1)"
                  class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5 transition-all disabled:opacity-20 text-slate-600 dark:text-slate-400"
                >
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
                </button>
              </div>
            </div>
          } @else {
            <lib-empty-state
              title="No Purchase Orders"
              message="No stock orders match your current search criteria."
              actionLabel="Create First Order"
              (action)="
                router.navigate(['/inventory/procurement/stock-order/create'])
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
export class ProcurementComponent implements OnInit {
  public service = inject(ProcurementService);
  public router = inject(Router);
  private destroyRef = inject(DestroyRef);

  breadcrumbs = [{ label: 'Inventory', link: '/inventory' }, { label: 'Procurement' }];

  statusOptions: DropdownOption[] = [
    { value: 'All Statuses', label: 'All Statuses' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Ordered', label: 'Ordered' },
    { value: 'Received', label: 'Received' },
    { value: 'Cancelled', label: 'Cancelled' },
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
        const sub = this.service.loadPurchaseOrders().subscribe();
        this.destroyRef.onDestroy(() => sub.unsubscribe());
      });
    });
  }

  ngOnInit(): void {}
}
