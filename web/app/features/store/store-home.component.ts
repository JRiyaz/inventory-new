import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { InventoryDataService, LoaderComponent, type Offer, type Product, TypewriterComponent } from 'ui-shared';
import { CartService } from './services/cart.service';
import { WishlistService } from './services/wishlist.service';

@Component({
  selector: 'app-store-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent, TypewriterComponent],
  template: `
    <div class="store-home animate-fade-in">
      <!-- Hero Poster -->
      <section class="hero-poster">
        <div class="hero-content">
          <span class="badge">Spring Collection 2026</span>
          <h1>
            <lib-typewriter
              [words]="[
                'Modern Living.',
                'Refined Style.',
                'Premium Quality.',
                'Curated Picks.',
              ]"
              [typeSpeed]="80"
              [deleteSpeed]="40"
            ></lib-typewriter>
          </h1>
          <p>
            Discover our latest collection of premium home and lifestyle
            products designed for the contemporary home.
          </p>
          <div class="hero-actions">
            <button class="btn-primary" routerLink="/store/categories" style="min-width: 175px; min-height: 50px;">
              <lib-loader label="Shop Collection"></lib-loader>
            </button>
            <button class="btn-secondary" routerLink="/store/offers" style="min-width: 145px; min-height: 50px;">
              <lib-loader label="View Offers"></lib-loader>
            </button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="abstract-shape"></div>
          <span class="main-icon">🛋️</span>
        </div>
      </section>

      <!-- Offers Carousel -->
      <section class="home-section" *ngIf="inventory.offers().length > 0">
        <div class="section-header">
          <h2>Limited Time Offers</h2>
          <a routerLink="/store/offers" class="view-all">View All</a>
        </div>

        <div class="offers-carousel">
          <div
            class="carousel-track"
            [style.transform]="'translateX(-' + activeOfferIndex() * 100 + '%)'"
          >
            <div
              class="offer-slide"
              *ngFor="let offer of inventory.offers()"
              [style.background]="offer.color || 'var(--primary)'"
            >
              <div class="slide-content">
                <span class="slide-badge">{{ offer.discount }}% OFF</span>
                <h3>{{ offer.title }}</h3>
                <p>{{ offer.description }}</p>
                <button
                  class="slide-btn"
                  [routerLink]="['/store/categories']"
                  [queryParams]="{ category: offer.category }"
                  style="min-width: 120px; min-height: 42px;"
                >
                  <lib-loader label="Shop Now"></lib-loader>
                </button>
              </div>
              <div class="slide-visual">🎁</div>
            </div>
          </div>
          <div class="carousel-dots">
            <span
              *ngFor="let off of inventory.offers(); let i = index"
              [class.active]="i === activeOfferIndex()"
              (click)="activeOfferIndex.set(i)"
            ></span>
          </div>
        </div>
      </section>

      <!-- Featured Categories -->
      <section class="home-section">
        <div class="section-header">
          <h2>Shop by Category</h2>
          <a routerLink="/store/categories" class="view-all">See All</a>
        </div>
        <div class="categories-strip">
          <div
            *ngFor="let cat of featuredCategories()"
            class="cat-pill"
            [routerLink]="['/store/categories']"
            [queryParams]="{ category: cat.name }"
          >
            <span class="cat-icon">{{ cat.icon }}</span>
            <span class="cat-name">{{ cat.name }}</span>
          </div>
        </div>
      </section>

      <!-- Trending Products -->
      <section class="home-section">
        <div class="section-header">
          <h2>Trending Now</h2>
          <p class="subtitle">Our most popular items this week.</p>
        </div>

        <div class="trending-grid">
          <div
            *ngFor="let product of trendingProducts(); let i = index"
            class="product-card-minimal animate-item-in"
            [style.animation-delay]="(i % 4) * 0.1 + 's'"
          >
            <div class="visual" [routerLink]="['/store/product', product.id]">
              <span class="icon">📦</span>
              <button
                class="wish-btn"
                (click)="
                  $event.stopPropagation(); wishlist.toggleWishlist(product)
                "
                [class.active]="wishlist.isInWishlist(product.id)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  ></path>
                </svg>
              </button>
            </div>
            <div class="info">
              <span class="cat">{{ product.category }}</span>
              <h4 [routerLink]="['/store/product', product.id]" class="cursor-pointer hover:text-primary transition-colors">{{ product.name }}</h4>
              <div class="bottom">
                <span class="price">{{ product.price | currency }}</span>

                <ng-container
                  *ngIf="getItemInCart(product.id) as item; else addBtn"
                >
                  <div class="home-stepper" (click)="$event.stopPropagation()">
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
                    class="add-btn"
                    (click)="$event.stopPropagation(); addToCart(product)"
                    [disabled]="isAddingProduct() === product.id"
                  >
                    <span *ngIf="isAddingProduct() !== product.id">+</span>
                    <lib-loader
                      *ngIf="isAddingProduct() === product.id"
                      [loading]="true"
                      customClass="scale-50 !text-white"
                    ></lib-loader>
                  </button>
                </ng-template>
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
              label="Load More Items"
            ></lib-loader>
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .store-home {
        padding-bottom: 5rem;
      }

      /* Hero Poster */
      .hero-poster {
        height: 500px;
        background: #111827;
        border-radius: 2.5rem;
        margin-bottom: 4rem;
        display: flex;
        align-items: center;
        padding: 0 5rem;
        color: white;
        position: relative;
        overflow: hidden;
      }
      .hero-content {
        max-width: 500px;
        position: relative;
        z-index: 5;
      }
      .hero-content .badge {
        background: rgba(255, 255, 255, 0.1);
        padding: 0.5rem 1rem;
        border-radius: 99px;
        font-size: 0.75rem;
        font-weight: 800;
        color: var(--primary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .hero-content h1 {
        font-size: 4rem;
        font-weight: 950;
        margin: 1.5rem 0;
        line-height: 1.1;
        letter-spacing: -0.04em;
      }
      .hero-content p {
        font-size: 1.1rem;
        opacity: 0.7;
        line-height: 1.6;
        margin-bottom: 2.5rem;
      }
      .hero-actions {
        display: flex;
        gap: 1rem;
      }
      .btn-primary {
        background: var(--primary);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.2s;
      }
      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
      }
      .btn-primary:hover {
        transform: translateY(-2px);
      }

      .hero-visual {
        position: absolute;
        right: 0;
        top: 0;
        width: 50%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .abstract-shape {
        position: absolute;
        width: 600px;
        height: 600px;
        background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
        opacity: 0.2;
        filter: blur(60px);
      }
      .main-icon {
        font-size: 15rem;
        opacity: 0.1;
        position: relative;
        z-index: 1;
        transform: rotate(-10deg);
      }

      /* Home Sections */
      .home-section {
        margin-bottom: 5rem;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 2rem;
      }
      .section-header h2 {
        font-size: 2rem;
        font-weight: 900;
        margin: 0;
        letter-spacing: -0.03em;
      }
      .section-header .subtitle {
        color: var(--text-muted);
        margin: 0.5rem 0 0;
        font-weight: 500;
      }
      .view-all {
        color: var(--primary);
        font-weight: 800;
        font-size: 0.9rem;
        text-decoration: none;
      }

      /* Carousel Refined */
      .offers-carousel {
        position: relative;
        height: 300px;
        border-radius: 2rem;
        overflow: hidden;
        background: var(--surface);
      }
      .carousel-track {
        display: flex;
        height: 100%;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .offer-slide {
        min-width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 5rem;
        color: white;
      }
      .slide-content {
        max-width: 50%;
      }
      .slide-badge {
        background: rgba(255, 255, 255, 0.2);
        padding: 0.4rem 1rem;
        border-radius: 99px;
        font-size: 0.7rem;
        font-weight: 900;
      }
      .slide-content h3 {
        font-size: 2.5rem;
        font-weight: 900;
        margin: 1rem 0;
      }
      .slide-btn {
        background: white;
        color: black;
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 10px;
        font-weight: 800;
        cursor: pointer;
        margin-top: 1rem;
      }
      .slide-visual {
        font-size: 8rem;
        opacity: 0.2;
        transform: rotate(15deg);
      }
      .carousel-dots {
        position: absolute;
        bottom: 1.5rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 0.5rem;
      }
      .carousel-dots span {
        width: 8px;
        height: 8px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        cursor: pointer;
      }
      .carousel-dots span.active {
        background: white;
        width: 24px;
        border-radius: 4px;
      }

      /* Categories Strip */
      .categories-strip {
        display: flex;
        gap: 1.5rem;
        overflow-x: auto;
        padding: 0.5rem 0;
        scrollbar-width: none;
      }
      .cat-pill {
        flex-shrink: 0;
        background: var(--surface);
        border: 1px solid var(--border);
        padding: 1rem 2rem;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 1rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .cat-pill:hover {
        border-color: var(--primary);
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
      }
      .cat-icon {
        font-size: 1.5rem;
      }
      .cat-name {
        font-weight: 800;
        font-size: 0.95rem;
      }

      /* Trending Grid */
      .trending-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 2rem;
      }
      .product-card-minimal {
        background: var(--surface);
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid var(--border);
        transition: all 0.3s;
      }
      .product-card-minimal:hover {
        transform: translateY(-5px);
        border-color: var(--primary);
      }
      .visual {
        height: 200px;
        background: var(--bg);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .visual .icon {
        font-size: 4rem;
        opacity: 0.1;
      }
      .wish-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ccc;
        cursor: pointer;
        transition: all 0.2s;
      }
      .wish-btn.active {
        color: #ef4444;
      }
      .info {
        padding: 1.5rem;
      }
      .cat {
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        color: var(--text-muted);
      }
      .info h4 {
        font-size: 1.1rem;
        font-weight: 800;
        margin: 0.5rem 0 1rem;
        line-height: 1.3;
        min-height: 2.8rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .price {
        font-size: 1.25rem;
        font-weight: 950;
      }
      .add-btn {
        width: 32px;
        height: 32px;
        border-radius: 50% !important;
        background: var(--primary);
        color: white;
        border: none;
        font-size: 1.25rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        line-height: 1 !important;
        padding: 0 !important;
      }
      .add-btn:hover {
        background: #5a61e6;
        transform: scale(1.1);
      }

      .home-stepper {
        display: flex;
        align-items: center;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 2px;
      }
      .home-stepper button {
        width: 30px;
        height: 30px;
        border: none;
        background: var(--surface);
        color: var(--text);
        border-radius: 8px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s;
      }
      .home-stepper button:hover {
        background: var(--primary);
        color: white;
      }
      .home-stepper .val {
        font-size: 0.85rem;
        font-weight: 900;
        padding: 0 0.75rem;
        min-width: 32px;
        text-align: center;
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
      .btn-load-more:active {
        transform: translateY(0) scale(0.98);
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
    `,
  ],
})
export class StoreHomeComponent implements OnInit {
  inventory = inject(InventoryDataService);
  http = inject(HttpClient);
  cart = inject(CartService);
  wishlist = inject(WishlistService);
  activeOfferIndex = signal(0);
  visibleProductCount = signal(8);
  isLoadingMore = signal(false);
  isAddingProduct = signal<number | null>(null);
  isLoading = signal(true);
  private destroyRef = inject(DestroyRef);

  featuredCategories = computed(() => {
    const products = this.inventory.products();
    const cats = [...new Set(products.map((p) => p.category))].slice(0, 6);
    const icons: Record<string, string> = {
      Electronics: '💻',
      Office: '📁',
      Furniture: '🪑',
      Accessories: '⌚',
      Kitchen: '🍳',
      Sports: '⚽',
    };
    return cats.map((name) => ({ name, icon: icons[name] || '📦' }));
  });

  trendingProducts = computed(() => {
    return this.inventory.products().slice(0, this.visibleProductCount());
  });

  hasMoreProducts = computed(() => {
    return this.visibleProductCount() < this.inventory.products().length;
  });

  ngOnInit() {
    this.loadInitialData();
    const intervalId = setInterval(() => {
      if (this.inventory.offers().length > 0) {
        this.activeOfferIndex.update((i) => (i + 1) % this.inventory.offers().length);
      }
    }, 6000);
    this.destroyRef.onDestroy(() => clearInterval(intervalId));
  }

  loadInitialData() {
    this.isLoading.set(true);
    const sub = forkJoin([
      this.http.get<Product[]>(`${this.inventory.baseUrl}/products`),
      this.http.get<Offer[]>(`${this.inventory.baseUrl}/offers`),
    ]).subscribe({
      next: ([products, offers]) => {
        this.inventory.setProducts(products);
        this.inventory.setOffers(offers);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading store data:', err);
        this.isLoading.set(false);
      },
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  getItemInCart(productId: number) {
    return this.cart.itemsMap().get(productId);
  }

  updateQty(productId: number, qty: number) {
    this.cart.updateQuantity(productId, qty);
  }

  addToCart(product: Product) {
    this.isAddingProduct.set(product.id);
    setTimeout(() => {
      this.cart.addToCart(product);
      this.isAddingProduct.set(null);
    }, 600);
  }

  loadMore() {
    this.isLoadingMore.set(true);
    // Simulate loading for animation effect
    setTimeout(() => {
      this.visibleProductCount.update((n) => n + 8);
      this.isLoadingMore.set(false);
    }, 800);
  }
}
