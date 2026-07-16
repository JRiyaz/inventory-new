import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, ElementRef, HostListener, inject, type OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { type Breadcrumb, DetailLayoutComponent, LoaderComponent } from 'ui-shared';
import { WarehousesService } from '../warehouses.service';

@Component({
  selector: 'app-warehouse-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DetailLayoutComponent, LoaderComponent],
  template: `
    <lib-detail-layout
      [title]="warehouse()?.name || 'Loading...'"
      [subtitle]="warehouse()?.location || 'Unknown'"
      [status]="capacityStatus()"
      [breadcrumbs]="breadcrumbs()"
      backLink="/inventory/warehouses"
      backLabel="Warehouse Logistics"
      actionLabel="Relocate Stock"
      editLabel="Edit Warehouse"
      [tabs]="['Overview', 'Zones & Capacity', 'Stored Products', 'Movements']"
      [loading]="service.isActionLoading()"
      (tabChanged)="activeTab.set($event)"
      (action)="handleAction()"
      (edit)="goToEdit()"
      loaderType="bloom"
    >
      <div top-content>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Utilization Card -->
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div>
                <h4
                  class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Storage Utilization
                </h4>
                <p class="text-[9px] text-slate-500 font-medium italic mt-0.5">
                  Across all active zones.
                </p>
              </div>
            </div>

            <div class="flex-1 max-w-[200px]">
              <div
                class="flex justify-between items-center text-[9px] font-black uppercase tracking-widest mb-1.5"
              >
                <span class="text-slate-400">Used Space</span>
                <span
                  [class]="
                    getBarClass(warehouse()?.utilization || 0) +
                    ' bg-transparent !text-current font-black'
                  "
                  >{{ warehouse()?.utilization }}%</span
                >
              </div>
              <div
                class="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner"
              >
                <div
                  class="h-full transition-all duration-1000"
                  [style.width.%]="warehouse()?.utilization"
                  [class]="getBarClass(warehouse()?.utilization || 0)"
                ></div>
              </div>
            </div>
          </div>

          <!-- Efficiency Card -->
          <div
            class="card-premium p-4 flex items-center justify-between gap-6 overflow-hidden"
          >
            <div class="flex items-center gap-4 flex-1">
              <div
                class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h4
                  class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Efficiency Rank
                </h4>
                <p class="text-[9px] text-slate-500 font-medium italic mt-0.5">
                  Based on throughput & error rate.
                </p>
              </div>
            </div>

            <div class="text-right px-4">
              <p
                class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5"
              >
                Global Efficiency
              </p>
              <p class="text-xl font-black text-amber-500 uppercase">Tier A</p>
            </div>

            <div class="px-4 border-l border-slate-100 dark:border-white/5">
              <div
                class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest"
              >
                High Performance
              </div>
            </div>
          </div>
        </div>
      </div>
      <div header-icon>
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
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          ></path>
        </svg>
      </div>

      <div sidebar-info class="space-y-6">
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Total Capacity
          </p>
          <p class="text-xl font-black text-primary">
            {{ warehouse()?.totalCapacity?.toLocaleString() }} Units
          </p>
        </div>
        <div class="pt-4 border-t border-slate-100 dark:border-white/5">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"
          >
            Logistics Status
          </p>
          <p
            class="text-xs font-black text-slate-900 dark:text-white uppercase"
          >
            Operational
          </p>
        </div>
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Active Zones
          </p>
          <p
            class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight"
          >
            {{ warehouse()?.zones?.length }} Operational
          </p>
        </div>
      </div>

      <div sidebar-extra>
        <h4
          class="text-white text-xs font-black uppercase tracking-widest mb-4"
        >
          Operational Status
        </h4>
        <div class="space-y-4">
          <div
            class="flex items-center justify-between text-[10px] text-white/70 font-bold"
          >
            <span>Security Systems</span>
            <span class="text-emerald-400">Online</span>
          </div>
          <div
            class="flex items-center justify-between text-[10px] text-white/70 font-bold"
          >
            <span>HVAC Control</span>
            <span class="text-emerald-400">Stable</span>
          </div>
          <div
            class="flex items-center justify-between text-[10px] text-white/70 font-bold"
          >
            <span>Dock Status</span>
            <span class="text-amber-400">Busy (3 trucks)</span>
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
                Storage Distribution
              </h4>
              <div class="space-y-6">
                @for (zone of warehouse()?.zones; track zone.id) {
                  <div class="space-y-2">
                    <div
                      class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"
                    >
                      <span class="text-slate-900 dark:text-white">{{
                        zone.name
                      }}</span>
                      <span class="text-slate-400">{{ zone.description }}</span>
                    </div>
                    <div
                      class="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full bg-primary"
                        [style.width.%]="60 + $index * 10"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="card-premium p-6">
              <h4
                class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6"
              >
                Key Statistics
              </h4>
              <div class="grid grid-cols-2 gap-4">
                <div
                  class="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5"
                >
                  <p class="text-[9px] font-black uppercase text-slate-400">
                    Avg throughput
                  </p>
                  <p class="text-lg font-black text-slate-900 dark:text-white">
                    840 units/day
                  </p>
                </div>
                <div
                  class="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5"
                >
                  <p class="text-[9px] font-black uppercase text-slate-400">
                    Error Rate
                  </p>
                  <p class="text-lg font-black text-emerald-500">0.02%</p>
                </div>
              </div>
              <p
                class="mt-6 text-[10px] text-slate-500 font-medium leading-relaxed italic"
              >
                Last audited 14 days ago by Compliance Team A. All safety
                protocols confirmed.
              </p>
            </div>
          </div>
        } @else if (activeTab() === 1) {
          <div class="space-y-4">
            @for (zone of warehouse()?.zones; track zone.id) {
              <div
                class="card-premium p-6 flex items-center justify-between group hover:border-primary transition-all"
              >
                <div class="flex items-center gap-5">
                  <div
                    class="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-primary font-black group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                  >
                    {{ zone.name[zone.name.length - 1] }}
                  </div>
                  <div>
                    <p
                      class="text-base font-black text-slate-900 dark:text-white"
                    >
                      {{ zone.name }}
                    </p>
                    <p class="text-xs text-slate-500 font-medium">
                      {{ zone.description }}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p
                    class="text-xs font-black text-primary uppercase tracking-widest"
                  >
                    Active
                  </p>
                </div>
              </div>
            }
          </div>
        } @else if (activeTab() === 2) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="col-span-full flex justify-between items-center mb-2">
              <h4
                class="text-xs font-black uppercase tracking-widest text-slate-400"
              >
                In-Stock Inventory
              </h4>
              <div class="relative">
                <button
                  (click)="showProductSearch.set(!showProductSearch())"
                  class="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary transition-all hover:text-white"
                >
                  <lib-loader label="Add Product"></lib-loader>
                </button>

                @if (showProductSearch()) {
                  <div
                    class="absolute top-full right-0 mt-2 w-72 card-premium z-50 p-4 shadow-2xl animate-fade-in"
                  >
                    <input
                      type="text"
                      [ngModel]="productSearchQuery()"
                      (ngModelChange)="productSearchQuery.set($event)"
                      placeholder="Search unassigned products..."
                      class="w-full bg-transparent border-b-2 border-slate-200 dark:border-white/10 py-2 text-xs font-bold outline-none focus:border-primary transition-all mb-4"
                    />
                    <div
                      class="max-h-48 overflow-y-auto custom-scrollbar space-y-1"
                    >
                      @for (p of availableProducts(); track p.id) {
                        <button
                          (click)="addProduct(p.id)"
                          class="w-full text-left p-2 rounded hover:bg-primary/10 group transition-all"
                        >
                          <p
                            class="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary"
                          >
                            {{ p.name }}
                          </p>
                          <p
                            class="text-[8px] font-black uppercase text-slate-400"
                          >
                            {{ p.category }}
                          </p>
                        </button>
                      } @empty {
                        <p
                          class="text-[10px] text-slate-400 italic text-center"
                        >
                          No unassigned products found
                        </p>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            @for (prod of storedProducts(); track prod.id) {
              <div
                [routerLink]="['/inventory/products', prod.id]"
                class="card-premium p-5 flex items-center gap-4 hover:border-primary transition-all cursor-pointer group"
              >
                <div
                  class="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors"
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
                      stroke-width="1"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    ></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <p
                    class="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors"
                  >
                    {{ prod.name }}
                  </p>
                  <p
                    class="text-[10px] text-slate-400 font-black uppercase tracking-widest"
                  >
                    {{ prod.category }}
                  </p>
                  <div class="mt-2 flex items-center gap-2">
                    <span class="text-[9px] font-black uppercase text-slate-400"
                      >Current Qty:</span
                    >
                    <span class="text-xs font-black text-primary">{{
                      prod.stock
                    }}</span>
                  </div>
                </div>
                <svg
                  class="w-5 h-5 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all"
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
                class="col-span-full py-20 text-center bg-white/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10"
              >
                <p class="text-slate-400 italic">
                  No products currently registered in this warehouse.
                </p>
              </div>
            }
          </div>
        } @else if (activeTab() === 3) {
          <div class="card-premium overflow-hidden">
            <table class="w-full text-left">
              <thead
                class="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06]"
              >
                <tr>
                  <th
                    (click)="toggleSort('date')"
                    class="px-6 py-4 cursor-pointer group"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors"
                        >Date</span
                      >
                      <svg
                        class="w-2.5 h-2.5 transition-all duration-300"
                        [class.text-primary]="sortField() === 'date'"
                        [class.text-slate-200]="sortField() !== 'date'"
                        [class.rotate-180]="
                          sortField() === 'date' && sortOrder() === 'desc'
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
                    (click)="toggleSort('type')"
                    class="px-6 py-4 cursor-pointer group"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors"
                        >Type</span
                      >
                      <svg
                        class="w-2.5 h-2.5 transition-all duration-300"
                        [class.text-primary]="sortField() === 'type'"
                        [class.text-slate-200]="sortField() !== 'type'"
                        [class.rotate-180]="
                          sortField() === 'type' && sortOrder() === 'desc'
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
                    (click)="toggleSort('qty')"
                    class="px-6 py-4 cursor-pointer group"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <span
                        class="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors"
                        >Qty</span
                      >
                      <svg
                        class="w-2.5 h-2.5 transition-all duration-300"
                        [class.text-primary]="sortField() === 'qty'"
                        [class.text-slate-200]="sortField() !== 'qty'"
                        [class.rotate-180]="
                          sortField() === 'qty' && sortOrder() === 'desc'
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
                    (click)="toggleSort('user')"
                    class="px-6 py-4 cursor-pointer group"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors"
                        >User</span
                      >
                      <svg
                        class="w-2.5 h-2.5 transition-all duration-300"
                        [class.text-primary]="sortField() === 'user'"
                        [class.text-slate-200]="sortField() !== 'user'"
                        [class.rotate-180]="
                          sortField() === 'user' && sortOrder() === 'desc'
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
              <tbody class="divide-y divide-slate-50 dark:divide-white/[0.04]">
                @for (mov of movements(); track mov.id) {
                  <tr class="text-sm">
                    <td class="px-6 py-4 font-bold text-slate-500">
                      {{ mov.date }}
                    </td>
                    <td class="px-6 py-4">
                      <span
                        [ngClass]="{
                          'text-emerald-500': mov.type === 'Inbound',
                          'text-rose-500': mov.type === 'Outbound',
                          'text-primary': mov.type === 'Transfer',
                        }"
                        class="font-black uppercase text-[10px] tracking-widest"
                      >
                        {{ mov.type }}
                      </span>
                    </td>
                    <td
                      class="px-6 py-4 text-center font-black text-slate-900 dark:text-white"
                    >
                      {{ mov.qty }}
                    </td>
                    <td class="px-6 py-4 text-xs font-bold text-slate-400">
                      {{ mov.user }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td
                      colspan="4"
                      class="px-6 py-12 text-center text-slate-400 italic"
                    >
                      No recent movements recorded.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
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
export class WarehouseDetailComponent implements OnInit {
  public service = inject(WarehousesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eRef = inject(ElementRef);
  private destroyRef = inject(DestroyRef);

  activeTab = signal(0);
  sortField = signal<string>('date');
  sortOrder = signal<'asc' | 'desc'>('desc');

  showProductSearch = signal(false);
  productSearchQuery = signal('');

  warehouseId = computed(() => this.route.snapshot.paramMap.get('id') || '');
  warehouse = computed(() => this.service.getWarehouse(this.warehouseId()));

  breadcrumbs = computed<Breadcrumb[]>(() => [
    { label: 'Inventory', link: '/inventory' },
    { label: 'Warehouses', link: '/inventory/warehouses' },
    { label: this.warehouse()?.name || 'Detail' },
  ]);

  storedProducts = computed(() => {
    return this.service.getProductsByWarehouseId(this.warehouseId());
  });

  availableProducts = computed(() => {
    const query = this.productSearchQuery().toLowerCase().trim();
    const available = this.service.getAvailableProducts();
    if (!query) return available;
    return available.filter((p) => p.name.toLowerCase().includes(query));
  });

  movements = computed(() => {
    const field = this.sortField();
    const order = this.sortOrder();

    const result = this.service.getMovementsByWarehouseId(this.warehouseId());

    return result.sort((a: any, b: any) => {
      const valA = a[field];
      const valB = b[field];
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  });

  capacityStatus = computed(() => {
    const u = this.warehouse()?.utilization || 0;
    if (u > 90) return 'Near Capacity';
    if (u > 70) return 'Heavy Load';
    return 'Optimal';
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showProductSearch.set(false);
    }
  }

  toggleSort(field: string) {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('asc');
    }
  }

  ngOnInit() {
    this.service.isLoading.set(true);
    const sub = this.service.getWarehouseData(this.warehouseId()).subscribe({
      next: (data) => {
        this.service.setWarehouse(data);
        this.service.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading warehouse details:', err);
        this.service.isLoading.set(false);
      },
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  goToEdit() {
    const id = this.warehouseId();
    if (id) {
      this.router.navigate(['/inventory/warehouses', id, 'edit']);
    }
  }

  handleAction() {
    this.service.isActionLoading.set(true);
    setTimeout(() => {
      this.service.isActionLoading.set(false);
    }, 2000);
  }

  getBarClass(u: number) {
    if (u > 90) return 'bg-rose-500';
    if (u > 70) return 'bg-amber-500';
    return 'bg-primary';
  }

  addProduct(productId: number) {
    this.service.addProductToWarehouse(productId, this.warehouseId()).subscribe(() => {
      this.showProductSearch.set(false);
      this.productSearchQuery.set('');
    });
  }
}
