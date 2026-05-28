import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, DestroyRef, HostListener, inject, type OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { InventoryDataService, LoaderComponent, type Offer, type Product, SkeletonComponent } from 'ui-shared';
import { CartService } from './services/cart.service';
import { StoreStateService } from './services/store-state.service';
import { WishlistService } from './services/wishlist.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent, SkeletonComponent],
  template: `
    <div class="shopper-products-page animate-fade-in">
      @if (isLoading()) {
        <!-- Compact Sidebar Skeleton -->
        <aside class="shopper-sidebar w-[210px] shrink-0">
          <div class="sidebar-section">
            <lib-skeleton width="120px" height="1.6rem" shape="rounded" customClass="mb-4"></lib-skeleton>
            <ul class="cat-list">
              @for (x of [1, 2, 3, 4, 5]; track x) {
                <li class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
                  <lib-skeleton width="80px" height="1rem" shape="rounded"></lib-skeleton>
                  <lib-skeleton width="24px" height="1rem" shape="rounded"></lib-skeleton>
                </li>
              }
            </ul>
          </div>

          <div class="sidebar-section mt-6">
            <lib-skeleton width="100px" height="1.6rem" shape="rounded" customClass="mb-4"></lib-skeleton>
            <div class="price-opts flex flex-col gap-3">
              <div class="flex items-center gap-2">
                <lib-skeleton width="18px" height="18px" shape="rounded"></lib-skeleton>
                <lib-skeleton width="80px" height="1rem" shape="rounded"></lib-skeleton>
              </div>
              <div class="flex items-center gap-2">
                <lib-skeleton width="18px" height="18px" shape="rounded"></lib-skeleton>
                <lib-skeleton width="90px" height="1rem" shape="rounded"></lib-skeleton>
              </div>
              <div class="flex items-center gap-2">
                <lib-skeleton width="18px" height="18px" shape="rounded"></lib-skeleton>
                <lib-skeleton width="75px" height="1rem" shape="rounded"></lib-skeleton>
              </div>
            </div>
          </div>

          <div class="sidebar-section mt-6">
            <lib-skeleton width="80px" height="1.6rem" shape="rounded" customClass="mb-4"></lib-skeleton>
            <div class="size-grid flex gap-2">
              <lib-skeleton width="36px" height="36px" shape="rounded"></lib-skeleton>
              <lib-skeleton width="36px" height="36px" shape="rounded"></lib-skeleton>
              <lib-skeleton width="36px" height="36px" shape="rounded"></lib-skeleton>
              <lib-skeleton width="36px" height="36px" shape="rounded"></lib-skeleton>
            </div>
          </div>
        </aside>

        <!-- Main Content Skeleton -->
        <div class="shopper-content">
          <header class="content-header flex justify-between items-center mb-6">
            <div>
              <lib-skeleton width="220px" height="2.5rem" shape="rounded" customClass="mb-2"></lib-skeleton>
              <lib-skeleton width="120px" height="1rem" shape="rounded"></lib-skeleton>
            </div>
            <lib-skeleton width="140px" height="2.5rem" shape="rounded"></lib-skeleton>
          </header>

          <div class="shopper-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            @for (x of [1, 2, 3, 4, 5, 6]; track x) {
              <div class="product-card bg-slate-50 dark:bg-white/5 rounded-xl p-4 flex flex-col gap-4">
                <div class="card-visual h-60 bg-slate-100 dark:bg-white/10 rounded-lg flex items-center justify-center relative">
                  <lib-skeleton width="70px" height="70px" shape="rounded"></lib-skeleton>
                  <div class="absolute top-4 right-4">
                    <lib-skeleton width="32px" height="32px" shape="circle"></lib-skeleton>
                  </div>
                </div>
                <div class="flex flex-col gap-2 p-2">
                  <div class="flex justify-between items-center">
                    <lib-skeleton width="60px" height="0.8rem" shape="rounded"></lib-skeleton>
                    <lib-skeleton width="40px" height="0.8rem" shape="rounded"></lib-skeleton>
                  </div>
                  <lib-skeleton width="90%" height="1.4rem" shape="rounded" customClass="mt-1"></lib-skeleton>
                  <div class="flex justify-between items-center mt-4">
                    <lib-skeleton width="80px" height="1.4rem" shape="rounded"></lib-skeleton>
                    <lib-skeleton width="100px" height="2.2rem" shape="rounded"></lib-skeleton>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <!-- Compact Sidebar -->
        <aside class="shopper-sidebar">
          <div class="sidebar-section">
            <h3>Categories</h3>
            <ul class="cat-list">
              <li
                [class.active]="!storeState.selectedCategory()"
                (click)="selectCategory(null)"
              >
                All <span>{{ inventoryService.products().length }}</span>
              </li>
              <li
                *ngFor="let cat of categories()"
                [class.active]="storeState.selectedCategory() === cat"
                (click)="selectCategory(cat)"
              >
                {{ cat }} <span>{{ getCategoryCount(cat) }}</span>
              </li>
            </ul>
          </div>

          <div class="sidebar-section">
            <h3>Price</h3>
            <div class="price-opts">
              <label class="check-opt"
                ><input type="checkbox" /> Under $100</label
              >
              <label class="check-opt"
                ><input type="checkbox" /> $100 - $500</label
              >
              <label class="check-opt"><input type="checkbox" /> Over $500</label>
            </div>
          </div>

          <div class="sidebar-section">
            <h3>Size</h3>
            <div class="size-grid">
              <button class="size-btn">S</button>
              <button class="size-btn active">M</button>
              <button class="size-btn">L</button>
              <button class="size-btn">XL</button>
            </div>
          </div>
        </aside>

        <!-- Mobile Filter Drawer -->
        <div class="mobile-filter-drawer" [class.open]="isMobileFilterOpen()">
          <div
            class="drawer-backdrop"
            (click)="isMobileFilterOpen.set(false)"
          ></div>
          <div class="drawer-content animate-slide-up">
            <div class="drawer-header">
              <h3>Filters</h3>
              <button (click)="isMobileFilterOpen.set(false)">✕</button>
            </div>
            <div class="drawer-body">
              <!-- Reuse sidebar sections or similar -->
              <div class="sidebar-section">
                <h3>Categories</h3>
                <ul class="cat-list">
                  <li
                    [class.active]="!storeState.selectedCategory()"
                    (click)="selectCategory(null); isMobileFilterOpen.set(false)"
                  >
                    All <span>{{ inventoryService.products().length }}</span>
                  </li>
                  <li
                    *ngFor="let cat of categories()"
                    [class.active]="storeState.selectedCategory() === cat"
                    (click)="selectCategory(cat); isMobileFilterOpen.set(false)"
                  >
                    {{ cat }} <span>{{ getCategoryCount(cat) }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Floating Filter FAB (Mobile Only) -->
        <button
          class="filter-fab sm:hidden"
          (click)="isMobileFilterOpen.set(true)"
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
              stroke-width="2.5"
              d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
            ></path>
          </svg>
          <span>Filters</span>
        </button>

        <!-- Main Content -->
        <div class="shopper-content">
          <!-- Compact Header -->
          <header class="content-header">
            <div class="h-left">
              <h1>
                {{
                  storeState.showOffersOnly()
                    ? "Current Offers"
                    : storeState.selectedCategory() || "All Products"
                }}
              </h1>
              <p class="results-count">
                {{ filteredProducts().length }} items found
              </p>
            </div>

            <div class="h-right">
              <div
                class="sort-wrap"
                (click)="$event.stopPropagation(); toggleSort()"
              >
                <button class="sort-btn">
                  <span>{{ getSortLabel() }}</span>
                  <span class="chev">▾</span>
                </button>
                <div class="sort-menu" *ngIf="isSortOpen()">
                  <div class="option" (click)="selectSort('name')">Name: A-Z</div>
                  <div class="option" (click)="selectSort('price-low')">
                    Price: Low
                  </div>
                  <div class="option" (click)="selectSort('price-high')">
                    Price: High
                  </div>
                </div>
              </div>
            </div>
          </header>

          <!-- Tight Grid (3-4 columns) -->
          <div class="shopper-grid">
            <div
              class="product-card animate-item-in"
              *ngFor="let product of visibleProducts(); let i = index"
              [style.animation-delay]="(i % 4) * 0.1 + 's'"
            >
              <div
                class="card-visual"
                [routerLink]="['/store/product', product.id]"
              >
                <div class="img-bg">
                  <span class="icon">📦</span>
                </div>
                <div class="card-badge" *ngIf="product.stock < 10">Low</div>
                <div class="offer-tag" *ngIf="getProductOffer(product.id)">
                  Sale
                </div>

                <button
                  class="heart-btn"
                  [class.active]="wishlist.isInWishlist(product.id)"
                  (click)="
                    $event.stopPropagation(); wishlist.toggleWishlist(product)
                  "
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    ></path>
                  </svg>
                </button>

                <!-- Compact Hover Actions -->
                <div class="card-hover-actions">
                  <ng-container
                    *ngIf="getItemInCart(product.id) as item; else addBtn"
                  >
                    <div class="pill-stepper" (click)="$event.stopPropagation()">
                      <button (click)="updateQty(product.id, item.quantity - 1)">
                        −
                      </button>
                      <span class="val">{{ item.quantity }}</span>
                      <button (click)="updateQty(product.id, item.quantity + 1)">
                        +
                      </button>
                    </div>
                  </ng-container>
                  <ng-template #addBtn>
                    <button
                      class="pill-btn add flex items-center justify-center min-w-[100px] min-h-[32px]"
                      (click)="$event.stopPropagation(); addToCart(product)"
                      [disabled]="isAddingProduct() === product.id"
                    >
                      <lib-loader
                        [loading]="isAddingProduct() === product.id"
                        [label]="
                          isAddingProduct() === product.id ? '' : 'Add to Cart'
                        "
                        customClass="scale-75"
                      ></lib-loader>
                    </button>
                  </ng-template>
                </div>
              </div>

              <div class="card-info">
                <div class="info-top">
                  <span class="category">{{ product.category }}</span>
                  <span class="stars">★ 4.8</span>
                </div>
                <h3 class="name" [routerLink]="['/store/product', product.id]">
                  {{ product.name }}
                </h3>
                <div class="info-bottom">
                  <div class="flex items-baseline gap-2">
                    <span
                      class="price"
                      [class.text-rose-500]="getProductOffer(product.id)"
                    >
                      {{
                        (getProductOffer(product.id)
                          ? product.price *
                            (1 - getProductOffer(product.id)!.discount / 100)
                          : product.price
                        ) | currency
                      }}
                    </span>
                    @if (getProductOffer(product.id)) {
                      <span
                        class="original text-[10px] text-slate-400 line-through font-bold"
                      >
                        {{ product.price | currency }}
                      </span>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="load-more-section" *ngIf="hasMoreProducts()">
            <button
              class="btn-load-more flex items-center justify-center min-h-[50px] min-w-[240px]"
              (click)="loadMore()"
              [disabled]="isLoadingMore()"
            >
              <lib-loader
                [loading]="isLoadingMore()"
                label="Load More Products"
              ></lib-loader>
            </button>
          </div>

          <div class="catalog-empty" *ngIf="filteredProducts().length === 0">
            <div class="empty-icon">🔎</div>
            <h2>No items</h2>
            <button class="shopper-btn-primary" (click)="clearFilters()">
              Clear
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .shopper-products-page {
        display: grid;
        grid-template-columns: 210px 1fr;
        gap: 3rem;
        padding-right: 2.5rem;
        align-items: start;
      }

      /* Compact Sidebar */
      .shopper-sidebar {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
      .sidebar-section h3 {
        font-size: 0.8rem;
        font-weight: 800;
        margin-bottom: 1rem;
        color: var(--text);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .cat-list {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .cat-list li {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-muted);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        transition: color 0.1s;
      }
      .cat-list li span {
        font-weight: 700;
        color: #9ca3af;
        font-size: 0.75rem;
      }
      .cat-list li:hover,
      .cat-list li.active {
        color: var(--primary);
      }

      .price-opts {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .check-opt {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-muted);
        cursor: pointer;
      }
      .check-opt input {
        width: 15px;
        height: 15px;
        accent-color: var(--primary);
      }

      .size-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.4rem;
      }
      .size-btn {
        aspect-ratio: 1;
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 800;
        color: var(--text);
        cursor: pointer;
      }
      .size-btn:hover,
      .size-btn.active {
        border-color: var(--primary);
        color: var(--primary);
      }

      /* Compact Content */
      .content-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border);
      }
      .content-header h1 {
        font-size: 1.5rem;
        font-weight: 900;
        margin: 0;
        color: var(--text);
        letter-spacing: -0.03em;
      }
      .results-count {
        font-size: 0.8rem;
        color: var(--text-muted);
        font-weight: 600;
      }

      .sort-wrap {
        position: relative;
      }
      .sort-btn {
        background: none;
        border: 1px solid var(--border);
        padding: 0.4rem 1.25rem;
        min-width: 160px;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--text);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .sort-btn span {
        color: var(--primary);
      }

      .sort-menu {
        position: absolute;
        top: calc(100% + 0.4rem);
        right: 0;
        width: 180px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0.3rem;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
        z-index: 100;
      }
      .option {
        padding: 0.5rem 0.75rem;
        font-size: 0.8,em;
        font-weight: 600;
        color: var(--text);
        border-radius: 6px;
        cursor: pointer;
      }
      .option:hover {
        background: var(--bg);
        color: var(--primary);
      }

      /* Carousel Styling */
      .offers-carousel {
        position: relative;
        height: 260px;
        background: var(--surface);
        border-radius: 1.5rem;
        overflow: hidden;
        margin-bottom: 3rem;
      }
      .carousel-track {
        display: flex;
        height: 100%;
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .offer-slide {
        min-width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 4rem;
        color: white;
        position: relative;
      }
      .offer-info {
        max-width: 50%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        position: relative;
        z-index: 2;
      }
      .offer-badge {
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(5px);
        padding: 0.4rem 1rem;
        border-radius: 99px;
        font-size: 0.75rem;
        font-weight: 900;
        width: fit-content;
      }
      .offer-info h2 {
        font-size: 2rem;
        font-weight: 900;
        margin: 0;
        letter-spacing: -0.03em;
      }
      .offer-info p {
        font-size: 0.95rem;
        opacity: 0.9;
        line-height: 1.5;
        margin: 0;
      }
      .btn-shop-offer {
        background: white;
        color: #111827;
        border: none;
        padding: 0.85rem 1.75rem;
        border-radius: 12px;
        font-weight: 800;
        font-size: 0.9rem;
        cursor: pointer;
        width: fit-content;
        margin-top: 0.5rem;
        transition: transform 0.2s;
      }
      .btn-shop-offer:hover {
        transform: scale(1.05);
      }
      .offer-visual {
        font-size: 8rem;
        opacity: 0.15;
        position: absolute;
        right: 2rem;
        transform: rotate(15deg);
      }

      .carousel-dots {
        position: absolute;
        bottom: 1.5rem;
        right: 4rem;
        display: flex;
        gap: 0.5rem;
        z-index: 5;
      }
      .carousel-dots span {
        width: 8px;
        height: 8px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s;
      }
      .carousel-dots span.active {
        background: white;
        width: 24px;
        border-radius: 4px;
      }

      /* Tags & Wishlist */
      .offer-tag {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        background: var(--primary);
        color: white;
        font-size: 0.6rem;
        font-weight: 900;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        text-transform: uppercase;
      }
      .heart-btn {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        width: 34px;
        height: 34px;
        background: rgba(255, 255, 255, 0.9);
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        cursor: pointer;
        transition: all 0.2s;
        opacity: 0;
        transform: translateY(-5px);
        z-index: 10;
      }
      .product-card:hover .heart-btn {
        opacity: 1;
        transform: translateY(0);
      }
      .heart-btn:hover,
      .heart-btn.active {
        color: #ef4444;
      }
      .heart-btn.active {
        opacity: 1;
        transform: translateY(0);
        fill: #ef4444;
        stroke: #ef4444;
      }
      .offer-tag + .heart-btn {
        top: 2.75rem;
      }

      /* Tight Grid (Smaller Cards) */
      .shopper-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        gap: 2rem 1.5rem;
      }

      .product-card {
        display: flex;
        flex-direction: column;
      }

      .card-visual {
        position: relative;
        aspect-ratio: 1.1;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        margin-bottom: 1rem;
      }
      .img-bg {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .icon {
        font-size: 2.5rem;
        opacity: 0.2;
      }

      .card-badge {
        position: absolute;
        top: 0.75rem;
        left: 0.75rem;
        background: #ef4444;
        color: white;
        font-size: 0.6rem;
        font-weight: 900;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        text-transform: uppercase;
      }

      .card-hover-actions {
        position: absolute;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        display: flex;
        gap: 0.4rem;
        opacity: 0;
        transition: all 0.2s ease;
      }
      .product-card:hover .card-hover-actions {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      .pill-btn {
        background: white;
        color: #111827;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 99px;
        font-size: 0.75rem;
        font-weight: 800;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        white-space: nowrap;
      }
      .pill-btn.add:hover {
        background: var(--primary);
        color: white;
      }

      .pill-stepper {
        background: white;
        color: #111827;
        border-radius: 99px;
        display: flex;
        align-items: center;
        padding: 0.2rem;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
      .pill-stepper button {
        width: 28px;
        height: 28px;
        border: none;
        background: #f3f4f6;
        border-radius: 50%;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .pill-stepper button:hover {
        background: var(--primary);
        color: white;
      }
      .pill-stepper .val {
        font-size: 0.85rem;
        font-weight: 800;
        padding: 0 0.75rem;
        min-width: 30px;
        text-align: center;
      }

      .card-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .info-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .info-top .category {
        font-size: 0.7rem;
        color: var(--text-muted);
        font-weight: 700;
        text-transform: uppercase;
      }
      .stars {
        font-size: 0.7rem;
        color: #fbbf24;
        font-weight: 800;
      }

      .card-info h3 {
        font-size: 0.95rem;
        font-weight: 700;
        margin: 0;
        color: var(--text);
        cursor: pointer;
        transition: color 0.1s;
        line-height: 1.3;
        min-height: 2.5rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .card-info h3:hover {
        color: var(--primary);
      }

      .info-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.25rem;
      }
      .price {
        font-size: 1rem;
        font-weight: 900;
        color: var(--text);
      }

      .mini-stepper .qty {
        padding: 0 0.5rem;
        font-size: 0.8rem;
        font-weight: 800;
      }

      /* Load More Section */
      .load-more-section {
        display: flex;
        justify-content: center;
        margin-top: 4rem;
      }
      .btn-load-more {
        position: relative;
        padding: 1rem 3rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 15px;
        font-weight: 800;
        color: var(--text);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }
      .btn-load-more:hover {
        border-color: var(--primary);
        color: var(--primary);
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(109, 116, 255, 0.1);
      }
      .btn-load-more.loading {
        pointer-events: none;
        padding: 1rem;
        width: 50px;
        border-radius: 50%;
        border-color: var(--primary);
      }
      .loader {
        display: block;
        width: 20px;
        height: 20px;
        border: 3px solid var(--border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .animate-item-in {
        animation: itemIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        opacity: 0;
      }
      @keyframes itemIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Empty */
      .catalog-empty {
        grid-column: 1 / -1;
        padding: 6rem 2rem;
        text-align: center;
        color: var(--text-muted);
      }

      @media (max-width: 900px) {
        .shopper-products-page {
          grid-template-columns: 1fr;
          padding-right: 1.5rem;
        }
        .shopper-sidebar {
          display: none;
        }
      }

      /* Mobile Drawer Styles */
      .mobile-filter-drawer {
        position: fixed;
        inset: 0;
        z-index: 2000;
        visibility: hidden;
        pointer-events: none;
      }
      .mobile-filter-drawer.open {
        visibility: visible;
        pointer-events: auto;
      }
      .drawer-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        opacity: 0;
        transition: opacity 0.3s;
      }
      .mobile-filter-drawer.open .drawer-backdrop {
        opacity: 1;
      }
      .drawer-content {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--surface);
        border-top-left-radius: 2rem;
        border-top-right-radius: 2rem;
        padding: 2rem;
        transform: translateY(100%);
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .mobile-filter-drawer.open .drawer-content {
        transform: translateY(0);
      }
      .drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }
      .drawer-header h3 {
        font-size: 1.25rem;
        font-weight: 900;
        margin: 0;
      }
      .drawer-header button {
        background: var(--bg);
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        font-weight: 800;
        cursor: pointer;
      }

      .filter-fab {
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--text);
        color: var(--bg);
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 99px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 800;
        font-size: 0.85rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 900;
        transition: all 0.2s;
      }
      .filter-fab:active {
        transform: translateX(-50%) scale(0.95);
      }
    `,
  ],
})
export class ProductListComponent implements OnInit {
  private http = inject(HttpClient);
  protected inventoryService = inject(InventoryDataService);
  private cartService = inject(CartService);
  protected storeState = inject(StoreStateService);
  wishlist = inject(WishlistService);

  isSortOpen = signal(false);
  activeOfferIndex = signal(0);
  visibleCount = signal(12);
  isLoadingMore = signal(false);
  isMobileFilterOpen = signal(false);

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(true);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    const sub = forkJoin([
      this.http.get<Product[]>(`${this.inventoryService.baseUrl}/products`),
      this.http.get<Offer[]>(`${this.inventoryService.baseUrl}/offers`),
    ]).subscribe({
      next: ([products, offers]) => {
        this.inventoryService.setProducts(products);
        this.inventoryService.setOffers(offers);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading product list data:', error);
        this.isLoading.set(false);
      },
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  constructor() {
    const subUrl = this.route.url.subscribe(() => this.updateOffersState());
    const subParams = this.route.queryParams.subscribe((params) => {
      if (params['category']) {
        this.storeState.setCategory(params['category']);
      }
    });
    this.destroyRef.onDestroy(() => {
      subUrl.unsubscribe();
      subParams.unsubscribe();
    });
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.isSortOpen.set(false);
  }

  private updateOffersState() {
    const isOffers = this.router.url.includes('/offers');
    this.storeState.setShowOffersOnly(isOffers);
  }

  toggleSort() {
    this.isSortOpen.update((v) => !v);
  }

  categories = computed(() => {
    const cats = this.inventoryService.products().map((p) => p.category);
    return [...new Set(cats)];
  });

  getCategoryCount(cat: string) {
    return this.inventoryService.products().filter((p) => p.category === cat).length;
  }

  filteredProducts = computed(() => {
    let prods = [...this.inventoryService.products()];
    const query = this.storeState.searchQuery().toLowerCase();
    const category = this.storeState.selectedCategory();
    const sortBy = this.storeState.sortBy();

    if (query) {
      prods = prods.filter((p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
    }

    if (category) {
      prods = prods.filter((p) => p.category === category);
    }

    if (this.storeState.showOffersOnly()) {
      prods = prods.filter(
        (p) => (p.discount || 0) > 0 || this.inventoryService.offers().some((o) => o.productId === p.id),
      );
    }

    prods.sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

    return prods;
  });

  visibleProducts = computed(() => {
    return this.filteredProducts().slice(0, this.visibleCount());
  });

  hasMoreProducts = computed(() => {
    return this.visibleCount() < this.filteredProducts().length;
  });

  loadMore() {
    this.isLoadingMore.set(true);
    setTimeout(() => {
      this.visibleCount.update((n) => n + 12);
      this.isLoadingMore.set(false);
    }, 800);
  }

  getSortLabel() {
    const sort = this.storeState.sortBy();
    if (sort === 'price-low') return 'Price: Low';
    if (sort === 'price-high') return 'Price: High';
    return 'Sort: A-Z';
  }

  selectCategory(category: string | null) {
    this.storeState.setCategory(category);
  }

  selectSort(sort: string) {
    this.storeState.setSortBy(sort);
    this.isSortOpen.set(false);
  }

  clearFilters() {
    this.storeState.setSearchQuery('');
    this.storeState.setCategory(null);
  }

  productOffersMap = computed(() => {
    const map = new Map<number, any>();
    for (const offer of this.inventoryService.offers()) {
      if (offer.productId !== undefined && offer.productId !== null) {
        map.set(offer.productId, offer);
      }
    }
    return map;
  });

  getItemInCart(productId: number) {
    return this.cartService.itemsMap().get(productId);
  }

  isAddingProduct = signal<number | null>(null);

  addToCart(product: Product) {
    this.isAddingProduct.set(product.id);
    setTimeout(() => {
      this.cartService.addToCart(product);
      this.isAddingProduct.set(null);
    }, 600);
  }

  updateQty(productId: number, qty: number) {
    this.cartService.updateQuantity(productId, qty);
  }

  getProductOffer(productId: number) {
    return this.productOffersMap().get(productId);
  }
}
