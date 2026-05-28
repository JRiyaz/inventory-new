import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { LoaderComponent, PageHeaderComponent, TypewriterComponent, UiChartComponent } from 'ui-shared';
import { InventoryService } from './inventory.service';

@Component({
  selector: 'app-inventory-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, UiChartComponent, LoaderComponent, TypewriterComponent],
  template: `
    <div class="p-3 sm:p-5  animate-fade-in">
      <lib-page-header
        title="Inventory Hub"
        subtitle="Global overview of your supply chain, orders, and fulfillment operations."
        [stats]="service.headerStats()"
        [breadcrumbs]="breadcrumbs"
        [loading]="service.isLoading()"
        actionLabel="Manage Settings"
        backLink="/inventory"
      ></lib-page-header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (module of modules; track module.path) {
          <div
            [routerLink]="module.path"
            class="card-premium p-6 group cursor-pointer hover:border-primary/50 transition-all flex flex-col h-full"
          >
            <div class="flex items-center gap-4 mb-6">
              <div
                class="w-14 h-14 rounded-2xl flex items-center justify-center text-primary transition-all group-hover:scale-110 shadow-lg shadow-primary/5 group-hover:shadow-primary/20"
                [ngClass]="module.bgClass"
              >
                <div [innerHTML]="sanitize(module.icon)" class="w-7 h-7"></div>
              </div>
              <div>
                <h3
                  class="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors"
                >
                  {{ module.name }}
                </h3>
                <p
                  class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  {{ module.subtitle }}
                </p>
              </div>
            </div>

            <p
              class="text-sm text-slate-600 dark:text-slate-400 mb-8 flex-1 font-medium italic"
            >
              {{ module.description }}
            </p>

            <div
              class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5"
            >
              <div class="flex flex-col">
                <span
                  class="text-[9px] font-black uppercase tracking-widest text-slate-400"
                  >Live Count</span
                >
                <div class="h-6 flex items-center">
                  @if (service.isLoading()) {
                    <div class="dots-wave scale-75 origin-left">
                      <span class="!bg-primary"></span>
                      <span class="!bg-primary"></span>
                      <span class="!bg-primary"></span>
                    </div>
                  } @else {
                    <span
                      class="text-xl font-black text-slate-900 dark:text-white animate-scale-in"
                    >
                      {{ getCount(module.count) }}
                    </span>
                  }
                </div>
              </div>
              <div
                class="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all"
              >
                <svg
                  class="w-5 h-5 transition-transform group-hover:translate-x-0.5"
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
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Quick Activity / Recent Sync -->
      <div class="mt-12">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-1.5 h-6 bg-primary rounded-full"></div>
          <h2
            class="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white"
          >
            Regional Node Performance
          </h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ui-chart
            type="area"
            title="Regional Fulfillment Trends"
            subtitle="Global order processing volume across major hubs (Last 6 Months)"
            [data]="fulfillmentData"
          ></ui-chart>

          <ui-chart
            type="bar"
            title="Warehouse Utilization"
            subtitle="Current stock capacity by regional node"
            [data]="utilizationData"
          ></ui-chart>
        </div>

        <div
          class="mt-6 card-premium p-6 flex flex-col justify-center text-center bg-primary/5 border-primary/20"
        >
          <p
            class="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-2"
          >
            Automated Insights
          </p>
          <p
            class="text-slate-700 dark:text-slate-200 text-sm font-medium italic mb-4 h-10 flex items-center justify-center"
          >
            <lib-typewriter
              [words]="[
                'Your warehouse in Asia Pacific is reaching 91% capacity.',
                'Consider rerouting upcoming shipments to Europe Node B.',
                'Demand for Electronics is projected to spike by 15% next month.',
                'Supplier reliability in NA East has improved by 8% this quarter.',
              ]"
              [typeSpeed]="40"
              [deleteSpeed]="20"
              [delayBetweenWords]="4000"
            ></lib-typewriter>
          </p>
          <button
            (click)="handleOptimize()"
            [disabled]="service.isActionLoading()"
            class="btn-primary-premium mx-auto min-w-[160px]"
          >
            <lib-loader
              [loading]="service.isActionLoading()"
              label="Optimize Logistics"
            ></lib-loader>
          </button>
        </div>
      </div>
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
export class InventoryComponent implements OnInit {
  public service = inject(InventoryService);
  private sanitizer = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);

  sanitize(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getCount(countFn: any): string | number {
    const value = countFn();
    return Array.isArray(value) ? value.length : value;
  }

  breadcrumbs = [{ label: 'Inventory' }];

  modules = [
    {
      name: 'Products',
      subtitle: 'Catalog & Stock',
      path: '/inventory/products',
      description: 'Manage your master item catalog, price lists, and global stock levels across all regions.',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>',
      bgClass: 'bg-blue-500/10',
      count: this.service.products,
    },
    {
      name: 'Orders',
      subtitle: 'Fulfillment',
      path: '/inventory/orders',
      description: 'Track customer orders from placement to delivery. Monitor priority fulfillment and backorders.',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>',
      bgClass: 'bg-amber-500/10',
      count: this.service.orders,
    },
    {
      name: 'Customers',
      subtitle: 'CRM & Insights',
      path: '/inventory/customers',
      description: 'Analyze customer buying patterns, manage account standings, and view lifetime purchase history.',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m12-10a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>',
      bgClass: 'bg-emerald-500/10',
      count: this.service.customers,
    },
    {
      name: 'Suppliers',
      subtitle: 'Procurement',
      path: '/inventory/suppliers',
      description: 'Coordinate with vendors, manage reliability scores, and monitor upstream supply chain health.',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>',
      bgClass: 'bg-rose-500/10',
      count: this.service.suppliers,
    },
    {
      name: 'Warehouses',
      subtitle: 'Logistics',
      path: '/inventory/warehouses',
      description: 'Optimize physical storage, manage zone allocation, and monitor warehouse utilization rates.',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>',
      bgClass: 'bg-purple-500/10',
      count: this.service.warehouses,
    },
    {
      name: 'Payments',
      subtitle: 'Ledger',
      path: '/inventory/payments',
      description: 'Consolidate financial transactions, monitor revenue flow, and track outstanding settlements.',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 8h6m-2 2a2 2 0 110 4h-2a2 2 0 110-4zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      bgClass: 'bg-sky-500/10',
      count: this.service.payments,
    },
    {
      name: 'Offers',
      subtitle: 'Marketing',
      path: '/inventory/offers',
      description: 'Create and manage storefront promotions, clearance sales, and highlighted product carousels.',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0H4v13a2 2 0 002 2h12a2 2 0 002-2V8h-8z"></path></svg>',
      bgClass: 'bg-violet-500/10',
      count: this.service.offers,
    },
    {
      name: 'Analytics',
      subtitle: 'Insights & Trends',
      path: '/inventory/analytics',
      description:
        'Deep dive into business trends, predictive stock analysis, and multi-dimensional performance metrics.',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>',
      bgClass: 'bg-indigo-500/10',
      count: () => 'Live',
    },
  ];

  fulfillmentData = [
    { label: 'Jan', value: 450 },
    { label: 'Feb', value: 680 },
    { label: 'Mar', value: 520 },
    { label: 'Apr', value: 890 },
    { label: 'May', value: 740 },
    { label: 'Jun', value: 920 },
  ];

  utilizationData = [
    { label: 'NA East', value: 85 },
    { label: 'EU West', value: 62 },
    { label: 'APAC', value: 91 },
    { label: 'LATAM', value: 48 },
    { label: 'MENA', value: 77 },
  ];

  ngOnInit(): void {
    this.service.isLoading.set(true);
    const sub = this.service.getOverviewData().subscribe({
      next: ([products, orders, customers, suppliers, warehouses, payments, offers]) => {
        this.service.setOverviewData(products, orders, customers, suppliers, warehouses, payments, offers);
        this.service.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading inventory overview data:', err);
        this.service.isLoading.set(false);
      },
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  handleOptimize() {
    this.service.optimizeLogistics().subscribe();
  }
}
