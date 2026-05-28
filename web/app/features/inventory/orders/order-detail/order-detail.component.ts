import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DetailLayoutComponent, EmptyStateComponent, SkeletonComponent } from 'ui-shared';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonComponent, DetailLayoutComponent, EmptyStateComponent],
  template: `
    <div class="p-3 sm:p-6 min-h-screen animate-fade-in">
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
          [title]="'Order #' + order()?.id"
          [subtitle]="'Placed on ' + (order()?.date | date: 'mediumDate')"
          [status]="order()?.status || 'Unknown'"
          [statusColor]="getStatusColor(order()?.status)"
          [breadcrumbs]="breadcrumbs()"
          backLink="/inventory/orders"
          [isLoading]="service.isLoading()"
          [isActionLoading]="service.isActionLoading()"
          actionLabel="Edit Order"
          (action)="editOrder()"
        >
          <!-- Refined Stats Header -->
          <div
            top-content
            class="card-premium p-6 flex flex-wrap items-center justify-between gap-8 border-b-4 border-b-primary shadow-xl"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"
              >
                <svg
                  class="w-6 h-6"
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
                <p
                  class="text-[10px] font-black uppercase text-slate-400 tracking-widest"
                >
                  Total Value
                </p>
                <p class="text-xl font-black text-slate-900 dark:text-white">
                  {{ order()?.amount | currency }}
                </p>
              </div>
            </div>

            <div
              class="h-8 w-px bg-slate-100 dark:bg-white/10 hidden md:block"
            ></div>

            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500"
              >
                <svg
                  class="w-6 h-6"
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
                  class="text-[10px] font-black uppercase text-slate-400 tracking-widest"
                >
                  Order Size
                </p>
                <p class="text-xl font-black text-slate-900 dark:text-white">
                  {{ getTotalItems() }} Items
                </p>
              </div>
            </div>

            <div
              class="h-8 w-px bg-slate-100 dark:bg-white/10 hidden md:block"
            ></div>

            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500"
              >
                <svg
                  class="w-6 h-6"
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
                <p
                  class="text-[10px] font-black uppercase text-slate-400 tracking-widest"
                >
                  Payment
                </p>
                <p class="text-xl font-black text-slate-900 dark:text-white">
                  {{ isPaid() ? "Cleared" : "Pending" }}
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
                  Order Line Items
                </h3>
                <span
                  class="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg"
                  >{{ order()?.items?.length }} Items</span
                >
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr
                      class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/5"
                    >
                      <th class="px-6 py-3">Product</th>
                      <th class="px-6 py-3 text-center">Qty</th>
                      <th class="px-6 py-3 text-right">Unit Price</th>
                      <th class="px-6 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                    @for (item of order()?.items; track item.productId) {
                      <tr
                        class="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <td class="px-6 py-3">
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
                                class="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors cursor-pointer"
                                [routerLink]="[
                                  '/inventory/products',
                                  item.productId,
                                ]"
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
                        <td class="px-6 py-3 text-center">
                          <span
                            class="text-xs font-black text-slate-700 dark:text-slate-300"
                            >{{ item.qty }}</span
                          >
                        </td>
                        <td class="px-6 py-3 text-right text-xs font-bold">
                          {{ item.price | currency }}
                        </td>
                        <td
                          class="px-6 py-3 text-right text-xs font-black text-primary"
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
                      <td
                        colspan="3"
                        class="px-6 py-5 text-right text-xs uppercase tracking-widest text-slate-400"
                      >
                        Order Grand Total
                      </td>
                      <td class="px-6 py-5 text-right text-xl text-primary">
                        {{ order()?.amount | currency }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Payment Timeline -->
            <div class="card-premium p-6">
              <h3
                class="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6"
              >
                Payment History
              </h3>
              <div class="space-y-6">
                @for (
                  payment of payments();
                  track payment.id;
                  let last = $last
                ) {
                  <div class="flex gap-4 relative">
                    @if (!last) {
                      <div
                        class="absolute left-[15px] top-8 bottom-[-24px] w-[2px] bg-slate-100 dark:bg-white/5"
                      ></div>
                    }
                    <div
                      class="w-8 h-8 rounded-full border-2 border-white dark:border-[#0f172a] shadow-sm flex items-center justify-center flex-shrink-0 z-10"
                      [class]="
                        payment.status === 'Completed'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      "
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
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                    <div class="flex-1 pt-0.5">
                      <div class="flex items-center justify-between mb-1">
                        <p
                          class="text-xs font-black text-slate-900 dark:text-white"
                        >
                          {{ payment.method }} Payment
                        </p>
                        <p class="text-[10px] font-black text-primary">
                          {{ payment.amount | currency }}
                        </p>
                      </div>
                      <p class="text-[10px] font-bold text-slate-400">
                        {{ payment.date | date: "longDate" }} • Transaction #{{
                          payment.id
                        }}
                      </p>
                    </div>
                  </div>
                } @empty {
                  <div
                    class="py-8 text-center bg-slate-50 dark:bg-white/5 rounded-xl border-2 border-dashed border-slate-100 dark:border-white/10"
                  >
                    <p
                      class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      No payment records found
                    </p>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Sidebar Content Slot -->
          <div sidebar-info class="space-y-6">
            <!-- Customer Info -->
            <div class="card-premium p-6">
              <h3
                class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6"
              >
                Customer Profile
              </h3>
              @if (customer()) {
                <div class="space-y-4">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-lg font-black"
                    >
                      {{ customer()?.name?.charAt(0) }}
                    </div>
                    <div>
                      <p
                        class="text-sm font-black text-slate-900 dark:text-white hover:text-primary transition-colors cursor-pointer"
                        [routerLink]="['/inventory/customers', customer()?.id]"
                      >
                        {{ customer()?.name }}
                      </p>
                      <span
                        class="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black rounded uppercase"
                        >{{ customer()?.status }}</span
                      >
                    </div>
                  </div>
                  <div
                    class="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold text-slate-400"
                        >Customer ID</span
                      >
                      <span
                        class="text-[10px] font-black text-slate-700 dark:text-slate-300"
                        >#{{ customer()?.id }}</span
                      >
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold text-slate-400"
                        >Entity Type</span
                      >
                      <span
                        class="text-[10px] font-black text-slate-700 dark:text-slate-300"
                        >Corporate</span
                      >
                    </div>
                  </div>
                </div>
              } @else {
                <p class="text-xs font-bold text-slate-500">
                  {{ order()?.customer }}
                </p>
              }
            </div>

            <!-- Logistics & Operations -->
            <div class="card-premium p-6">
              <h3
                class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6"
              >
                Logistics & Operations
              </h3>
              <div class="space-y-4">
                <div
                  class="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5"
                >
                  <div class="flex items-center gap-2">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      ></path>
                    </svg>
                    <span class="text-[10px] font-bold text-slate-400"
                      >Priority</span
                    >
                  </div>
                  <span
                    class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase"
                    [class]="
                      order()?.priority
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                    "
                  >
                    {{ order()?.priority ? "Express" : "Standard" }}
                  </span>
                </div>

                <div
                  class="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5"
                >
                  <div class="flex items-center gap-2">
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      ></path>
                    </svg>
                    <span class="text-[10px] font-bold text-slate-400"
                      >Created By</span
                    >
                  </div>
                  <span
                    class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-primary/10 text-primary"
                  >
                    {{ order()?.createdBy || 'Admin' }}
                  </span>
                </div>

                <div
                  class="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5"
                >
                  <div class="flex items-center gap-2">
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      ></path>
                    </svg>
                    <span class="text-[10px] font-bold text-slate-400"
                      >Warehouse</span
                    >
                  </div>
                  <span
                    class="text-[10px] font-black text-slate-700 dark:text-slate-300"
                    >WH-01 Global</span
                  >
                </div>
              </div>
            </div>

            <!-- Actions Card -->
            <div class="card-premium p-6">
              <h3
                class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6"
              >
                Internal Operations
              </h3>
              <div class="space-y-3">
                <button
                  class="w-full py-2.5 bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 rounded-xl border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
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
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    ></path>
                  </svg>
                  Print Invoice
                </button>
                <button
                  (click)="cancelOrder()"
                  [disabled]="order()?.status === 'Cancelled'"
                  [class.opacity-50]="order()?.status === 'Cancelled'"
                  [class.cursor-not-allowed]="order()?.status === 'Cancelled'"
                  class="w-full py-2.5 bg-rose-500/10 text-[10px] font-black uppercase tracking-widest text-rose-500 rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {{ order()?.status === 'Cancelled' ? 'Order Cancelled' : 'Cancel Order' }}
                </button>
              </div>
            </div>
          </div>
        </lib-detail-layout>
      } @else {
        <lib-empty-state
          title="Order Not Found"
          message="We couldn't locate the order record you're looking for. It might have been deleted or archived."
          actionLabel="Back to Orders"
          (action)="router.navigate(['/inventory/orders'])"
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
export class OrderDetailComponent implements OnInit {
  public service = inject(OrdersService);
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  orderId = signal<string | null>(null);
  order = computed(() => {
    const id = this.orderId();
    return id ? this.service.getOrder(id) : null;
  });

  payments = computed(() => {
    const id = this.orderId();
    return id ? this.service.getPaymentsByOrderId(id) : [];
  });

  customer = computed(() => {
    const o = this.order();
    return o ? this.service.getCustomerByName(o.customer) : null;
  });

  breadcrumbs = computed(() => [
    { label: 'Inventory', link: '/inventory' },
    { label: 'Orders', link: '/inventory/orders' },
    { label: this.order() ? `Order #${this.order()?.id}` : 'Details' },
  ]);

  ngOnInit(): void {
    const subRoute = this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.orderId.set(id);
        this.service.isLoading.set(true);
        const subLoad = this.service.getOrderData(id).subscribe({
          next: (data) => {
            this.service.setOrder(data);
            this.service.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error loading order:', err);
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
      case 'Pending':
        return 'warning';
      case 'Processing':
        return 'primary';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'danger';
      default:
        return 'primary';
    }
  }

  getTotalItems(): number {
    return this.order()?.items?.reduce((acc, item) => acc + item.qty, 0) || 0;
  }

  isPaid(): boolean {
    const totalPaid = this.payments().reduce((acc, p) => acc + p.amount, 0);
    return totalPaid >= (this.order()?.amount || 0);
  }

  cancelOrder(): void {
    const o = this.order();
    if (o) {
      const updatedOrder = { ...o, status: 'Cancelled' as const };
      this.service.updateOrder(updatedOrder).subscribe({
        next: () => {
          console.log('Order cancelled successfully');
        },
        error: (err) => console.error('Error cancelling order:', err),
      });
    }
  }

  editOrder(): void {
    const id = this.order()?.id;
    if (id) {
      this.router.navigate(['/inventory/orders/edit', id]);
    }
  }
}
