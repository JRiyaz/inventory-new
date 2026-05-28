import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  ElementRef,
  effect,
  HostListener,
  inject,
  type OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CustomDatePickerComponent,
  CustomDropdownComponent,
  type Customer,
  type DropdownOption,
  InventoryDataService,
  LoaderComponent,
  type Order,
  type OrderItem,
  type Product,
} from 'ui-shared';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CustomDropdownComponent,
    LoaderComponent,
    CustomDatePickerComponent,
  ],
  template: `
    <div
      class="p-3 sm:p-5 max-w-6xl mx-auto animate-fade-in"
      (click)="closeAllPopovers()"
    >
      <!-- Breadcrumbs -->
      <nav
        class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5"
      >
        <a
          routerLink="/inventory/orders"
          class="hover:text-primary transition-colors"
          >Orders</a
        >
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
        @if (isEditMode()) {
          <a
            [routerLink]="['/inventory/orders', orderId]"
            class="hover:text-primary transition-colors"
            >Order #{{ orderId }}</a
          >
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
          <span class="text-slate-900 dark:text-white">Modify Record</span>
        } @else {
          <span class="text-slate-900 dark:text-white">New Order</span>
        }
      </nav>

      <div class="space-y-4">
        <!-- Top Inventory Header (Summary + Customer + Priority) -->
        <div
          class="card-premium p-5 pb-3 border-b-2 border-b-primary sticky top-0 z-[100] animate-fade-in"
        >
          <div
            class="flex flex-col xl:flex-row items-center justify-between gap-6"
          >
            <!-- Customer Selection (Most Prominent) -->
            <div
              class="w-full xl:w-1/3 relative group"
              (click)="$event.stopPropagation()"
            >
              <button
                type="button"
                (click)="toggleCustomerSearch($event)"
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
                      @if (isEditMode()) {
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      } @else {
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      }
                    </svg>
                  </div>
                  <span
                    class="text-sm font-black truncate"
                    [class.text-slate-400]="!selectedCustomerId()"
                    [class.text-slate-900]="selectedCustomerId()"
                    [class.dark:text-white]="selectedCustomerId()"
                  >
                    {{ selectedCustomerName() || "" }}
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
                  selectedCustomerId() || showCustomerSearch()
                "
                [class.top-[-12px]]="
                  selectedCustomerId() || showCustomerSearch()
                "
                [class.text-primary]="showCustomerSearch()"
                [class.text-xs]="!selectedCustomerId() && !showCustomerSearch()"
                [class.top-2.5]="!selectedCustomerId() && !showCustomerSearch()"
              >
                Selected Customer
              </label>

              <!-- Customer Search Popover -->
              @if (showCustomerSearch()) {
                <div
                  (click)="$event.stopPropagation()"
                  class="absolute top-full left-0 right-0 mt-2 card-premium z-[300] p-3 animate-fade-in shadow-xl"
                >
                  <div class="relative mb-3">
                    <input
                      #customerSearchInput
                      type="text"
                      [ngModel]="customerSearchQuery()"
                      (ngModelChange)="customerSearchQuery.set($event)"
                      (keydown)="handleCustomerKeydown($event)"
                      placeholder="Search customer..."
                      class="w-full bg-transparent border-b-2 border-slate-200 dark:border-white/10 py-2.5 px-1 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-all pr-10"
                    />
                    <div
                      class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center"
                    >
                      @if (customerSearchQuery()) {
                        <button
                          (click)="customerSearchQuery.set('')"
                          class="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <svg
                            class="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M6 18L18 6M6 6l12 12"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </button>
                      } @else {
                        <svg
                          class="w-3.5 h-3.5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                        </svg>
                      }
                    </div>
                  </div>
                  <div
                    #customerResultsContainer
                    class="max-h-48 overflow-y-auto custom-scrollbar space-y-1"
                  >
                    @for (
                      c of filteredCustomerOptions();
                      track c.id;
                      let i = $index
                    ) {
                      <button
                        (click)="onCustomerSelect(c)"
                        (mouseenter)="activeCustomerIndex.set(i)"
                        [class.bg-primary/10]="activeCustomerIndex() === i"
                        class="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 group transition-all outline-none"
                      >
                        <p
                          class="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors"
                          [class.text-primary]="activeCustomerIndex() === i"
                        >
                          {{ c.name }}
                        </p>
                        <p
                          class="text-[9px] font-black uppercase text-slate-400"
                        >
                          #{{ c.id }}
                        </p>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Stats (Primary row) -->
            <div
              class="flex-1 w-full flex flex-wrap items-center justify-center xl:justify-start gap-10"
            >
              <div class="flex flex-col">
                <p
                  class="text-[8px] font-black uppercase text-slate-400 mb-0.5"
                >
                  Subtotal
                </p>
                <p class="text-base font-black text-primary">
                  {{ subtotal() | currency }}
                </p>
              </div>
              <div
                class="h-6 w-[1px] bg-slate-200 dark:bg-white/10 hidden md:block"
              ></div>
              <div class="flex flex-col">
                <p class="label-premium mb-0.5">Total Items</p>
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
                  [label]="isEditMode() ? 'Save Changes' : 'Create Order'"
                ></lib-loader>
              </button>
            </div>
          </div>

          <!-- Edit Configuration Row -->
          @if (isEditMode()) {
            <div
              class="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-end gap-10 animate-fade-in"
            >
              <div class="w-48">
                <label
                  class="text-[8px] font-black uppercase text-slate-400 mb-1 block"
                  >Order Status</label
                >
                <lib-custom-dropdown
                  [options]="statusOptions"
                  [value]="selectedStatus()"
                  (valueChange)="selectedStatus.set($event)"
                ></lib-custom-dropdown>
              </div>

              <div class="w-48">
                <label
                  class="text-[8px] font-black uppercase text-slate-400 mb-1 block"
                  >Shipping Priority</label
                >
                <lib-custom-dropdown
                  [options]="priorityOptions"
                  [value]="isPriority() ? 'Express' : 'Standard'"
                  (valueChange)="isPriority.set($event === 'Express')"
                ></lib-custom-dropdown>
              </div>

              <div class="w-48">
                <label
                  class="text-[8px] font-black uppercase text-slate-400 mb-1 block"
                  >Fulfillment Date</label
                >
                <lib-custom-datepicker
                  [value]="orderDate()"
                  (dateChange)="orderDate.set($event)"
                  placeholder="Select Date"
                ></lib-custom-datepicker>
              </div>

              <div class="flex-1"></div>

              <div
                class="flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-100 dark:border-white/5"
              >
                <div
                  class="w-2 h-2 rounded-full bg-primary animate-pulse"
                ></div>
                <span
                  class="text-[9px] font-black uppercase tracking-widest text-slate-500"
                  >Live Edit Mode Active</span
                >
              </div>
            </div>
          } @else {
            <!-- Simple Priority Toggle for Creation Mode -->
            <div
              class="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center animate-fade-in"
            >
              <button
                (click)="isPriority.set(!isPriority())"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 active:scale-95 text-[9px] font-black uppercase tracking-widest"
                [class.bg-amber-500/10]="isPriority()"
                [class.text-amber-500]="isPriority()"
                [class.border-amber-500/20]="isPriority()"
                [class.bg-slate-50]="!isPriority()"
                [class.dark:bg-white/5]="!isPriority()"
                [class.text-slate-400]="!isPriority()"
                [class.border-slate-200]="!isPriority()"
                [class.dark:border-white/10]="!isPriority()"
              >
                <div
                  class="w-2 h-2 rounded-full transition-colors duration-300"
                  [class.bg-amber-500]="isPriority()"
                  [class.bg-slate-300]="!isPriority()"
                ></div>
                Mark as High Priority
              </button>
            </div>
          }
        </div>

        <!-- Dynamic Order Items List -->
        <div class="card-premium p-4 relative">
          <div class="flex items-center justify-between mb-1">
            <h3
              class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight"
            >
              Order Items
            </h3>
            <!-- Scanner Input -->
            <div class="relative group">
              <input
                type="text"
                [(ngModel)]="scanInput"
                (keyup.enter)="handleScan()"
                class="bg-transparent border-b-2 border-slate-200 dark:border-white/10 focus:border-primary py-1.5 px-1 text-xs font-bold text-slate-900 dark:text-white outline-none transition-all pr-8 w-64"
              />
              <label
                class="absolute left-1 transition-all duration-200 pointer-events-none uppercase font-black tracking-widest text-slate-400"
                [class.text-[8px]]="scanInput"
                [class.top-[-10px]]="scanInput"
                [class.text-xs]="!scanInput"
                [class.top-1.5]="!scanInput"
              >
                Scan Product ID
              </label>
              <svg
                class="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 17h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
          </div>

          <!-- Scrollable Items Container -->
          <div
            class="max-h-[500px] overflow-y-auto custom-scrollbar -mx-2 px-2 pb-60 pt-1"
          >
            <div class="space-y-2">
              <!-- Table Headers -->
              @if (orderItems().length > 0) {
                <div
                  class="grid grid-cols-[40px_1fr_100px_100px_100px_40px] gap-2 p-3 border-b border-slate-100 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 sticky top-0 bg-white dark:bg-[#0f172a] z-20 border-b-2 border-b-primary dark:border-primary/40"
                >
                  <span>#</span>
                  <span>Name</span>
                  <span class="text-center">Qty</span>
                  <span class="text-right">Price</span>
                  <span class="text-right">Total</span>
                  <span></span>
                </div>
              }

              <!-- Item Rows -->
              @for (
                item of orderItems();
                track item.productId;
                let i = $index
              ) {
                <div
                  class="grid grid-cols-[40px_1fr_100px_100px_100px_40px] gap-2 px-4 py-2 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 rounded-xl items-center group animate-fade-in shadow-sm"
                >
                  <span class="text-[10px] font-black text-slate-400">{{
                    i + 1
                  }}</span>
                  <div class="flex items-center gap-2 truncate">
                    <div
                      class="w-6 h-6 bg-primary/10 rounded flex items-center justify-center text-primary flex-shrink-0"
                    >
                      <svg
                        class="w-3 h-3"
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
                    <div class="truncate">
                      <p
                        class="text-xs font-bold text-slate-900 dark:text-white truncate"
                      >
                        {{ item.name }}
                      </p>
                      <p class="text-[8px] font-black uppercase text-slate-400">
                        #{{ item.productId }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      (click)="updateQty(item, -1)"
                      class="w-5 h-5 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-primary active:scale-90 transition-all text-xs"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      [ngModel]="item.qty"
                      (ngModelChange)="setQty(item, $event)"
                      class="w-12 text-center text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded focus:border-primary outline-none py-0.5"
                      [max]="getProductStock(item.productId)"
                      min="1"
                    />
                    <button
                      (click)="updateQty(item, 1)"
                      [disabled]="item.qty >= getProductStock(item.productId)"
                      [class.opacity-30]="item.qty >= getProductStock(item.productId)"
                      [class.cursor-not-allowed]="item.qty >= getProductStock(item.productId)"
                      class="w-5 h-5 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-primary active:scale-90 transition-all text-xs"
                    >
                      +
                    </button>
                  </div>
                  <span class="text-xs font-bold text-slate-500 text-right">{{
                    item.price | currency
                  }}</span>
                  <span class="text-xs font-black text-primary text-right">{{
                    item.price * item.qty | currency
                  }}</span>
                  <button
                    (click)="removeItem(i)"
                    class="p-1 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              }

              <!-- Search "Draft" Row -->
              <div
                class="relative group mt-2"
                (click)="$event.stopPropagation()"
              >
                <button
                  type="button"
                  (click)="toggleProductSearch($event)"
                  class="w-full bg-slate-50/50 dark:bg-white/[0.02] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all outline-none focus:border-primary/50"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary"
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <span
                      class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight"
                      >Add Product Item</span
                    >
                  </div>
                  <div
                    class="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-widest"
                  >
                    <span>Click to Search</span>
                    <svg
                      class="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </button>

                @if (showProductResults()) {
                  <div
                    (click)="$event.stopPropagation()"
                    class="absolute top-full mt-2 left-0 right-0 card-premium z-[300] p-3 animate-fade-in shadow-xl"
                  >
                    <div class="relative mb-3">
                      <input
                        #productSearchInput
                        type="text"
                        [ngModel]="productSearchQuery()"
                        (ngModelChange)="productSearchQuery.set($event)"
                        (keydown)="handleProductKeydown($event)"
                        placeholder="Search products..."
                        class="w-full bg-transparent border-b-2 border-slate-200 dark:border-white/10 py-2.5 px-1 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-primary pr-10"
                      />
                      <div
                        class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center"
                      >
                        @if (productSearchQuery()) {
                          <button
                            (click)="productSearchQuery.set('')"
                            class="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <svg
                              class="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M6 18L18 6M6 6l12 12"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </button>
                        } @else {
                          <svg
                            class="w-4 h-4 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              stroke-width="2"
                              stroke-linecap="round"
                            />
                          </svg>
                        }
                      </div>
                    </div>
                    <div
                      #productResultsContainer
                      class="max-h-48 overflow-y-auto custom-scrollbar space-y-1"
                    >
                      @for (
                        p of filteredProductOptions();
                        track p.id;
                        let i = $index
                      ) {
                        <button
                          (click)="addItemToOrder(p)"
                          (mouseenter)="activeProductIndex.set(i)"
                          [class.bg-primary/10]="activeProductIndex() === i"
                          class="w-full flex items-center justify-between p-3 rounded-lg transition-all group outline-none hover:bg-primary/10"
                        >
                          <div class="text-left truncate mr-4">
                            <p
                              class="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors"
                              [class.text-primary]="activeProductIndex() === i"
                            >
                              {{ p.name }}
                            </p>
                            <p
                              class="text-[9px] text-slate-400 font-bold uppercase"
                            >
                              Stock: {{ p.stock }}
                            </p>
                          </div>
                          <p class="text-xs font-black text-primary">
                            {{ p.price | currency }}
                          </p>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      @keyframes pulse-slow {
        0%,
        100% {
          border-color: rgba(109, 116, 255, 0.1);
        }
        50% {
          border-color: rgba(109, 116, 255, 0.4);
        }
      }
      .animate-pulse-slow {
        animation: pulse-slow 2s infinite ease-in-out;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(109, 116, 255, 0.1);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(109, 116, 255, 0.2);
      }
    `,
  ],
})
export class OrderCreateComponent implements OnInit {
  public service = inject(OrdersService);
  private dataService = inject(InventoryDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = signal(false);
  orderId: string | null = null;

  scanInput = '';
  productSearchQuery = signal('');
  customerSearchQuery = signal('');
  showProductResults = signal(false);
  showCustomerSearch = signal(false);
  activeCustomerIndex = signal(0);
  activeProductIndex = signal(0);

  private eRef = inject(ElementRef);
  private http = inject(HttpClient);

  customerSearchInput = viewChild<ElementRef<HTMLInputElement>>('customerSearchInput');
  productSearchInput = viewChild<ElementRef<HTMLInputElement>>('productSearchInput');
  customerResultsContainer = viewChild<ElementRef<HTMLDivElement>>('customerResultsContainer');
  productResultsContainer = viewChild<ElementRef<HTMLDivElement>>('productResultsContainer');

  selectedCustomerId = signal<string | null>(null);
  selectedCustomerName = signal<string | null>(null);
  isPriority = signal(false);
  selectedStatus = signal<any>('Pending');
  orderDate = signal<string>(new Date().toISOString().split('T')[0]);
  orderItems = signal<OrderItem[]>([]);

  statusOptions: DropdownOption[] = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  priorityOptions: DropdownOption[] = [
    { value: 'Standard', label: 'Standard Tier' },
    { value: 'Express', label: 'Express (High Priority)' },
  ];

  filteredCustomerOptions = computed(() => {
    const query = this.customerSearchQuery().toLowerCase().trim();
    if (!query) return this.service.customerOptions();
    return this.service
      .customerOptions()
      .filter((c) => c.name.toLowerCase().includes(query) || c.id.toString().includes(query));
  });

  filteredProductOptions = computed(() => {
    const query = this.productSearchQuery().toLowerCase().trim();
    if (!query) return this.service.productOptions();
    return this.service
      .productOptions()
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) || p.id.toString() === query || p.category.toLowerCase().includes(query),
      );
  });

  subtotal = computed(() => this.orderItems().reduce((sum, item) => sum + item.price * item.qty, 0));

  totalItemsCount = computed(() => this.orderItems().reduce((sum, item) => sum + item.qty, 0));

  canSubmit = computed(() => this.selectedCustomerId() !== null && this.orderItems().length > 0);

  constructor() {
    effect(() => {
      this.customerSearchQuery();
      this.activeCustomerIndex.set(0);
    });

    effect(() => {
      this.productSearchQuery();
      this.activeProductIndex.set(0);
    });
  }

  ngOnInit() {
    // Load full lists of customers and products for selection dropdowns
    forkJoin([
      this.http.get<Customer[]>(`${this.dataService.baseUrl}/customers`),
      this.http.get<Product[]>(`${this.dataService.baseUrl}/products`),
    ]).subscribe(([customers, products]) => {
      this.dataService.setCustomers(customers);
      this.dataService.setProducts(products);

      this.route.params.subscribe((params) => {
        if (params['id']) {
          this.isEditMode.set(true);
          this.orderId = params['id'];
          this.loadOrder();
        }
      });
    });
  }

  loadOrder() {
    const order = this.service.getOrder(this.orderId || '');
    if (order) {
      const customer = this.dataService
        .customers()
        .find((c: Customer) => c.name === order.customer || c.id === order.customer);
      this.selectedCustomerId.set(customer?.id || 'manual');
      this.selectedCustomerName.set(order.customer);
      this.isPriority.set(order.priority);
      this.selectedStatus.set(order.status);
      this.orderDate.set(order.date);
      this.orderItems.set([...order.items]);
    } else {
      this.router.navigate(['/inventory/orders']);
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.closeAllPopovers();
    }
  }

  handleCustomerKeydown(event: KeyboardEvent) {
    if (this.showCustomerSearch()) {
      const options = this.filteredCustomerOptions();
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.activeCustomerIndex.update((i) => (i + 1) % options.length);
          this.scrollToActiveItem(this.customerResultsContainer(), this.activeCustomerIndex());
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.activeCustomerIndex.update((i) => (i - 1 + options.length) % options.length);
          this.scrollToActiveItem(this.customerResultsContainer(), this.activeCustomerIndex());
          break;
        case 'Enter':
          event.preventDefault();
          if (options[this.activeCustomerIndex()]) {
            this.onCustomerSelect(options[this.activeCustomerIndex()]);
          }
          break;
        case 'Escape':
          this.closeAllPopovers();
          break;
      }
    }
  }

  handleProductKeydown(event: KeyboardEvent) {
    if (this.showProductResults()) {
      const options = this.filteredProductOptions();
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.activeProductIndex.update((i) => (i + 1) % options.length);
          this.scrollToActiveItem(this.productResultsContainer(), this.activeProductIndex());
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.activeProductIndex.update((i) => (i - 1 + options.length) % options.length);
          this.scrollToActiveItem(this.productResultsContainer(), this.activeProductIndex());
          break;
        case 'Enter':
          event.preventDefault();
          if (options[this.activeProductIndex()]) {
            this.addItemToOrder(options[this.activeProductIndex()]);
          }
          break;
        case 'Escape':
          this.closeAllPopovers();
          break;
      }
    }
  }

  closeAllPopovers() {
    this.showCustomerSearch.set(false);
    this.showProductResults.set(false);
  }

  onCustomerSelect(customer: any) {
    this.selectedCustomerId.set(customer.id);
    this.selectedCustomerName.set(customer.name);
    this.showCustomerSearch.set(false);
    this.customerSearchQuery.set('');
  }

  toggleCustomerSearch(event: Event) {
    event.stopPropagation();
    const currentState = this.showCustomerSearch();
    this.closeAllPopovers();
    this.showCustomerSearch.set(!currentState);
    if (this.showCustomerSearch()) {
      this.activeCustomerIndex.set(0);
      setTimeout(() => this.customerSearchInput()?.nativeElement.focus(), 0);
    }
  }

  toggleProductSearch(event: Event) {
    event.stopPropagation();
    const currentState = this.showProductResults();
    this.closeAllPopovers();
    this.showProductResults.set(!currentState);

    if (this.showProductResults()) {
      this.productSearchQuery.set('');
      this.activeProductIndex.set(0);
      setTimeout(() => {
        this.productSearchInput()?.nativeElement.focus();
        const container = document.querySelector('.max-h-\\[500px\\]');
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
          });
        }
      }, 100);
    }
  }

  handleScan() {
    const input = this.scanInput.trim();
    if (!input) return;

    const product = this.dataService
      .products()
      .find((p: Product) => p.id.toString() === input || p.name.toLowerCase().includes(input.toLowerCase()));

    if (product) {
      this.addItemToOrder(product);
      this.scanInput = '';
    } else {
      this.scanInput = '';
    }
  }

  addItemToOrder(product: Product) {
    this.orderItems.update((items) => {
      const existing = items.find((i) => i.productId === product.id);
      if (existing) {
        return items.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + 1 } : i));
      } else {
        return [
          ...items,
          {
            productId: product.id,
            name: product.name,
            qty: 1,
            price: product.price,
          },
        ];
      }
    });
    this.productSearchQuery.set('');
    this.showProductResults.set(false);
  }

  getProductStock(productId: number): number {
    const p = this.dataService.products().find((prod) => prod.id === productId);
    return p ? p.stock : 99999;
  }

  setQty(item: OrderItem, value: any) {
    const qty = parseInt(value, 10);
    if (Number.isNaN(qty) || qty < 1) return;
    const maxStock = this.getProductStock(item.productId);
    const targetQty = Math.min(maxStock, qty);
    this.orderItems.update((items) => {
      return items.map((i) => {
        if (i.productId === item.productId) {
          return { ...i, qty: targetQty };
        }
        return i;
      });
    });
  }

  updateQty(item: OrderItem, delta: number) {
    const maxStock = this.getProductStock(item.productId);
    this.orderItems.update((items) => {
      return items.map((i) => {
        if (i.productId === item.productId) {
          const newQty = Math.min(maxStock, Math.max(1, i.qty + delta));
          return { ...i, qty: newQty };
        }
        return i;
      });
    });
  }

  removeItem(index: number) {
    this.orderItems.update((items) => items.filter((_, i) => i !== index));
  }

  submitOrder() {
    if (!this.canSubmit()) return;

    const order: Order = {
      id: (this.isEditMode() ? this.orderId : `ORD-${Math.floor(1000 + Math.random() * 9000)}`) as string,
      customer: this.selectedCustomerName() || '',
      customerName: this.selectedCustomerName() || '',
      status: this.isEditMode() ? this.selectedStatus() : 'Pending',
      priority: this.isPriority(),
      date: this.orderDate(),
      items: this.orderItems(),
      totalAmount: this.subtotal(),
      amount: this.subtotal(),
      createdBy: this.isEditMode() ? this.service.getOrder(this.orderId || '')?.createdBy || 'Admin' : 'Admin',
    };

    const action = this.isEditMode() ? this.service.updateOrder(order) : this.service.addOrder(order);

    action.subscribe(() => {
      this.router.navigate(['/inventory/orders', order.id]);
    });
  }

  private scrollToActiveItem(containerRef: ElementRef<HTMLDivElement> | undefined, index: number) {
    if (!containerRef) return;
    const container = containerRef.nativeElement;
    const items = container.querySelectorAll('button');
    const activeItem = items[index] as HTMLElement;

    if (activeItem) {
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      const itemTop = activeItem.offsetTop;
      const itemBottom = itemTop + activeItem.clientHeight;

      if (itemTop < containerTop) {
        container.scrollTo({ top: itemTop, behavior: 'smooth' });
      } else if (itemBottom > containerBottom) {
        container.scrollTo({
          top: itemBottom - container.clientHeight,
          behavior: 'smooth',
        });
      }
    }
  }
}
