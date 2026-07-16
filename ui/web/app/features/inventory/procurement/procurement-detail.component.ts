import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DetailLayoutComponent, EmptyStateComponent, SkeletonComponent } from 'ui-shared';
import { ProcurementService } from './procurement.service';

@Component({
  selector: 'app-procurement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonComponent, DetailLayoutComponent, EmptyStateComponent],
  template: `
    <div class="p-3 sm:p-6  min-h-screen animate-fade-in">
      @if (service.isLoading()) {
        <div class="space-y-8 animate-pulse">
          <!-- Header Skeleton -->
          <div class="flex items-center gap-4 mb-8">
            <lib-skeleton
              width="48px"
              height="48px"
              shape="rounded"
            ></lib-skeleton>
            <div class="space-y-2">
              <lib-skeleton width="240px" height="2rem"></lib-skeleton>
              <lib-skeleton width="140px" height="0.875rem"></lib-skeleton>
            </div>
          </div>

          <!-- Top Stats Skeleton -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <lib-skeleton
              width="100%"
              height="80px"
              shape="rounded"
            ></lib-skeleton>
            <lib-skeleton
              width="100%"
              height="80px"
              shape="rounded"
            ></lib-skeleton>
            <lib-skeleton
              width="100%"
              height="80px"
              shape="rounded"
            ></lib-skeleton>
          </div>

          <!-- Main Layout Skeleton -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Content -->
            <div class="lg:col-span-2 space-y-6">
              <div class="card-premium p-6">
                <lib-skeleton
                  width="150px"
                  height="1rem"
                  class="mb-6"
                ></lib-skeleton>
                <div class="space-y-4">
                  @for (i of [1, 2, 3]; track i) {
                    <div
                      class="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/5"
                    >
                      <div class="flex items-center gap-3">
                        <lib-skeleton
                          width="32px"
                          height="32px"
                          shape="rounded"
                        ></lib-skeleton>
                        <div class="space-y-1">
                          <lib-skeleton
                            width="180px"
                            height="0.75rem"
                          ></lib-skeleton>
                          <lib-skeleton
                            width="100px"
                            height="0.5rem"
                          ></lib-skeleton>
                        </div>
                      </div>
                      <lib-skeleton
                        width="60px"
                        height="0.75rem"
                      ></lib-skeleton>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
              <div class="card-premium p-6">
                <lib-skeleton
                  width="100px"
                  height="0.75rem"
                  class="mb-4"
                ></lib-skeleton>
                <div class="flex items-center gap-3 mb-6">
                  <lib-skeleton
                    width="40px"
                    height="40px"
                    shape="circle"
                  ></lib-skeleton>
                  <div class="space-y-1">
                    <lib-skeleton width="120px" height="0.75rem"></lib-skeleton>
                    <lib-skeleton width="80px" height="0.5rem"></lib-skeleton>
                  </div>
                </div>
                <lib-skeleton
                  width="100%"
                  height="1px"
                  class="mb-4"
                ></lib-skeleton>
                <div class="space-y-3">
                  <lib-skeleton width="100%" height="0.5rem"></lib-skeleton>
                  <lib-skeleton width="80%" height="0.5rem"></lib-skeleton>
                </div>
              </div>
              <lib-skeleton
                width="100%"
                height="120px"
                shape="rounded"
              ></lib-skeleton>
            </div>
          </div>
        </div>
      } @else if (order()) {
        <lib-detail-layout
          [title]="'Purchase Order #' + order()?.id"
          [subtitle]="'Ordered on ' + (order()?.date | date: 'mediumDate')"
          [status]="order()?.status || 'Unknown'"
          [statusColor]="getStatusColor(order()?.status)"
          [breadcrumbs]="breadcrumbs()"
          backLink="/inventory/procurement"
          [isLoading]="service.isLoading()"
          [isActionLoading]="service.isActionLoading()"
          actionLabel="Edit PO"
          (action)="editPO()"
        >
          <!-- Top Stats Header Slots -->
          <div top-content class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              class="card-premium p-4 border-l-4 border-l-primary flex items-center gap-4"
            >
              <div
                class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-slate-400">
                  Total Commitment
                </p>
                <p class="text-lg font-black text-slate-900 dark:text-white">
                  {{ order()?.amount | currency }}
                </p>
              </div>
            </div>

            <div
              class="card-premium p-4 border-l-4 border-l-amber-500 flex items-center gap-4"
            >
              <div
                class="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500"
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  ></path>
                </svg>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-slate-400">
                  SKU Count
                </p>
                <p class="text-lg font-black text-slate-900 dark:text-white">
                  {{ order()?.items?.length }} Lines
                </p>
              </div>
            </div>

            <div
              class="card-premium p-4 border-l-4 border-l-emerald-500 flex items-center gap-4"
            >
              <div
                class="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-slate-400">
                  Supplier Response
                </p>
                <p class="text-lg font-black text-slate-900 dark:text-white">
                  Acknowledged
                </p>
              </div>
            </div>
          </div>

          <!-- Main Content Slot -->
          <div tab-content class="space-y-6">
            <div class="card-premium overflow-hidden">
              <div
                class="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between"
              >
                <h3
                  class="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white"
                >
                  Ordered Line Items
                </h3>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr
                      class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5"
                    >
                      <th class="px-6 py-4">Product</th>
                      <th class="px-6 py-4 text-center">Order Qty</th>
                      <th class="px-6 py-4 text-right">Unit Cost</th>
                      <th class="px-6 py-4 text-right">Ext. Cost</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                    @for (item of order()?.items; track item.productId) {
                      <tr
                        class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-3">
                            <div
                              class="w-8 h-8 bg-slate-100 dark:bg-white/10 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors"
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
                                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                ></path>
                              </svg>
                            </div>
                            <div>
                              <p
                                class="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors"
                              >
                                {{ item.name }}
                              </p>
                              <p
                                class="text-[9px] font-black uppercase text-slate-400"
                              >
                                SKU: #{{ item.productId }}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-4 text-center">
                          <span
                            class="text-xs font-black text-slate-700 dark:text-slate-300"
                            >{{ item.qty }}</span
                          >
                        </td>
                        <td class="px-6 py-4 text-right text-xs font-bold">
                          {{ item.price | currency }}
                        </td>
                        <td
                          class="px-6 py-4 text-right text-xs font-black text-primary"
                        >
                          {{ item.price * item.qty | currency }}
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr
                      class="bg-slate-50/50 dark:bg-white/5 font-black text-slate-900 dark:text-white"
                    >
                      <td colspan="3" class="px-6 py-4 text-right text-xs">
                        Total Purchase Value
                      </td>
                      <td class="px-6 py-4 text-right text-base text-primary">
                        {{ order()?.amount | currency }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <!-- Sidebar Content Slot -->
          <div sidebar-info class="space-y-6">
            <div class="card-premium p-6">
              <h3
                class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6"
              >
                Vendor Info
              </h3>
              @if (supplier()) {
                <div class="space-y-4">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-lg font-black"
                    >
                      {{ supplier()?.name?.charAt(0) }}
                    </div>
                    <div>
                      <p
                        class="text-sm font-black text-slate-900 dark:text-white hover:text-primary transition-colors cursor-pointer"
                        [routerLink]="['/inventory/suppliers', supplier()?.id]"
                      >
                        {{ supplier()?.name }}
                      </p>
                      <span
                        class="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black rounded uppercase"
                        >{{ supplier()?.status }}</span
                      >
                    </div>
                  </div>
                  <div
                    class="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold text-slate-400"
                        >Location</span
                      >
                      <span
                        class="text-[10px] font-black text-slate-700 dark:text-slate-300"
                        >{{ supplier()?.location }}</span
                      >
                    </div>
                  </div>
                </div>
              }
            </div>

            <div class="card-premium p-6">
              <h3
                class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6"
              >
                System Meta
              </h3>
              <div class="space-y-4 text-[10px]">
                <div class="flex justify-between">
                  <span class="text-slate-400 font-bold">Created By</span>
                  <span
                    class="text-slate-700 dark:text-white font-black uppercase"
                    >System Admin</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400 font-bold">Priority</span>
                  <span
                    class="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 font-black rounded uppercase"
                    >Normal</span
                  >
                </div>
              </div>
            </div>

            <!-- Cancel Button Card -->
            <div class="card-premium p-6 mt-4">
              <div class="space-y-3">
                <button
                  (click)="cancelPO()"
                  [disabled]="order()?.status === 'Cancelled'"
                  [class.opacity-50]="order()?.status === 'Cancelled'"
                  [class.cursor-not-allowed]="order()?.status === 'Cancelled'"
                  class="w-full py-2.5 bg-rose-500/10 text-[10px] font-black uppercase tracking-widest text-rose-500 rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {{ order()?.status === 'Cancelled' ? 'PO Cancelled' : 'Cancel Purchase Order' }}
                </button>
              </div>
            </div>
          </div>
        </lib-detail-layout>
      } @else {
        <lib-empty-state
          title="PO Not Found"
          message="The purchase order record you're looking for does not exist."
          actionLabel="Back to Procurement"
          (action)="router.navigate(['/inventory/procurement'])"
        ></lib-empty-state>
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
export class ProcurementDetailComponent implements OnInit {
  public service = inject(ProcurementService);
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  orderId = signal<string | null>(null);
  order = computed(() => {
    const id = this.orderId();
    return id ? this.service.getPurchaseOrder(id) : null;
  });

  supplier = computed(() => {
    const o = this.order();
    return o ? this.service.getSupplierById(o.supplierId) : null;
  });

  breadcrumbs = computed(() => [
    { label: 'Inventory', link: '/inventory' },
    { label: 'Procurement', link: '/inventory/procurement' },
    { label: this.order() ? `PO #${this.order()?.id}` : 'Details' },
  ]);

  ngOnInit(): void {
    const subRoute = this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.orderId.set(id);
        this.service.isLoading.set(true);
        const subLoad = this.service.getPurchaseOrdersData().subscribe({
          next: (orders) => {
            this.service.setPurchaseOrders(orders);
            this.service.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error loading purchase orders:', err);
            this.service.isLoading.set(false);
          },
        });
        this.destroyRef.onDestroy(() => subLoad.unsubscribe());
      }
    });
    this.destroyRef.onDestroy(() => subRoute.unsubscribe());
  }

  getStatusColor(status?: string): 'primary' | 'warning' | 'success' | 'danger' {
    switch (status) {
      case 'Draft':
        return 'warning';
      case 'Ordered':
        return 'primary';
      case 'Received':
        return 'success';
      case 'Cancelled':
        return 'danger';
      default:
        return 'primary';
    }
  }

  editPO(): void {
    const o = this.order();
    if (o) {
      this.router.navigate(['/inventory/procurement/stock-order/edit', o.id]);
    }
  }

  cancelPO(): void {
    const o = this.order();
    if (o) {
      const updatedPO = { ...o, status: 'Cancelled' as const };
      this.service.updatePurchaseOrder(updatedPO).subscribe({
        next: () => {
          console.log('Purchase order cancelled successfully');
        },
        error: (err) => console.error('Error cancelling purchase order:', err),
      });
    }
  }
}
