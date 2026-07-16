import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { CartUiService } from '../../../services/cart-ui.service';

@Component({
  selector: 'ui-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="cart-drawer-shell" [class.open]="ui.isOpen()">
      <div class="backdrop" (click)="ui.close()"></div>

      <div class="drawer-content animate-slide-left">
        <div class="drawer-header">
          <div class="h-left">
            <h2>Your Cart</h2>
            <span class="count">{{ cart.totalItems() }} items</span>
          </div>
          <button class="close-btn" (click)="ui.close()">✕</button>
        </div>

        <div class="drawer-body">
          <div
            class="cart-items"
            *ngIf="cart.items().length > 0; else emptyCart"
          >
            <div class="cart-item" *ngFor="let item of cart.items()">
              <div class="item-visual">📦</div>
              <div class="item-info">
                <div class="info-top">
                  <h4>{{ item.name }}</h4>
                  <span class="price">{{ item.price | currency }}</span>
                </div>
                <div class="info-bottom">
                  <div class="qty-stepper">
                    <button
                      (click)="cart.updateQuantity(item.id, item.quantity - 1)"
                    >
                      −
                    </button>
                    <span>{{ item.quantity }}</span>
                    <button
                      (click)="cart.updateQuantity(item.id, item.quantity + 1)"
                    >
                      +
                    </button>
                  </div>
                  <button
                    class="remove-btn"
                    (click)="cart.removeFromCart(item.id)"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          <ng-template #emptyCart>
            <div class="empty-state">
              <div class="icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Looks like you haven't added anything yet.</p>
              <button
                class="btn-shop"
                (click)="ui.close()"
                routerLink="/store/categories"
              >
                Start Shopping
              </button>
            </div>
          </ng-template>
        </div>

        <div class="drawer-footer" *ngIf="cart.items().length > 0">
          <div class="summary">
            <div class="row">
              <span>Subtotal</span>
              <span class="val">{{ cart.subtotal() | currency }}</span>
            </div>
            <div class="row total">
              <span>Total</span>
              <span class="val">{{ cart.total() | currency }}</span>
            </div>
          </div>
          <button
            class="btn-checkout"
            (click)="ui.close()"
            routerLink="/store/checkout"
          >
            Checkout Now
          </button>
          <button
            class="btn-view-cart"
            (click)="ui.close()"
            routerLink="/store/cart"
          >
            View Full Cart
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .cart-drawer-shell {
        position: fixed;
        inset: 0;
        z-index: 3000;
        visibility: hidden;
        pointer-events: none;
      }
      .cart-drawer-shell.open {
        visibility: visible;
        pointer-events: auto;
      }

      .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(8px);
        opacity: 0;
        transition: opacity 0.4s ease;
      }
      .cart-drawer-shell.open .backdrop {
        opacity: 1;
      }

      .drawer-content {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 420px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: -20px 0 50px rgba(0, 0, 0, 0.1);
      }
      :host-context(.dark) .drawer-content {
        background: #0f172a;
      }

      .cart-drawer-shell.open .drawer-content {
        transform: translateX(0);
      }

      .drawer-header {
        padding: 2rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      :host-context(.dark) .drawer-header {
        border-color: rgba(255, 255, 255, 0.05);
      }

      .h-left h2 {
        font-size: 1.5rem;
        font-weight: 900;
        margin: 0;
        letter-spacing: -0.03em;
      }
      .h-left .count {
        font-size: 0.75rem;
        font-weight: 800;
        color: var(--primary);
        text-transform: uppercase;
      }

      .close-btn {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: #f1f5f9;
        border: none;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      :host-context(.dark) .close-btn {
        background: rgba(255, 255, 255, 0.05);
        color: white;
      }
      .close-btn:hover {
        background: #ef4444;
        color: white;
        transform: rotate(90deg);
      }

      .drawer-body {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
      }

      .cart-items {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .cart-item {
        display: flex;
        gap: 1.25rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px dashed rgba(0, 0, 0, 0.05);
      }
      :host-context(.dark) .cart-item {
        border-color: rgba(255, 255, 255, 0.05);
      }

      .item-visual {
        width: 80px;
        height: 80px;
        background: #f8fafc;
        border-radius: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
      }
      :host-context(.dark) .item-visual {
        background: rgba(255, 255, 255, 0.03);
      }

      .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .info-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .info-top h4 {
        font-size: 0.95rem;
        font-weight: 800;
        margin: 0;
        max-width: 180px;
      }
      .info-top .price {
        font-weight: 900;
        color: var(--primary);
      }

      .info-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.5rem;
      }
      .qty-stepper {
        display: flex;
        align-items: center;
        background: #f1f5f9;
        border-radius: 10px;
        padding: 2px;
      }
      :host-context(.dark) .qty-stepper {
        background: rgba(255, 255, 255, 0.05);
      }
      .qty-stepper button {
        width: 28px;
        height: 28px;
        border: none;
        background: #ffffff;
        border-radius: 8px;
        font-weight: 800;
        cursor: pointer;
      }
      :host-context(.dark) .qty-stepper button {
        background: #1e293b;
        color: white;
      }
      .qty-stepper span {
        padding: 0 0.75rem;
        font-size: 0.85rem;
        font-weight: 800;
      }

      .remove-btn {
        background: none;
        border: none;
        color: #ef4444;
        font-size: 0.75rem;
        font-weight: 800;
        cursor: pointer;
      }

      .empty-state {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 1rem;
      }
      .empty-state .icon {
        font-size: 4rem;
        opacity: 0.1;
      }
      .empty-state p {
        font-size: 0.9rem;
        color: #64748b;
      }
      .btn-shop {
        background: var(--primary);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 15px;
        font-weight: 800;
        cursor: pointer;
      }

      .drawer-footer {
        padding: 2rem;
        background: #f8fafc;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      :host-context(.dark) .drawer-footer {
        background: rgba(255, 255, 255, 0.02);
        border-color: rgba(255, 255, 255, 0.05);
      }

      .summary {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .row {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
        font-weight: 600;
        color: #64748b;
      }
      .row.total {
        font-size: 1.25rem;
        font-weight: 950;
        color: var(--text);
        padding-top: 0.5rem;
        border-top: 1px dashed rgba(0, 0, 0, 0.1);
      }
      :host-context(.dark) .row.total {
        color: white;
        border-color: rgba(255, 255, 255, 0.1);
      }

      .btn-checkout {
        background: var(--primary);
        color: white;
        border: none;
        padding: 1.25rem;
        border-radius: 16px;
        font-weight: 800;
        font-size: 1rem;
        cursor: pointer;
        transition: transform 0.2s;
      }
      .btn-checkout:active {
        transform: scale(0.98);
      }
      .btn-view-cart {
        background: none;
        border: 1px solid rgba(0, 0, 0, 0.1);
        padding: 1rem;
        border-radius: 16px;
        font-weight: 800;
        font-size: 0.9rem;
        cursor: pointer;
      }
      :host-context(.dark) .btn-view-cart {
        border-color: rgba(255, 255, 255, 0.1);
        color: white;
      }
    `,
  ],
})
export class CartDrawerComponent {
  cart = inject(CartService);
  ui = inject(CartUiService);
}
