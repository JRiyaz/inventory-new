import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, ElementRef, HostListener, inject, type OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  InventoryDataService,
  LoaderComponent,
  type Product,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type Supplier,
} from 'ui-shared';
import { ProcurementService } from './procurement.service';

@Component({
  selector: 'app-stock-order-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoaderComponent],
  template: `
    <div
      class="p-3 sm:p-5 max-w-6xl mx-auto animate-fade-in"
      (click)="closeAllPopovers()"
    >
      <!-- Dynamic Breadcrumbs -->
      <nav
        class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5"
      >
        @for (crumb of dynamicBreadcrumbs(); track crumb.label) {
          @if (crumb.link) {
            <a
              [routerLink]="crumb.link"
              class="hover:text-primary transition-colors"
              >{{ crumb.label }}</a
            >
          } @else {
            <span class="text-slate-900 dark:text-white">{{
              crumb.label
            }}</span>
          }

          @if (!$last) {
            <svg
              class="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M9 5l7 7-7 7"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
        }
      </nav>

      <div class="space-y-4">
        <!-- Top Header (Supplier Selection) -->
        <div
          class="card-premium p-5 pb-3 border-b-2 border-b-primary sticky top-0 z-[100] animate-fade-in"
        >
          <div
            class="flex flex-col xl:flex-row items-center justify-between gap-6"
          >
            <!-- Supplier Selection -->
            <div
              class="w-full xl:w-1/3 relative group"
              (click)="$event.stopPropagation()"
            >
              <button
                type="button"
                (click)="toggleSupplierSearch($event)"
                class="w-full bg-transparent border-b-2 border-slate-200 dark:border-white/10 py-2.5 px-1 flex items-center justify-between cursor-pointer hover:border-primary transition-all group/btn outline-none focus:border-primary"
              >
                <div class="flex items-center gap-3 truncate">
                  <div
                    class="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary"
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <span
                    class="text-sm font-black truncate"
                    [class.text-slate-400]="!selectedSupplierId()"
                    [class.text-slate-900]="selectedSupplierId()"
                    [class.dark:text-white]="selectedSupplierId()"
                  >
                    {{ selectedSupplierName() || "Select Supplier..." }}
                  </span>
                </div>
                <svg
                  class="w-4 h-4 text-slate-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <label
                class="absolute left-1 transition-all duration-200 pointer-events-none uppercase font-black tracking-widest text-slate-400"
                [class.text-[10px]]="
                  selectedSupplierId() || showSupplierSearch()
                "
                [class.top-[-12px]]="
                  selectedSupplierId() || showSupplierSearch()
                "
                [class.text-primary]="showSupplierSearch()"
                [class.text-xs]="!selectedSupplierId() && !showSupplierSearch()"
                [class.top-2.5]="!selectedSupplierId() && !showSupplierSearch()"
              >
                Supplier
              </label>

              <!-- Supplier Search Popover -->
              @if (showSupplierSearch()) {
                <div
                  (click)="$event.stopPropagation()"
                  class="absolute top-full left-0 right-0 mt-2 card-premium z-[300] p-3 animate-fade-in shadow-xl"
                >
                  <div class="relative mb-3">
                    <input
                      #supplierSearchInput
                      type="text"
                      [ngModel]="supplierSearchQuery()"
                      (ngModelChange)="supplierSearchQuery.set($event)"
                      placeholder="Search supplier..."
                      class="w-full bg-transparent border-b-2 border-slate-200 dark:border-white/10 py-2.5 px-1 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-all pr-10"
                    />
                  </div>
                  <div
                    class="max-h-48 overflow-y-auto custom-scrollbar space-y-1"
                  >
                    @for (s of filteredSuppliers(); track s.id) {
                      <button
                        (click)="onSupplierSelect(s)"
                        class="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 group transition-all outline-none"
                      >
                        <p
                          class="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary"
                        >
                          {{ s.name }}
                        </p>
                        <p
                          class="text-[9px] font-black uppercase text-slate-400"
                        >
                          {{ s.location }}
                        </p>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Summary Stats -->
            <div
              class="flex-1 w-full flex flex-wrap items-center justify-center xl:justify-start gap-10"
            >
              <div class="flex flex-col">
                <p
                  class="text-[8px] font-black uppercase text-slate-400 mb-0.5"
                >
                  Order Total
                </p>
                <p class="text-base font-black text-primary">
                  {{ orderTotal() | currency }}
                </p>
              </div>
              <div class="flex flex-col">
                <p
                  class="text-[8px] font-black uppercase text-slate-400 mb-0.5"
                >
                  Total Items
                </p>
                <p class="text-sm font-black text-slate-700 dark:text-white">
                  {{ totalItemsCount() }} Units
                </p>
              </div>
            </div>

            <!-- Action Button -->
            <div class="w-full xl:w-auto">
              <button
                (click)="submitOrder()"
                [disabled]="!canSubmit() || service.isActionLoading()"
                class="w-full xl:w-48 btn-primary-premium !py-2.5"
              >
                <lib-loader
                  [loading]="service.isActionLoading()"
                  [label]="isEditMode() ? 'Save Changes' : 'Place Order'"
                ></lib-loader>
              </button>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="card-premium p-4 relative">
          <div class="flex items-center justify-between mb-4">
            <h3
              class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight"
            >
              Stock Items
            </h3>
            <div class="flex items-center gap-4">
              <!-- Quick Add Scanner -->
              <div class="relative group">
                <input
                  type="text"
                  [(ngModel)]="quickSearchQuery"
                  (keyup.enter)="quickAdd()"
                  placeholder="Scan SKU or Enter Product ID..."
                  class="w-64 bg-slate-100 dark:bg-white/5 border-2 border-transparent py-1.5 px-4 rounded-lg text-[10px] font-bold text-slate-900 dark:text-white outline-none focus:border-primary/30 focus:bg-white dark:focus:bg-white/10 transition-all pl-10"
                />
                <svg
                  class="absolute left-3 top-2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>

              <button
                (click)="toggleProductSearch($event)"
                class="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary group transition-all hover:text-white"
              >
                Add Multiple Items
              </button>
            </div>
          </div>

          <div class="space-y-2">
            @for (item of orderItems(); track item.productId; let i = $index) {
              <div
                class="grid grid-cols-[40px_1fr_120px_100px_100px_40px] gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-xl items-center animate-fade-in shadow-sm border border-slate-100 dark:border-white/5 group"
              >
                <span class="text-xs font-black text-slate-400">{{
                  i + 1
                }}</span>
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary"
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
                      />
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs font-bold text-slate-900 dark:text-white">
                      {{ item.name }}
                    </p>
                    <p class="text-[9px] font-black uppercase text-slate-400">
                      ID: {{ item.productId }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    (click)="updateQty(item, -5)"
                    class="w-6 h-6 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-primary transition-all"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    [(ngModel)]="item.qty"
                    class="w-12 text-center bg-transparent border-b-2 border-slate-200 dark:border-white/10 text-xs font-black text-slate-900 dark:text-white outline-none"
                  />
                  <button
                    (click)="updateQty(item, 5)"
                    class="w-6 h-6 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-primary transition-all"
                  >
                    +
                  </button>
                </div>
                <div class="text-right">
                  <p class="text-xs font-black text-slate-900 dark:text-white">
                    {{ item.price | currency }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-xs font-black text-primary">
                    {{ item.price * item.qty | currency }}
                  </p>
                </div>
                <button
                  (click)="removeItem(i)"
                  class="p-1 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            } @empty {
              <div
                (click)="toggleProductSearch($event)"
                class="py-20 text-center bg-slate-50 dark:bg-white/[0.02] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl cursor-pointer hover:border-primary/50 transition-all group"
              >
                <div
                  class="w-16 h-16 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 group-hover:text-primary transition-colors"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <p class="text-slate-500 font-medium">
                  Click to add items to your stock order
                </p>
              </div>
            }
          </div>

          @if (showProductSearch()) {
            <div
              (click)="$event.stopPropagation()"
              class="absolute top-12 right-4 w-96 card-premium z-[300] p-4 shadow-2xl animate-fade-in border-t-4 border-t-primary"
            >
              <div class="flex items-center justify-between mb-4">
                <h4
                  class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Batch Selection
                </h4>
                <button
                  (click)="closeAllPopovers()"
                  class="text-slate-400 hover:text-rose-500 transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <input
                #productSearchInput
                type="text"
                [ngModel]="productSearchQuery()"
                (ngModelChange)="productSearchQuery.set($event)"
                placeholder="Find product SKU..."
                class="w-full bg-transparent border-b-2 border-slate-200 dark:border-white/10 py-2 text-xs font-bold outline-none focus:border-primary transition-all mb-4"
              />
              <div class="max-h-80 overflow-y-auto custom-scrollbar space-y-1">
                @for (p of filteredProducts(); track p.id) {
                  <div
                    class="w-full flex items-center justify-between p-2 rounded hover:bg-primary/10 group transition-all"
                  >
                    <div class="flex-1">
                      <p
                        class="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary"
                      >
                        {{ p.name }}
                      </p>
                      <div class="flex gap-3 items-center mt-1">
                        <span
                          class="text-[8px] font-black uppercase text-slate-400"
                          >Stock: {{ p.stock }}</span
                        >
                        <span class="text-[9px] font-black text-primary">{{
                          p.price | currency
                        }}</span>
                      </div>
                    </div>
                    <button
                      (click)="addProductToOrder(p)"
                      class="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase rounded hover:bg-primary-dark transition-all opacity-0 group-hover:opacity-100"
                    >
                      Add
                    </button>
                    @if (isItemInOrder(p.id)) {
                      <div
                        class="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded"
                      >
                        Added
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(109, 116, 255, 0.1);
        border-radius: 10px;
      }
    `,
  ],
})
export class StockOrderCreateComponent implements OnInit {
  public service = inject(ProcurementService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eRef = inject(ElementRef);
  private http = inject(HttpClient);
  private dataService = inject(InventoryDataService);

  isEditMode = signal(false);
  editOrderId = signal<string | null>(null);
  existingPO = signal<PurchaseOrder | null>(null);

  showSupplierSearch = signal(false);
  showProductSearch = signal(false);
  supplierSearchQuery = signal('');
  productSearchQuery = signal('');

  selectedSupplierId = signal<string | null>(null);
  selectedSupplierName = signal<string | null>(null);
  orderItems = signal<PurchaseOrderItem[]>([]);
  quickSearchQuery = '';

  dynamicBreadcrumbs = computed(() => {
    const crumbs = [{ label: 'Inventory', link: '/inventory' }];
    const pId = this.route.snapshot.queryParams['productId'];
    const sId = this.route.snapshot.queryParams['supplierId'];

    if (pId) {
      const product = this.service.getProductById(Number(pId));
      crumbs.push({ label: 'Products', link: '/inventory/products' });
      if (product)
        crumbs.push({
          label: product.name,
          link: `/inventory/products/${product.id}`,
        });
    } else if (sId) {
      const supplier = this.service.getSupplierById(sId);
      crumbs.push({ label: 'Suppliers', link: '/inventory/suppliers' });
      if (supplier)
        crumbs.push({
          label: supplier.name,
          link: `/inventory/suppliers/${supplier.id}`,
        });
    } else {
      crumbs.push({ label: 'Procurement', link: '/inventory/procurement' });
    }

    crumbs.push({ label: this.isEditMode() ? 'Edit Stock Order' : 'New Stock Order', link: '' });
    return crumbs;
  });

  filteredSuppliers = computed(() => {
    const query = this.supplierSearchQuery().toLowerCase().trim();
    if (!query) return this.service.getSuppliers();
    return this.service.getSuppliers().filter((s) => s.name.toLowerCase().includes(query));
  });

  filteredProducts = computed(() => {
    const query = this.productSearchQuery().toLowerCase().trim();
    const products = this.service.getProducts();
    if (!query) return products;
    return products.filter((p) => p.name.toLowerCase().includes(query));
  });

  orderTotal = computed(() => this.orderItems().reduce((sum, item) => sum + item.price * item.qty, 0));

  totalItemsCount = computed(() => this.orderItems().reduce((sum, item) => sum + item.qty, 0));

  canSubmit = computed(() => this.selectedSupplierId() !== null && this.orderItems().length > 0);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.closeAllPopovers();
    }
  }

  ngOnInit() {
    forkJoin([
      this.http.get<Product[]>(`${this.dataService.baseUrl}/products`),
      this.http.get<Supplier[]>(`${this.dataService.baseUrl}/suppliers`),
    ]).subscribe(([products, suppliers]) => {
      this.dataService.setProducts(products);
      this.dataService.setSuppliers(suppliers);
      this.initializeFromParams();
    });
  }

  initializeFromParams() {
    // Read route parameters to check for Edit Mode
    const poId = this.route.snapshot.params['id'];
    if (poId) {
      this.isEditMode.set(true);
      this.editOrderId.set(poId);
      // Fetch PO details and pre-populate
      this.http.get<PurchaseOrder>(`${this.dataService.baseUrl}/purchaseOrders/${poId}`).subscribe((po) => {
        this.existingPO.set(po);
        this.selectedSupplierId.set(po.supplierId);
        this.selectedSupplierName.set(po.supplierName);
        this.orderItems.set(po.items);
      });
    }

    this.route.queryParams.subscribe((params) => {
      const pId = params['productId'];
      const sId = params['supplierId'];

      if (pId) {
        const product = this.service.getProductById(Number(pId));
        if (product) {
          this.addProductToOrder(product);
          if (product.supplierId) {
            const supplier = this.service.getSupplierById(product.supplierId);
            if (supplier) {
              this.onSupplierSelect(supplier);
            }
          }
        }
      }

      if (sId) {
        const supplier = this.service.getSupplierById(sId);
        if (supplier) {
          this.onSupplierSelect(supplier);
        }
      }
    });
  }

  toggleSupplierSearch(event: Event) {
    event.stopPropagation();
    this.showSupplierSearch.update((v) => !v);
    this.showProductSearch.set(false);
  }

  toggleProductSearch(event: Event) {
    event.stopPropagation();
    this.showProductSearch.update((v) => !v);
    this.showSupplierSearch.set(false);
  }

  closeAllPopovers() {
    this.showSupplierSearch.set(false);
    this.showProductSearch.set(false);
  }

  onSupplierSelect(s: Supplier) {
    this.selectedSupplierId.set(s.id);
    this.selectedSupplierName.set(s.name);
    this.showSupplierSearch.set(false);
  }

  quickAdd() {
    if (!this.quickSearchQuery.trim()) return;
    const products = this.service.getProducts();
    const product = products.find(
      (p) =>
        p.id.toString() === this.quickSearchQuery || p.name.toLowerCase().includes(this.quickSearchQuery.toLowerCase()),
    );
    if (product) {
      this.addProductToOrder(product);
      this.quickSearchQuery = '';
    }
  }

  isItemInOrder(productId: number) {
    return this.orderItems().some((item) => item.productId === productId);
  }

  addProductToOrder(p: Product) {
    const exists = this.orderItems().find((item) => item.productId === p.id);
    if (exists) {
      this.updateQty(exists, 10);
    } else {
      const newItem: PurchaseOrderItem = {
        productId: p.id,
        name: p.name,
        qty: 50,
        price: p.price * 0.7, // Assume 30% margin for wholesale
      };
      this.orderItems.update((items) => [...items, newItem]);
    }
    // Keep popover open for multiple additions
  }

  updateQty(item: PurchaseOrderItem, delta: number) {
    this.orderItems.update((items) =>
      items.map((i) => (i.productId === item.productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i)),
    );
  }

  removeItem(index: number) {
    this.orderItems.update((items) => items.filter((_, i) => i !== index));
  }

  submitOrder() {
    const supplierId = this.selectedSupplierId();
    const supplierName = this.selectedSupplierName();

    if (!supplierId || !supplierName) return;

    if (this.isEditMode()) {
      const editId = this.editOrderId();
      const existing = this.existingPO();
      if (!editId || !existing) return;

      const updatedOrder: PurchaseOrder = {
        ...existing,
        supplierId,
        supplierName,
        amount: this.orderTotal(),
        items: this.orderItems(),
      };

      this.service.updatePurchaseOrder(updatedOrder).subscribe((savedPO) => {
        this.router.navigate(['/inventory/procurement', savedPO.id]);
      });
    } else {
      const order: PurchaseOrder = {
        id: `PO-${Math.floor(10000 + Math.random() * 90000)}`,
        supplierId,
        supplierName,
        status: 'Ordered',
        amount: this.orderTotal(),
        date: new Date().toISOString(),
        items: this.orderItems(),
      };

      this.service.addPurchaseOrder(order).subscribe((savedPO) => {
        this.router.navigate(['/inventory/procurement', savedPO.id]);
      });
    }
  }
}
