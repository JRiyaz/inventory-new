import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { type Breadcrumb, DetailLayoutComponent } from 'ui-shared';
import { SuppliersService } from '../suppliers.service';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DetailLayoutComponent],
  template: `
    <lib-detail-layout
      [title]="supplier()?.name || 'Loading...'"
      [subtitle]="
        (supplier()?.category || '') + ' • ' + (supplier()?.location || '')
      "
      [status]="supplier()?.status || 'Active'"
      [breadcrumbs]="breadcrumbs()"
      backLink="/inventory/suppliers"
      backLabel="Suppliers"
      actionLabel="Create Purchase Order"
      editLabel="Edit Supplier"
      [tabs]="['Overview', 'Products', 'Purchase Orders', 'Compliance']"
      [loading]="service.isActionLoading()"
      (tabChanged)="activeTab.set($event)"
      (action)="handleAction()"
      (edit)="goToEdit()"
      loaderType="bloom"
    >
      <div top-content>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Reliability Card -->
          <div
            class="card-premium p-4 flex items-center justify-between gap-6 overflow-hidden"
          >
            <div class="flex items-center gap-4 flex-1">
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
                <h4
                  class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Reliability Score
                </h4>
                <p class="text-[9px] text-slate-500 font-medium italic mt-0.5">
                  Based on last 50 shipments.
                </p>
              </div>
            </div>

            <div class="flex-1 max-w-[200px]">
              <div
                class="flex justify-between items-center text-[9px] font-black uppercase tracking-widest mb-1.5"
              >
                <span class="text-slate-400">Trust Level</span>
                <span class="text-emerald-500"
                  >{{ supplier()?.reliability }}%</span
                >
              </div>
              <div
                class="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner"
              >
                <div
                  class="h-full bg-emerald-500 transition-all duration-1000"
                  [style.width.%]="supplier()?.reliability"
                ></div>
              </div>
            </div>
          </div>

          <!-- Partner Rank Card -->
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h4
                  class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Global Partner Rank
                </h4>
                <p class="text-[9px] text-slate-500 font-medium italic mt-0.5">
                  Tier 1 Strategic Vendor
                </p>
              </div>
            </div>

            <div class="text-right px-4">
              <p
                class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5"
              >
                Global Rank
              </p>
              <p class="text-xl font-black text-primary">#12</p>
            </div>
          </div>
        </div>
      </div>
      <div header-icon>{{ supplier()?.name?.[0] }}</div>

      <div sidebar-info class="space-y-6">
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Email Address
          </p>
          <p class="text-sm font-bold text-slate-900 dark:text-white">
            {{ supplier()?.email }}
          </p>
        </div>
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Phone Number
          </p>
          <p class="text-sm font-bold text-slate-900 dark:text-white">
            {{ supplier()?.phone }}
          </p>
        </div>
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Location
          </p>
          <p class="text-sm font-bold text-slate-900 dark:text-white">
            {{ supplier()?.location }}
          </p>
        </div>
        <div class="pt-4 border-t border-slate-100 dark:border-white/5">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"
          >
            Supply Capacity
          </p>
          <p class="text-xs font-bold text-slate-900 dark:text-white uppercase">
            High Volume
          </p>
        </div>
      </div>

      <div sidebar-extra>
        <h4
          class="text-white text-xs font-black uppercase tracking-widest mb-2"
        >
          Quick Note
        </h4>
        <p class="text-white/60 text-[11px] leading-relaxed">
          This supplier has been a partner since 2022. They specialize in
          high-precision electronics and have a consistent delivery record.
        </p>
      </div>

      <div tab-content class="animate-fade-in">
        @if (activeTab() === 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="card-premium p-6">
              <h4
                class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4"
              >
                Supply Statistics
              </h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <p class="text-[10px] font-black text-slate-400 uppercase">
                    Active Products
                  </p>
                  <p class="text-2xl font-black text-slate-900 dark:text-white">
                    {{ products().length }}
                  </p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <p class="text-[10px] font-black text-slate-400 uppercase">
                    Total Orders
                  </p>
                  <p class="text-2xl font-black text-slate-900 dark:text-white">
                    124
                  </p>
                </div>
              </div>
            </div>
            <div class="card-premium p-6">
              <h4
                class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4"
              >
                Financial Overview
              </h4>
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-xs text-slate-500 font-medium"
                    >Total Spend</span
                  >
                  <span
                    class="text-sm font-black text-slate-900 dark:text-white"
                    >$452,000</span
                  >
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-xs text-slate-500 font-medium"
                    >Pending Payments</span
                  >
                  <span class="text-sm font-black text-amber-500">$12,400</span>
                </div>
              </div>
            </div>
          </div>
        } @else if (activeTab() === 1) {
          <div class="space-y-4">
            @for (product of products(); track product.id) {
              <div
                [routerLink]="['/inventory/products', product.id]"
                class="card-premium p-4 flex items-center gap-4 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div
                  class="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors"
                >
                  <svg
                    class="w-6 h-6 text-slate-400 group-hover:text-primary"
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
                <div class="flex-1">
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                    {{ product.name }}
                  </h4>
                  <p
                    class="text-[10px] text-slate-500 uppercase tracking-widest"
                  >
                    {{ product.category }}
                  </p>
                </div>
                <div class="text-right px-4">
                  <p class="text-xs font-black text-slate-900 dark:text-white">
                    {{ product.price | currency }}
                  </p>
                  <p
                    class="text-[10px] text-slate-500 uppercase tracking-widest"
                  >
                    Stock: {{ product.stock }}
                  </p>
                </div>
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
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </div>
            } @empty {
              <div
                class="text-center py-20 bg-white/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10"
              >
                <p class="text-slate-500 font-medium">
                  No products linked to this supplier.
                </p>
              </div>
            }
          </div>
        } @else if (activeTab() === 2) {
          <div class="text-center py-20">
            <p class="text-slate-500 font-medium italic">
              Purchase order history loading...
            </p>
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
export class SupplierDetailComponent implements OnInit {
  public service = inject(SuppliersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  activeTab = signal(0);

  supplierId = computed(() => this.route.snapshot.paramMap.get('id') || '');
  supplier = computed(() => this.service.getSupplier(this.supplierId()));

  breadcrumbs = computed<Breadcrumb[]>(() => [
    { label: 'Inventory', link: '/inventory' },
    { label: 'Suppliers', link: '/inventory/suppliers' },
    { label: this.supplier()?.name || 'Detail' },
  ]);

  products = computed(() => this.service.getProductsBySupplierId(this.supplierId()));

  ngOnInit() {
    this.service.isLoading.set(true);
    const sub = this.service.getSupplierData(this.supplierId()).subscribe({
      next: (data) => {
        this.service.setSupplier(data);
        this.service.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading supplier details:', err);
        this.service.isLoading.set(false);
      },
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  goToEdit() {
    const id = this.supplierId();
    if (id) {
      this.router.navigate(['/inventory/suppliers', id, 'edit']);
    }
  }

  handleAction() {
    this.router.navigate(['/inventory/procurement/stock-order/create'], {
      queryParams: { supplierId: this.supplierId() },
    });
  }
}
