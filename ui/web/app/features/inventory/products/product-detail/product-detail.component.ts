import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AuthStateService,
  type Breadcrumb,
  DetailLayoutComponent,
  DisplayImageService,
  StatusBadgeComponent,
} from 'ui-shared';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DetailLayoutComponent, StatusBadgeComponent],
  template: `
    <lib-detail-layout
      [title]="product()?.name || 'Loading...'"
      [subtitle]="product()?.description || 'No description available'"
      [status]="stockStatus()"
      [breadcrumbs]="breadcrumbs()"
      backLink="/inventory/products"
      backLabel="Products"
      [actionLabel]="auth.permissions().can_write ? 'Order More Stock' : ''"
      [editLabel]="auth.permissions().can_write ? 'Edit Product' : ''"
      [tabs]="['Overview', 'Supplier & Logistics', 'Relational Activity']"
      [loading]="service.isActionLoading()"
      (tabChanged)="activeTab.set($event)"
      (action)="handleAction()"
      (edit)="goToEdit()"
      loaderType="bloom"
    >
      <div top-content>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Inventory Health Card -->
          <div
            class="card-premium p-4 flex items-center justify-between gap-6 overflow-hidden"
          >
            <div class="flex items-center gap-4 flex-1">
              <div
                class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400"
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h4
                  class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Inventory Health
                </h4>
                <p class="text-[9px] text-slate-500 font-medium italic mt-0.5">
                  Last audit completed 4 days ago.
                </p>
              </div>
            </div>

            <div class="flex-1 max-w-[200px]">
              <div
                class="flex justify-between items-center text-[9px] font-black uppercase tracking-widest mb-1.5"
              >
                <span class="text-slate-400">Velocity</span>
                <span class="text-emerald-500">Stable</span>
              </div>
              <div
                class="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner"
              >
                <div
                  class="h-full bg-emerald-500 w-3/4 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                ></div>
              </div>
            </div>

            <div
              class="flex items-center gap-4 px-4 border-l border-slate-100 dark:border-white/5"
            >
              <div class="text-center">
                <p
                  class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5"
                >
                  Turn
                </p>
                <p class="text-xs font-black text-slate-900 dark:text-white">
                  4.2x
                </p>
              </div>
              <div class="text-center">
                <p
                  class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5"
                >
                  Fill
                </p>
                <p class="text-xs font-black text-emerald-500">98%</p>
              </div>
            </div>
          </div>

          <!-- Global Node Rank Card -->
          <div
            class="card-premium p-4 flex items-center justify-between gap-6 overflow-hidden"
          >
            <div class="flex items-center gap-4 flex-1">
              <div
                class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"
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
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <div>
                <h4
                  class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Global Node Rank
                </h4>
                <p class="text-[9px] text-slate-500 font-medium italic mt-0.5">
                  Active in APAC Region
                </p>
              </div>
            </div>

            <div class="text-right">
              <p
                class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5"
              >
                Rank Position
              </p>
              <p class="text-xl font-black text-primary">#4</p>
            </div>

            <div class="px-4 border-l border-slate-100 dark:border-white/5">
              <div
                class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest"
              >
                Top 5%
              </div>
            </div>
          </div>
        </div>
      </div>
      @if (displayImageService.displayImage()) {
        <div header-icon>
          <div
            class="w-full h-full bg-primary/10 rounded-2xl flex items-center justify-center text-primary"
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              ></path>
            </svg>
          </div>
        </div>
      }

      <div sidebar-info class="space-y-6">
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Price Point
          </p>
          <p class="text-xl font-black text-primary">
            {{ product()?.price | currency }}
          </p>
        </div>
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Current Stock
          </p>
          <div class="flex items-center gap-2">
            <p class="text-xl font-black text-slate-900 dark:text-white">
              {{ product()?.stock }} Units
            </p>
          </div>
        </div>
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Category
          </p>
          <p
            class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight"
          >
            {{ product()?.category }}
          </p>
        </div>
      </div>

      <div sidebar-extra>
        <div class="flex flex-col gap-2">
          <div
            class="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10"
          >
            <p
              class="text-[8px] font-black text-white/50 uppercase tracking-[0.2em] mb-1"
            >
              Stock Availability
            </p>
            <p class="text-xs font-black text-white">{{ stockStatus() }}</p>
          </div>
        </div>
      </div>

      <div tab-content class="animate-fade-in">
        @if (activeTab() === 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="card-premium p-6">
              <h4
                class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6"
              >
                Market Strategy
              </h4>
              <div class="space-y-4">
                <div
                  class="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex justify-between items-center"
                >
                  <span
                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                    >Target Margin</span
                  >
                  <span class="text-lg font-black text-emerald-500">28.4%</span>
                </div>
                <div
                  class="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex justify-between items-center"
                >
                  <span
                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                    >Market Index</span
                  >
                  <span
                    class="text-lg font-black text-slate-900 dark:text-white"
                    >+12.5%</span
                  >
                </div>
              </div>
            </div>

            <div class="card-premium p-6">
              <h4
                class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6"
              >
                Fulfillment Details
              </h4>
              <div class="space-y-4">
                <div class="flex items-start gap-4">
                  <div
                    class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p
                      class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                    >
                      Standard Lead Time
                    </p>
                    <p class="text-sm font-bold text-slate-900 dark:text-white">
                      14 Business Days
                    </p>
                  </div>
                </div>
                <div class="flex items-start gap-4">
                  <div
                    class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"
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
                      />
                    </svg>
                  </div>
                  <div>
                    <p
                      class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                    >
                      Minimum Stock Threshold
                    </p>
                    <p class="text-sm font-bold text-slate-900 dark:text-white">
                      25 Units (Critical)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        } @else if (activeTab() === 1) {
          <div class="space-y-4">
            <!-- Supplier Link Card -->
            <div
              [routerLink]="
                supplier() ? ['/inventory/suppliers', supplier()?.id] : null
              "
              [class.cursor-pointer]="supplier()"
              class="card-premium p-6 hover:border-primary/50 transition-all group relative overflow-hidden"
            >
              @if (supplier()) {
                <div
                  class="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700"
                ></div>
                <h4
                  class="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center justify-between"
                >
                  Primary Source
                  <svg
                    class="w-4 h-4 text-slate-300 group-hover:text-primary transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M14 5l7 7-7 7"
                    />
                  </svg>
                </h4>
                <div class="flex items-center gap-5">
                  <div
                    class="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm border border-slate-100 dark:border-white/10"
                  >
                    {{ supplier()?.name?.[0] }}
                  </div>
                  <div>
                    <p
                      class="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-tight"
                    >
                      {{ supplier()?.name }}
                    </p>
                    <p
                      class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1"
                    >
                      {{ supplier()?.location }}
                    </p>
                    <lib-status-badge
                      [status]="supplier()?.status || ''"
                      class="mt-3 scale-75 origin-left"
                    ></lib-status-badge>
                  </div>
                </div>
              } @else {
                <p class="text-xs font-bold text-slate-500 italic">
                  No supplier linked
                </p>
              }
            </div>

            <!-- Warehouse Link Card -->
            <div
              [routerLink]="
                warehouse() ? ['/inventory/warehouses', warehouse()?.id] : null
              "
              [class.cursor-pointer]="warehouse()"
              class="card-premium p-6 hover:border-primary/50 transition-all group relative overflow-hidden"
            >
              @if (warehouse()) {
                <div
                  class="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"
                ></div>
                <h4
                  class="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center justify-between"
                >
                  Logistics Node
                  <svg
                    class="w-4 h-4 text-slate-300 group-hover:text-primary transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M14 5l7 7-7 7"
                    />
                  </svg>
                </h4>
                <div class="flex items-center gap-5">
                  <div
                    class="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-amber-500 font-black group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm border border-slate-100 dark:border-white/10"
                  >
                    <svg
                      class="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <p
                      class="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-tight"
                    >
                      {{ warehouse()?.name }}
                    </p>
                    <p
                      class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1"
                    >
                      {{ warehouse()?.location }}
                    </p>
                    <div class="mt-3 flex items-center gap-2">
                      <span
                        class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                        >Load:</span
                      >
                      <span class="text-xs font-black text-primary"
                        >{{ warehouse()?.utilization }}% Capacity</span
                      >
                    </div>
                  </div>
                </div>
              } @else {
                <p class="text-xs font-bold text-slate-500 italic">
                  No warehouse assigned
                </p>
              }
            </div>
          </div>
        } @else if (activeTab() === 2) {
          <div class="space-y-4">
            @for (order of relatedOrders(); track order.id) {
              <div
                [routerLink]="['/inventory/orders', order.id]"
                class="card-premium p-3 flex items-center justify-between group hover:border-primary transition-all cursor-pointer"
              >
                <div class="flex items-center gap-5">
                  <div
                    class="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-all shadow-inner border border-slate-100 dark:border-white/10"
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
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-3 mb-1">
                      <p
                        class="text-sm font-black text-slate-900 dark:text-white"
                      >
                        Order #{{ order.id }}
                      </p>
                      <lib-status-badge
                        [status]="order.status"
                        class="scale-75 origin-left"
                      ></lib-status-badge>
                    </div>
                    <p
                      class="text-[10px] text-slate-400 font-bold uppercase tracking-widest"
                    >
                      {{ order.customerName }} •
                      {{ order.date | date: "mediumDate" }}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-lg font-black text-primary">
                    {{ getQuantityInOrder(order.id) }} Units
                  </p>
                  <p
                    class="text-[9px] text-slate-400 font-black uppercase tracking-widest"
                  >
                    Allocation
                  </p>
                </div>
              </div>
            } @empty {
              <div
                class="text-center py-24 bg-white/50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10"
              >
                <p class="text-slate-400 font-medium italic">
                  No transactional records found for this SKU.
                </p>
              </div>
            }
          </div>
        }
      </div>
    </lib-detail-layout>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ProductDetailComponent implements OnInit {
  public service = inject(ProductsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public displayImageService = inject(DisplayImageService);
  public auth = inject(AuthStateService);
  private destroyRef = inject(DestroyRef);

  activeTab = signal(0);

  productId = computed(() => Number(this.route.snapshot.paramMap.get('id')));
  product = computed(() => this.service.getProduct(this.productId()));

  breadcrumbs = computed<Breadcrumb[]>(() => [
    { label: 'Inventory', link: '/inventory' },
    { label: 'Products', link: '/inventory/products' },
    { label: this.product()?.name || 'Detail' },
  ]);

  supplier = computed(() => {
    const p = this.product();
    return p?.supplierId ? this.service.getSupplierById(p.supplierId) : null;
  });

  warehouse = computed(() => {
    const p = this.product();
    return p?.warehouseId ? this.service.getWarehouseById(p.warehouseId) : null;
  });

  relatedOrders = computed(() => {
    const p = this.product();
    return p ? this.service.getOrdersByProductId(p.id) : [];
  });

  stockStatus = computed(() => {
    const p = this.product();
    if (!p) return 'Unknown';
    if (p.stock === 0) return 'Out of Stock';
    if (p.stock < 20) return 'Low Stock';
    return 'Optimal Stock';
  });

  ngOnInit() {
    this.service.isLoading.set(true);
    const sub = this.service.getProductData(this.productId()).subscribe({
      next: (product) => {
        this.service.updateProductInState(product);
        this.service.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading product detail:', err);
        this.service.isLoading.set(false);
      },
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  goToEdit() {
    this.router.navigate(['/inventory/products', this.productId(), 'edit']);
  }

  handleAction() {
    this.router.navigate(['/inventory/procurement/stock-order/create'], {
      queryParams: { productId: this.productId() },
    });
  }

  getQuantityInOrder(orderId: string): number {
    const p = this.product();
    if (!p) return 0;
    const order = this.relatedOrders().find((o) => o.id === orderId);
    return order?.items.find((i) => i.productId === p.id)?.qty || 0;
  }
}
