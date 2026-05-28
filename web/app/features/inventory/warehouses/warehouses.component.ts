import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { EmptyStateComponent, PageHeaderComponent, SearchService, SkeletonComponent } from 'ui-shared';
import { WarehousesService } from './warehouses.service';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SkeletonComponent, PageHeaderComponent, EmptyStateComponent],
  template: `
    <div class="p-3 sm:p-6  min-h-screen animate-fade-in">
      <lib-page-header
        title="Warehouses & Logistics"
        subtitle="Monitor spatial capacity and stock distribution across your facilities."
        [stats]="service.headerStats()"
        [breadcrumbs]="breadcrumbs"
        [count]="service.allFilteredWarehouses().length"
        [loading]="service.isLoading()"
        [isActionLoading]="service.isActionLoading()"
        actionLabel="Register New Warehouse"
        backLink="/inventory"
        (action)="router.navigate(['/inventory/warehouses/create'])"
      ></lib-page-header>

      <!-- Filters Bar (High Density) -->
      <div
        class="mb-5 flex flex-col md:flex-row gap-4 items-end bg-white dark:bg-white/5 p-2 rounded-xl"
      >
        <div class="flex-1 w-full relative group">
          <div class="floating-input-group">
            <input
              type="text"
              id="wh-search"
              [ngModel]="service.searchQuery()"
              (ngModelChange)="service.searchQuery.set($event)"
              placeholder=" "
              class="floating-input"
            />
            <label for="wh-search" class="floating-label"
              >Search Facilities</label
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
      </div>

      @if (service.isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (i of [1, 2, 3]; track i) {
            <div class="card-premium p-6 space-y-5">
              <lib-skeleton
                width="60px"
                height="60px"
                shape="rounded"
              ></lib-skeleton>
              <lib-skeleton width="100%" height="2rem"></lib-skeleton>
              <lib-skeleton width="100%" height="4rem"></lib-skeleton>
            </div>
          }
        </div>
      } @else {
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in"
        >
          @for (wh of service.allFilteredWarehouses(); track wh.id) {
            <div
              [routerLink]="[wh.id]"
              class="card-premium p-4 group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
            >
              <!-- Decorative Background -->
              <div
                class="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"
              ></div>

              <div class="flex justify-between items-start mb-4 relative z-10">
                <div
                  class="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
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
                    ></path>
                  </svg>
                </div>
                <div
                  [class]="getCapacityClass(wh.utilization)"
                  class="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border"
                >
                  {{ wh.utilization }}% Full
                </div>
              </div>

              <div class="relative z-10">
                <h3
                  class="text-base font-black text-slate-900 dark:text-white mb-0.5 group-hover:translate-x-1 transition-transform truncate"
                >
                  {{ wh.name }}
                </h3>
                <p
                  class="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mb-4 truncate"
                >
                  <svg
                    class="w-3 h-3 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  {{ wh.location }}
                </p>

                <!-- Capacity Bar -->
                <div
                  class="space-y-2 mb-4 bg-slate-50/50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5"
                >
                  <div
                    class="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400"
                  >
                    <span>Stock Load</span>
                    <span class="text-slate-900 dark:text-white font-bold"
                      >{{ wh.currentStock.toLocaleString() }} Units</span
                    >
                  </div>
                  <div
                    class="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden"
                  >
                    <div
                      [style.width.%]="wh.utilization"
                      [class]="getBarClass(wh.utilization)"
                      class="h-full transition-all duration-1000 ease-out"
                    ></div>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-3">
                  <div class="flex items-center gap-2">
                    <div class="flex -space-x-1.5">
                      @for (zone of wh.zones.slice(0, 3); track zone.id) {
                        <div
                          class="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[8px] font-black text-primary"
                        >
                          {{ zone.name[zone.name.length - 1] }}
                        </div>
                      }
                    </div>
                    <span
                      class="text-[8px] font-black text-slate-400 uppercase tracking-widest"
                      >{{ wh.zones.length || 0 }} Zones</span
                    >
                  </div>
                  <svg
                    class="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          } @empty {
            <lib-empty-state
              title="No Facilities Found"
              message="Your search for '{{
                service.searchQuery()
              }}' did not match any registered warehouses or locations."
              actionLabel="Reset Search"
              (action)="service.searchQuery.set('')"
            ></lib-empty-state>
          }
        </div>
      }
    </div>
  `,
  styles: [],
})
export class WarehousesComponent implements OnInit {
  public service = inject(WarehousesService);
  private searchService = inject(SearchService);
  public router = inject(Router);
  private destroyRef = inject(DestroyRef);

  breadcrumbs = [{ label: 'Inventory', link: '/inventory' }, { label: 'Warehouses' }];

  ngOnInit(): void {
    this.service.isLoading.set(true);
    const sub = this.service.getWarehousesData().subscribe({
      next: (warehouses) => {
        this.service.setWarehouses(warehouses);
        this.service.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading warehouses:', err);
        this.service.isLoading.set(false);
      },
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
    this.registerSearchProvider();
  }

  private registerSearchProvider(): void {
    this.searchService.registerProvider({
      id: 'inventory-warehouses',
      name: 'Warehouses',
      search: (query: string) => {
        const q = query.toLowerCase();
        const results = this.service
          .warehouses()
          .filter((w) => w.name.toLowerCase().includes(q) || w.location.toLowerCase().includes(q))
          .map((w) => ({
            id: `warehouse-${w.id}`,
            title: w.name,
            path: `/inventory/warehouses/${w.id}`,
            category: 'Warehouse',
            keywords: [w.location, w.status],
          }));
        return of(results);
      },
    });
  }

  getCapacityClass(utilization: number) {
    if (utilization > 90) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (utilization > 70) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  }

  getBarClass(utilization: number) {
    if (utilization > 90) return 'bg-rose-500';
    if (utilization > 70) return 'bg-amber-500';
    return 'bg-primary';
  }
}
