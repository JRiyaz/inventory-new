import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SearchService } from 'ui-shared';
import { CartService } from './services/cart.service';
import { WishlistService } from './services/wishlist.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="search-results-page animate-fade-in">
      <header class="search-head">
        <div class="h-left">
          <h1>Search Results</h1>
          <p *ngIf="query()">
            Showing results for "<span class="query-text">{{ query() }}</span
            >"
          </p>
        </div>
        <div class="results-count">
          {{ filteredProducts().length }} items found
        </div>
      </header>

      <div
        class="results-grid"
        *ngIf="filteredProducts().length > 0; else noResults"
      >
        <div
          *ngFor="let product of filteredProducts()"
          class="result-card shopper-card"
        >
          <div class="visual" [routerLink]="['/store/product', product.id]">
            <span>📦</span>
            <button
              class="wish-btn"
              (click)="
                $event.stopPropagation(); wishlist.toggleWishlist(product)
              "
              [class.active]="wishlist.isInWishlist(product.id)"
            >
              <svg
                width="18"
                height="18"
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
            <h3 [routerLink]="['/store/product', product.id]">
              {{ product.name }}
            </h3>
            <p class="desc">{{ product.description }}</p>
            <div class="bottom">
              <span class="price">{{ product.price | currency }}</span>
              <button class="btn-add" (click)="cart.addToCart(product)">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      <ng-template #noResults>
        <div class="no-results shopper-card">
          <div class="icon">🔍</div>
          <h2>No results found</h2>
          <p>
            We couldn't find anything matching your search. Try different
            keywords or browse our categories.
          </p>
          <button class="btn-browse" routerLink="/store/categories">
            Browse Catalog
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .search-results-page {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
      .search-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        border-bottom: 1px solid var(--border);
        padding-bottom: 1.5rem;
      }
      .search-head h1 {
        font-size: 2rem;
        font-weight: 900;
        margin: 0;
        letter-spacing: -0.04em;
      }
      .search-head p {
        font-size: 1rem;
        color: var(--text-muted);
        margin-top: 0.5rem;
      }
      .query-text {
        color: var(--primary);
        font-weight: 800;
      }
      .results-count {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
      }

      .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }
      .shopper-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 1.5rem;
        overflow: hidden;
      }

      .result-card {
        display: flex;
        flex-direction: column;
        transition: all 0.3s;
      }
      .result-card:hover {
        transform: translateY(-5px);
        border-color: var(--primary);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      }

      .visual {
        height: 200px;
        background: var(--bg);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        cursor: pointer;
      }
      .wish-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 36px;
        height: 36px;
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
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .cat {
        font-size: 0.7rem;
        font-weight: 800;
        color: var(--primary);
        text-transform: uppercase;
      }
      .info h3 {
        font-size: 1.2rem;
        font-weight: 800;
        margin: 0.5rem 0;
        cursor: pointer;
      }
      .desc {
        font-size: 0.85rem;
        color: var(--text-muted);
        line-height: 1.5;
        margin-bottom: 1.5rem;
        flex: 1;
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
      .btn-add {
        background: var(--primary);
        color: white;
        border: none;
        padding: 0.75rem 1.25rem;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
      }

      .no-results {
        padding: 5rem 2rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
      }
      .no-results .icon {
        font-size: 4rem;
        opacity: 0.1;
      }
      .btn-browse {
        background: var(--primary);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 15px;
        font-weight: 800;
        cursor: pointer;
      }
    `,
  ],
})
export class SearchResultsComponent {
  private route = inject(ActivatedRoute);
  private searchService = inject(SearchService);
  cart = inject(CartService);
  wishlist = inject(WishlistService);

  query = signal('');
  isLoading = signal(false);
  searchResults = signal<any[]>([]);

  filteredProducts = computed(() => {
    return this.searchResults()
      .map((item) => item.product)
      .filter((p) => !!p);
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    let searchSub: any = null;

    const routeSub = this.route.queryParams.subscribe((params) => {
      const q = params['q'] || '';
      this.query.set(q);

      if (searchSub) {
        searchSub.unsubscribe();
      }

      if (!q.trim()) {
        this.searchResults.set([]);
        return;
      }

      this.isLoading.set(true);
      searchSub = this.searchService.search(q).subscribe({
        next: (results) => {
          this.searchResults.set(results);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('[SearchResults] Search failed:', err);
          this.searchResults.set([]);
          this.isLoading.set(false);
        },
      });
    });

    destroyRef.onDestroy(() => {
      routeSub.unsubscribe();
      if (searchSub) {
        searchSub.unsubscribe();
      }
    });
  }
}
