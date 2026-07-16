import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, type ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import {
  AuthStateService,
  ChatWidgetComponent,
  DarkModeService,
  FaviconService,
  InventoryDataService,
  MobileBottomNavComponent,
  SearchService,
} from 'ui-shared';
import { CartService } from '../services/cart.service';
import { CartUiService } from '../services/cart-ui.service';
import { WishlistService } from '../services/wishlist.service';
import { CartDrawerComponent } from '../shared/components/cart-drawer/cart-drawer.component';

@Component({
  selector: 'app-store-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MobileBottomNavComponent,
    CartDrawerComponent,
    ChatWidgetComponent,
  ],
  template: `
    <div class="shopper-shell" [class.dark]="darkMode.isDarkMode()">
      <!-- Shopper Header (Compact) -->
      <header class="shopper-header" [class.scrolled]="isScrolled()">
        <div class="header-container">
          <!-- Logo -->
          <div class="shopper-logo" routerLink="/store">
            <span class="logo-text">SHOP<span>PER.</span></span>
          </div>

          <!-- Nav Links -->
          <nav class="shopper-nav">
            <a
              routerLink="/store"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              >Home</a
            >
            <a routerLink="/store/categories" routerLinkActive="active"
              >Categories</a
            >
            <a routerLink="/store/offers" routerLinkActive="active">Offers</a>
            <a routerLink="/store/orders" routerLinkActive="active">Orders</a>
          </nav>

          <!-- Utils -->
          <div class="shopper-utils">
            <button
              class="util-btn"
              (click)="$event.stopPropagation(); toggleSearch()"
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
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            <button class="util-btn" (click)="darkMode.toggle()">
              <!-- Sun Icon -->
              <svg
                *ngIf="darkMode.isDarkMode()"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="21.78" x2="5.64" y2="20.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              <!-- Moon Icon -->
              <svg
                *ngIf="!darkMode.isDarkMode()"
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
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                ></path>
              </svg>
            </button>

            <div class="util-wishlist" routerLink="/store/wishlist">
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
              <span class="badge" *ngIf="wishlist.items().length > 0">{{
                wishlist.items().length
              }}</span>
            </div>

            <div class="util-cart" (click)="cartUi.open()">
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
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path
                  d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
                ></path>
              </svg>
              <span class="badge" *ngIf="cart.totalItems() > 0">{{
                cart.totalItems()
              }}</span>
            </div>

            <div class="user-wrap" *ngIf="auth.isLoggedIn(); else loginBtn">
              <div
                class="user-trigger"
                (click)="$event.stopPropagation(); toggleDropdown()"
              >
                <img [src]="auth.avatarUrl()" alt="Avatar" />
              </div>
              <div
                class="user-menu animate-fade-in"
                *ngIf="isDropdownOpen()"
                (click)="$event.stopPropagation()"
              >
                <div class="menu-info">
                  <p class="name">{{ auth.user()?.name }}</p>
                  <p class="email">{{ auth.user()?.email }}</p>
                </div>
                <div class="divider"></div>
                <a routerLink="/store/settings" (click)="closeDropdowns()"
                  >Settings</a
                >
                <a routerLink="/store/wishlist" (click)="closeDropdowns()"
                  >My Wishlist</a
                >
                <a routerLink="/store/orders" (click)="closeDropdowns()"
                  >My Orders</a
                >
                <div class="divider"></div>
                <a routerLink="/inventory" (click)="closeDropdowns()"
                  >Inventory Hub</a
                >
                <div class="divider"></div>
                <button (click)="logout()" class="logout">Sign Out</button>
              </div>
            </div>

            <ng-template #loginBtn>
              <button class="util-btn" routerLink="/user/login">
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </button>
            </ng-template>
          </div>
        </div>

        <!-- Search Modal Popup -->
        <div
          class="search-overlay animate-fade-in"
          *ngIf="isSearchOpen()"
          (click)="isSearchOpen.set(false)"
        >
          <div class="search-modal" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                #searchInput
                type="text"
                placeholder="Search for products..."
                (input)="onSearch($event)"
                autofocus
              />
              <button class="close-btn" (click)="isSearchOpen.set(false)">
                ✕
              </button>
            </div>
            <div class="modal-tips">
              <span>Press <b>ESC</b> to close</span>
            </div>
          </div>
        </div>
      </header>

      <main class="shopper-main" (click)="closeDropdowns()">
        <router-outlet></router-outlet>
      </main>

      <footer class="shopper-footer">
        <div class="footer-container">
          <div class="f-brand">SHOP<span>PER.</span></div>
          <div class="f-links">
            <a routerLink="/store">Home</a>
            <a routerLink="/store/orders">Orders</a>
            <a href="#">Support</a>
          </div>
          <div class="f-copy">© 2026 Store v1.5</div>
        </div>
      </footer>

      <!-- Mobile Bottom Nav -->
      <ui-mobile-bottom-nav [navItems]="navItems()"></ui-mobile-bottom-nav>

      <!-- Cart Drawer -->
      <ui-cart-drawer></ui-cart-drawer>

      <!-- Support Chat (Customer Side) -->
      <ui-chat-widget currentRole="customer" userName="Customer" />
    </div>
  `,
  styles: [
    `
      .shopper-shell {
        --primary: #9333ea;
        --bg: #ffffff;
        --text: #111827;
        --text-muted: #6b7280;
        --border: #f3f4f6;
        --surface: #ffffff;
        --header-h: 60px;
        --header-bg: rgba(255, 255, 255, 0.8);

        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: var(--bg);
        color: var(--text);
        font-family: "Inter", system-ui, sans-serif;
        transition: all 0.2s ease;
      }

      .shopper-shell.dark {
        --bg: #0b0f1a;
        --text: #f9fafb;
        --text-muted: #9ca3af;
        --border: #1e293b;
        --surface: #1e293b;
        --header-bg: rgba(11, 15, 26, 0.8);
      }

      /* Header (Compact) */
      .shopper-header {
        position: sticky;
        top: 0;
        z-index: 1000;
        background: var(--header-bg);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border);
        height: var(--header-h);
        display: flex;
        align-items: center;
        transition: all 0.2s;
      }
      .shopper-header.scrolled {
        height: 52px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      }

      .header-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.5rem;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .shopper-logo {
        cursor: pointer;
      }
      .logo-text {
        font-size: 1.1rem;
        font-weight: 900;
        letter-spacing: -0.04em;
        color: var(--text);
      }
      .logo-text span {
        color: var(--primary);
      }

      .shopper-nav {
        display: flex;
        gap: 1.75rem;
      }
      .shopper-nav a {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--text);
        text-decoration: none;
        transition: color 0.2s;
      }
      .shopper-nav a:hover,
      .shopper-nav a.active {
        color: var(--primary);
      }

      .shopper-utils {
        display: flex;
        align-items: center;
        gap: 1.25rem;
      }
      .util-btn {
        background: none;
        border: none;
        padding: 0;
        color: var(--text);
        cursor: pointer;
        display: flex;
        align-items: center;
        transition: color 0.2s;
      }
      .util-btn:hover {
        color: var(--primary);
      }

      .util-cart,
      .util-wishlist {
        position: relative;
        cursor: pointer;
        color: var(--text);
        display: flex;
        align-items: center;
        transition: color 0.2s;
      }
      .util-cart:hover,
      .util-wishlist:hover {
        color: var(--primary);
      }
      .badge {
        position: absolute;
        top: -6px;
        right: -8px;
        background: var(--primary);
        color: white;
        font-size: 0.6rem;
        font-weight: 900;
        min-width: 15px;
        height: 15px;
        border-radius: 99px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--bg);
      }

      .user-wrap {
        position: relative;
      }
      .user-trigger {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        overflow: hidden;
        cursor: pointer;
        border: 1.5px solid var(--border);
      }
      .user-trigger img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .user-menu {
        position: absolute;
        top: calc(100% + 0.75rem);
        right: 0;
        width: 200px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }
      .menu-info {
        padding: 0.5rem 0.75rem;
      }
      .menu-info .name {
        font-weight: 800;
        font-size: 0.8rem;
        margin: 0;
      }
      .menu-info .email {
        font-size: 0.7rem;
        color: var(--text-muted);
        margin: 0;
      }
      .divider {
        height: 1px;
        background: var(--border);
        margin: 0.4rem 0;
      }
      .user-menu a,
      .logout {
        display: block;
        width: 100%;
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--text);
        text-decoration: none;
        border-radius: 6px;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
      }
      .user-menu a:hover {
        background: var(--bg);
        color: var(--primary);
      }
      .logout {
        color: #ef4444;
      }

      /* Search Modal */
      .search-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        z-index: 2000;
        display: flex;
        justify-content: center;
        padding-top: 10vh;
      }
      .search-modal {
        width: 100%;
        max-width: 600px;
        background: var(--surface);
        border-radius: 16px;
        height: fit-content;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid var(--border);
        overflow: hidden;
      }
      .modal-head {
        display: flex;
        align-items: center;
        padding: 1rem 1.5rem;
        gap: 1rem;
        border-bottom: 1px solid var(--border);
      }
      .modal-head input {
        flex: 1;
        border: none;
        background: none;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text);
        outline: none;
      }
      .modal-head svg {
        color: var(--text-muted);
      }
      .close-btn {
        background: var(--bg);
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 800;
        color: var(--text-muted);
        cursor: pointer;
      }
      .modal-tips {
        padding: 0.75rem 1.5rem;
        font-size: 0.7rem;
        color: var(--text-muted);
        font-weight: 600;
        background: var(--bg);
      }
      .modal-tips b {
        color: var(--text);
        padding: 0.1rem 0.3rem;
        background: var(--border);
        border-radius: 4px;
      }

      .shopper-main {
        flex: 1;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        padding: 2rem 4rem 2rem 1.5rem;
      }

      /* Thin Minimal Footer */
      .shopper-footer {
        padding: 1.25rem 1.5rem;
        border-top: 1px solid var(--border);
        background: var(--bg);
      }
      .footer-container {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .f-brand {
        font-size: 0.8rem;
        font-weight: 900;
        letter-spacing: -0.03em;
      }
      .f-brand span {
        color: var(--primary);
      }
      .f-links {
        display: flex;
        gap: 1.5rem;
      }
      .f-links a {
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--text-muted);
        text-decoration: none;
        transition: color 0.1s;
      }
      .f-links a:hover {
        color: var(--primary);
      }
      .f-copy {
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--text-muted);
      }

      @media (max-width: 768px) {
        .shopper-nav,
        .f-links {
          display: none;
        }
        .shopper-main {
          padding-bottom: 80px;
        }
      }
    `,
  ],
})
export class StoreLayoutComponent {
  auth = inject(AuthStateService);
  cart = inject(CartService);
  darkMode = inject(DarkModeService);
  wishlist = inject(WishlistService);
  cartUi = inject(CartUiService);
  private searchService = inject(SearchService);
  private http = inject(HttpClient);
  private inventoryService = inject(InventoryDataService);
  private router = inject(Router);
  private faviconService = inject(FaviconService);

  constructor() {
    this.faviconService.setFavicon('store-favicon.png');

    // Close search and dropdowns on any navigation except the search page itself
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: any) => {
      if (!event.urlAfterRedirects.includes('/store/search')) {
        this.isSearchOpen.set(false);
      }
      this.isDropdownOpen.set(false);
    });

    // Register storefront catalog search provider
    this.searchService.registerProvider({
      id: 'store-products',
      name: 'Storefront',
      search: (q: string) => {
        return this.http.get<any[]>(`${this.inventoryService.baseUrl}/products`).pipe(
          map((products) =>
            products
              .filter(
                (p) =>
                  p.name.toLowerCase().includes(q.toLowerCase()) ||
                  p.description.toLowerCase().includes(q.toLowerCase()),
              )
              .map((p) => ({
                id: p.id.toString(),
                title: p.name,
                path: `/store/product/${p.id}`,
                category: 'Products',
                keywords: [p.category],
                product: p,
              })),
          ),
        );
      },
    });
  }

  navItems = computed(() => [
    {
      label: 'Home',
      link: '/store',
      exact: true,
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>`,
    },
    {
      label: 'Shop',
      link: '/store/categories',
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>`,
    },
    {
      label: 'Cart',
      link: '/store/cart',
      badge: this.cart.totalItems(),
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>`,
    },
    {
      label: 'Profile',
      link: '/user/settings',
      icon: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`,
    },
  ]);

  isDropdownOpen = signal(false);
  isSearchOpen = signal(false);
  isScrolled = signal(false);

  @ViewChild('searchInput') searchInput!: ElementRef;

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled.set(window.scrollY > 15);
  }

  @HostListener('window:keydown.esc')
  onEsc() {
    this.isSearchOpen.set(false);
  }

  toggleDropdown() {
    this.isDropdownOpen.update((v) => !v);
  }

  toggleSearch() {
    this.isSearchOpen.update((v) => !v);
    if (this.isSearchOpen()) {
      setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
    }
  }

  closeDropdowns() {
    this.isDropdownOpen.set(false);
  }

  logout() {
    this.auth.logout();
    this.isDropdownOpen.set(false);
    this.router.navigate(['/store']);
  }

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.router.navigate(['/store/search'], { queryParams: { q: query } });
  }
}
