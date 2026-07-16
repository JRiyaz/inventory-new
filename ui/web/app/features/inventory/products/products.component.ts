import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, type OnInit, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import {
  AuthStateService,
  CustomDropdownComponent,
  DisplayImageService,
  type DropdownOption,
  EmptyStateComponent,
  LoaderComponent,
  PageHeaderComponent,
  SearchService,
  SkeletonComponent,
} from 'ui-shared';
import { ProductsService } from './products.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SkeletonComponent,
    CustomDropdownComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    LoaderComponent,
  ],
  template: `
    <div class="p-3 sm:p-6  min-h-screen animate-fade-in">
      <lib-page-header
        title="Products"
        subtitle="Manage and monitor your industrial inventory levels across all nodes."
        [stats]="service.headerStats()"
        [breadcrumbs]="breadcrumbs"
        [count]="service.allFilteredProducts().length"
        [loading]="service.isLoading()"
        [isActionLoading]="service.isActionLoading()"
        [actionLabel]="auth.permissions().can_write ? 'Add New Product' : ''"
        backLink="/inventory"
        (action)="router.navigate(['/inventory/products/create'])"
      ></lib-page-header>

      <!-- Filters Bar (High Density) -->
      <div
        class="mb-5 flex flex-col lg:flex-row justify-between items-end gap-3 bg-white dark:bg-white/5 p-2 rounded-xl"
      >
        <div
          class="flex flex-col sm:flex-row items-end gap-3 w-full lg:w-auto flex-1"
        >
          <div class="floating-input-group w-full sm:w-64">
            <input
              type="text"
              [ngModel]="service.searchQuery()"
              (ngModelChange)="service.searchQuery.set($event)"
              placeholder=" "
              class="floating-input"
              id="prod-search"
            />
            <label class="floating-label" for="prod-search"
              >Search Inventory</label
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

          <div class="w-full sm:w-48">
            <lib-custom-dropdown
              [options]="categoryOptions"
              [value]="service.selectedCategory()"
              [placeholder]="'Category'"
              (valueChange)="service.setCategory($event)"
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

        <div
          class="flex bg-slate-100 dark:bg-white/[0.05] p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-inner"
        >
          <button
            (click)="service.viewType.set('grid')"
            [class.bg-white]="service.viewType() === 'grid'"
            [class.dark:bg-white/10]="service.viewType() === 'grid'"
            [class.shadow-sm]="service.viewType() === 'grid'"
            [class.text-primary]="service.viewType() === 'grid'"
            aria-label="Switch to Grid View"
            class="p-2 rounded-lg transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white"
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
            (click)="service.viewType.set('list')"
            [class.bg-white]="service.viewType() === 'list'"
            [class.dark:bg-white/10]="service.viewType() === 'list'"
            [class.shadow-sm]="service.viewType() === 'list'"
            [class.text-primary]="service.viewType() === 'list'"
            aria-label="Switch to List View"
            class="p-2 rounded-lg transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white"
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

      @if (service.isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
            <div class="card-premium p-6 space-y-4">
              @if (displayImageService.displayImage()) {
                <lib-skeleton
                  width="100%"
                  height="180px"
                  shape="rounded"
                ></lib-skeleton>
              }
              <lib-skeleton width="80%" height="1.5rem"></lib-skeleton>
              <lib-skeleton width="40%" height="1rem"></lib-skeleton>
            </div>
          }
        </div>
      } @else {
        <div class="animate-fade-in">
          @if (service.allFilteredProducts().length > 0) {
            @if (service.viewType() === "grid") {
              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                @for (
                  product of service.paginatedProducts();
                  track product.id
                ) {
                  <div
                    [routerLink]="[product.id]"
                    class="card-premium p-4 hover:border-primary/50 transition-all group cursor-pointer flex flex-col relative overflow-hidden"
                  >
                    @if (displayImageService.displayImage()) {
                      <div
                        class="w-full aspect-video bg-slate-50 dark:bg-white/5 rounded-xl mb-3 flex items-center justify-center text-slate-200 dark:text-white/5 relative overflow-hidden transition-colors border border-slate-100 dark:border-white/10"
                      >
                        <svg
                          class="w-10 h-10 transition-transform duration-700 group-hover:scale-110"
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
                        <div class="absolute top-2 left-2">
                          <span
                            class="px-1.5 py-0.5 bg-white/90 dark:bg-black/40 backdrop-blur-md rounded text-[8px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/10 shadow-sm"
                          >
                            {{ product.category }}
                          </span>
                        </div>
                      </div>
                    }

                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <h3
                          class="text-xs font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate"
                        >
                          {{ product.name }}
                        </h3>
                        @if (!displayImageService.displayImage()) {
                          <span
                            class="px-1 py-0.5 bg-slate-100 dark:bg-white/10 rounded text-[7px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                          >
                            {{ product.category }}
                          </span>
                        }
                      </div>
                      <div class="flex items-center gap-2 mb-4">
                        <span
                          class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                          >Stock:</span
                        >
                        <span
                          [class]="
                            product.stock < 20
                              ? 'text-rose-500'
                              : 'text-emerald-500'
                          "
                          class="text-[9px] font-black uppercase tracking-widest"
                          >{{ product.stock }} Units</span
                        >
                      </div>
                    </div>

                    <div
                      class="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/5 mt-auto"
                    >
                      <div class="flex flex-col">
                        <span
                          class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1"
                          >MSRP</span
                        >
                        <span
                          class="text-base font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-none"
                          >{{ product.price | currency }}</span
                        >
                      </div>
                      <svg
                        class="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
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
                }
              </div>
            } @else {
              <div class="space-y-2">
                @for (
                  product of service.paginatedProducts();
                  track product.id
                ) {
                  <div
                    class="card-premium p-3 flex items-center gap-4 hover:border-primary/50 transition-all group cursor-pointer"
                    [routerLink]="[product.id]"
                  >
                    @if (displayImageService.displayImage()) {
                      <div
                        class="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-200 dark:text-white/5 group-hover:bg-primary/10 transition-all border border-slate-100 dark:border-white/10"
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
                            stroke-width="1"
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          ></path>
                        </svg>
                      </div>
                    }
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-0.5">
                        <h3
                          class="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate"
                        >
                          {{ product.name }}
                        </h3>
                        <span
                          class="px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 rounded text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                        >
                          {{ product.category }}
                        </span>
                      </div>
                      <p
                        class="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1 truncate"
                      >
                        {{ product.description }}
                      </p>
                    </div>
                    <div class="flex items-center gap-8 pr-4">
                      <div class="text-right">
                        <p
                          class="text-base font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-none"
                        >
                          {{ product.price | currency }}
                        </p>
                      </div>
                      <div class="text-right w-20">
                        <p
                          [class]="
                            product.stock < 20
                              ? 'text-rose-500'
                              : 'text-emerald-500'
                          "
                          class="text-[10px] font-black uppercase tracking-widest"
                        >
                          {{ product.stock }} Units
                        </p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Pagination (Compact) -->
            <div
              class="mt-8 p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm shadow-sm"
            >
              <div class="flex items-center gap-4">
                <span
                  class="text-[10px] font-black uppercase text-slate-400 tracking-widest"
                >
                  Records:
                  <span class="text-slate-900 dark:text-white">{{
                    service.paginatedProducts().length
                  }}</span>
                  / {{ service.allFilteredProducts().length }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  [disabled]="service.currentPage() === 1"
                  (click)="service.setPage(service.currentPage() - 1)"
                  aria-label="Previous Page"
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
                  @for (
                    p of [].constructor(service.totalPages());
                    track $index
                  ) {
                    @if ($index < 5 || $index === service.totalPages() - 1) {
                      <button
                        (click)="service.setPage($index + 1)"
                        [class.bg-primary]="
                          service.currentPage() === $index + 1
                        "
                        [class.text-white]="
                          service.currentPage() === $index + 1
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
                  aria-label="Next Page"
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
              title="No Products Found"
              message="We couldn't find any items matching your current filters or search criteria."
              actionLabel="Reset Search"
              (action)="
                service.searchQuery.set(''); service.selectedCategory.set('All')
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
export class ProductsComponent implements OnInit {
  public service = inject(ProductsService);
  private searchService = inject(SearchService);
  public displayImageService = inject(DisplayImageService);
  public auth = inject(AuthStateService);
  public router = inject(Router);
  private destroyRef = inject(DestroyRef);

  breadcrumbs = [{ label: 'Inventory', link: '/inventory' }, { label: 'Products' }];

  pageSizeOptions: DropdownOption[] = [
    { value: 8, label: '8 Per Page' },
    { value: 16, label: '16 Per Page' },
    { value: 32, label: '32 Per Page' },
    { value: 50, label: '50 Per Page' },
  ];

  categories = ['All', 'Electronics', 'Industrial', 'Raw Materials'];
  categoryOptions: DropdownOption[] = this.categories.map((c) => ({
    value: c,
    label: c,
  }));

  constructor() {
    effect(() => {
      // track parameters reactively
      this.service.currentPage();
      this.service.pageSize();
      this.service.searchQuery();
      this.service.selectedCategory();

      untracked(() => {
        const sub = this.service.loadProducts().subscribe();
        this.destroyRef.onDestroy(() => sub.unsubscribe());
      });
    });
  }

  ngOnInit(): void {
    this.registerSearchProvider();
  }

  private registerSearchProvider(): void {
    this.searchService.registerProvider({
      id: 'inventory-products',
      name: 'Products',
      search: (query: string) => {
        const q = query.toLowerCase();
        const results = this.service
          .products()
          .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
          .map((p) => ({
            id: `prod-${p.id}`,
            title: p.name,
            path: `/inventory/products/${p.id}`,
            category: 'Product',
            keywords: [p.category, p.description],
          }));
        return of(results);
      },
    });
  }
}
