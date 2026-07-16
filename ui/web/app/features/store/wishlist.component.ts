import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from './services/cart.service';
import { WishlistService } from './services/wishlist.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="shopper-wishlist animate-fade-in">
      <header class="wish-head">
        <h1>Your Favorites</h1>
        <p>{{ wishlist.items().length }} items saved to your list.</p>
      </header>

      <div
        class="wish-grid"
        *ngIf="wishlist.items().length > 0; else emptyWish"
      >
        <div
          class="wish-card shopper-card"
          *ngFor="let product of wishlist.items()"
        >
          <div
            class="wish-visual"
            [routerLink]="['/store/product', product.id]"
          >
            <span>📦</span>
            <button
              class="remove-wish"
              (click)="
                $event.stopPropagation(); wishlist.toggleWishlist(product)
              "
            >
              ✕
            </button>
          </div>

          <div class="wish-info">
            <span class="cat">{{ product.category }}</span>
            <h3 [routerLink]="['/store/product', product.id]">
              {{ product.name }}
            </h3>
            <div class="wish-bottom">
              <span class="price">{{ product.price | currency }}</span>
              <button class="btn-add-cart" (click)="cart.addToCart(product)">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      <ng-template #emptyWish>
        <div class="empty-state shopper-card">
          <div class="icon">♡</div>
          <h2>Your wishlist is empty</h2>
          <p>Start adding items you love to your favorites!</p>
          <button class="btn-primary !w-auto !px-10" routerLink="/store">
            Explore Products
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .shopper-wishlist {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        max-width: 1000px;
        margin: 0 auto;
      }

      .wish-head h1 {
        font-size: 1.75rem;
        font-weight: 800;
        margin: 0;
        color: var(--text);
        letter-spacing: -0.02em;
      }
      .wish-head p {
        font-size: 0.85rem;
        color: var(--text-muted);
        margin-top: 0.25rem;
      }

      .wish-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1.5rem;
      }
      .shopper-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 1.25rem;
        padding: 1rem;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
      }

      .wish-visual {
        position: relative;
        aspect-ratio: 1.2;
        background: var(--bg);
        border-radius: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        cursor: pointer;
        margin-bottom: 1rem;
        overflow: hidden;
      }
      .remove-wish {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 30px;
        height: 30px;
        background: rgba(0, 0, 0, 0.05);
        border: none;
        border-radius: 50%;
        font-size: 0.75rem;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .remove-wish:hover {
        background: #ef4444;
        color: white;
      }

      .wish-info .cat {
        font-size: 0.7rem;
        font-weight: 800;
        color: var(--primary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .wish-info h3 {
        font-size: 1rem;
        font-weight: 700;
        margin: 0.1rem 0 0.75rem;
        cursor: pointer;
      }

      .wish-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .price {
        font-size: 1.1rem;
        font-weight: 900;
        color: var(--text);
      }
      .btn-add-cart {
        background: var(--primary);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 800;
        cursor: pointer;
      }

      .empty-state {
        padding: 5rem 2rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
      }
      .empty-state .icon {
        font-size: 4rem;
        opacity: 0.1;
      }
      .btn-primary {
        background: var(--primary);
        color: white;
        border: none;
        padding: 0.85rem 1.5rem;
        border-radius: 10px;
        font-weight: 800;
        cursor: pointer;
      }
    `,
  ],
})
export class WishlistComponent {
  wishlist = inject(WishlistService);
  cart = inject(CartService);
}
