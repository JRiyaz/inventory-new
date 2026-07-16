import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoaderComponent } from 'ui-shared';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent],
  template: `
    <div class="shopper-cart-page animate-fade-in">
      <header class="cart-head">
        <h1>Your Cart</h1>
        <p *ngIf="cartService.items().length > 0">
          You have {{ cartService.items().length }} items in your basket.
        </p>
      </header>

      <div
        class="cart-grid"
        *ngIf="cartService.items().length > 0; else emptyCart"
      >
        <!-- List -->
        <div class="cart-list">
          <div class="cart-item" *ngFor="let item of cartService.items()">
            <div class="item-visual" [routerLink]="['/store/product', item.id]">
              <span>📦</span>
            </div>

            <div class="item-info">
              <span class="cat">{{ item.category }}</span>
              <h3 [routerLink]="['/store/product', item.id]">
                {{ item.name }}
              </h3>
              <button
                class="remove-btn"
                (click)="cartService.removeFromCart(item.id)"
              >
                <lib-loader [label]="'Remove'"></lib-loader>
              </button>
            </div>

            <div class="item-qty">
              <div class="mini-stepper">
                <button
                  (click)="
                    cartService.updateQuantity(item.id, item.quantity - 1)
                  "
                >
                  −
                </button>
                <span class="val">{{ item.quantity }}</span>
                <button
                  (click)="
                    cartService.updateQuantity(item.id, item.quantity + 1)
                  "
                >
                  +
                </button>
              </div>
            </div>

            <div class="item-price">
              <span class="total">{{
                item.price * item.quantity | currency
              }}</span>
              <span class="unit">{{ item.price | currency }} / ea</span>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="cart-sidebar">
          <div class="summary-box shopper-card">
            <h3>Order Summary</h3>
            <div class="summary-rows">
              <div class="s-row">
                <span>Subtotal</span
                ><span>{{ cartService.subtotal() | currency }}</span>
              </div>
              <div class="s-row">
                <span>Tax</span><span>{{ cartService.tax() | currency }}</span>
              </div>
              <div class="s-row">
                <span>Shipping</span><span class="free">FREE</span>
              </div>
              <div class="divider"></div>
              <div class="s-row total">
                <span>Total</span
                ><span class="v">{{ cartService.total() | currency }}</span>
              </div>
            </div>
            <button class="btn-checkout" routerLink="/store/checkout">
              <lib-loader [label]="'Proceed to Checkout'"></lib-loader>
            </button>
            <div class="summary-links">
              <a routerLink="/store">Continue Shopping</a>
            </div>
          </div>
        </aside>
      </div>

      <ng-template #emptyCart>
        <div class="cart-empty shopper-card">
          <div class="icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Ready to start shopping? Explore our latest arrivals.</p>
          <button class="btn-checkout !w-auto !px-10" routerLink="/store">
            <lib-loader [label]="'Browse Products'"></lib-loader>
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .shopper-cart-page {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        max-width: 1000px;
        margin: 0 auto;
      }

      .cart-head h1 {
        font-size: 1.75rem;
        font-weight: 800;
        margin: 0;
        color: var(--text);
        letter-spacing: -0.02em;
      }
      .cart-head p {
        font-size: 0.85rem;
        color: var(--text-muted);
        margin-top: 0.25rem;
      }

      .cart-grid {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 3rem;
        align-items: start;
      }

      .cart-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .cart-item {
        display: grid;
        grid-template-columns: 80px 1fr 140px 140px;
        gap: 1.5rem;
        padding: 1rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 1rem;
        align-items: center;
      }

      .item-visual {
        height: 80px;
        width: 80px;
        background: var(--bg);
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        cursor: pointer;
      }

      .item-info .cat {
        font-size: 0.7rem;
        font-weight: 800;
        color: var(--primary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .item-info h3 {
        font-size: 1rem;
        font-weight: 700;
        margin: 0.1rem 0;
        cursor: pointer;
        color: var(--text);
        transition: color 0.1s;
      }
      .item-info h3:hover {
        color: var(--primary);
      }
      .remove-btn {
        background: none;
        border: none;
        color: #ef4444;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        padding: 0.25rem 0 0;
        text-align: left;
      }

      .mini-stepper {
        display: flex;
        align-items: center;
        background: var(--bg);
        border: 1.5px solid var(--border);
        border-radius: 0.75rem;
        padding: 0.15rem;
      }
      .mini-stepper button {
        width: 30px;
        height: 30px;
        border: none;
        background: var(--surface);
        color: var(--text);
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 800;
        cursor: pointer;
      }
      .mini-stepper button:hover {
        background: var(--primary);
        color: white;
      }
      .mini-stepper .val {
        flex: 1;
        text-align: center;
        font-size: 0.9rem;
        font-weight: 800;
        min-width: 35px;
      }

      .item-price {
        text-align: right;
      }
      .item-price .unit {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-weight: 600;
        display: block;
      }
      .item-price .total {
        font-size: 1.15rem;
        font-weight: 900;
        color: var(--text);
      }

      .shopper-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 1.25rem;
        padding: 1.5rem;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
      }
      .cart-sidebar {
        position: sticky;
        top: 100px;
      }
      .summary-box h3 {
        font-size: 1rem;
        font-weight: 800;
        margin-bottom: 1.5rem;
        color: var(--text);
      }

      .summary-rows {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .s-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-muted);
      }
      .s-row .free {
        color: #10b981;
        font-weight: 800;
      }
      .divider {
        height: 1px;
        background: var(--border);
        margin: 0.25rem 0;
      }
      .s-row.total {
        color: var(--text);
      }
      .s-row.total .v {
        font-size: 1.75rem;
        font-weight: 900;
        color: var(--primary);
        letter-spacing: -0.02em;
      }

      .btn-checkout {
        width: 100%;
        background: var(--primary);
        color: white;
        border: none;
        padding: 0.85rem;
        border-radius: 10px;
        font-size: 0.95rem;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-checkout:hover {
        transform: translateY(-1px);
      }

      .summary-links {
        margin-top: 1rem;
        text-align: center;
      }
      .summary-links a {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--primary);
        text-decoration: none;
      }

      .cart-empty {
        padding: 5rem 2rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
      }
      .cart-empty .icon {
        font-size: 4rem;
        opacity: 0.15;
      }
      .cart-empty h2 {
        font-size: 1.5rem;
        font-weight: 800;
        margin: 0;
      }
      .cart-empty p {
        font-size: 0.9rem;
        color: var(--text-muted);
        margin: 0;
      }

      @media (max-width: 900px) {
        .cart-grid {
          grid-template-columns: 1fr;
        }
        .cart-sidebar {
          width: 100%;
        }
        .cart-item {
          grid-template-columns: 1fr 1fr;
        }
        .item-visual {
          display: none;
        }
      }
    `,
  ],
})
export class CartComponent {
  cartService = inject(CartService);
}
