import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, inject, type OnInit, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SafeHtmlPipe } from '../../utils/safe-html.pipe';

export interface SidebarNavItem {
  label: string;
  route?: string;
  exact?: boolean;
  icon?: string; // SVG string
  children?: SidebarNavItem[];
  isSeparator?: boolean;
  childIcon?: string; // Icon for children if needed
}

@Component({
  selector: 'ui-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, SafeHtmlPipe],
  template: `
    <!-- Overlay for mobile -->
    @if (mobileOpen()) {
      <div
        (click)="mobileOpen.set(false)"
        class="fixed inset-0 bg-black/50 z-30 lg:hidden"
      ></div>
    }

    <aside
      #sidebarRef
      [ngClass]="{
        'sidebar-expanded': !collapsed() || mobileOpen(),
        'sidebar-collapsed': collapsed() && !mobileOpen(),
        'sidebar-mobile-open': mobileOpen(),
        'sidebar-mobile-closed': !mobileOpen(),
      }"
      class="sidebar-aside fixed lg:static inset-y-0 left-0 bg-white dark:bg-dark-base flex flex-col z-40 lg:z-auto transition-colors duration-500 border-none"
    >
      <!-- Close button (mobile only) -->
      <button
        (click)="mobileOpen.set(false)"
        class="lg:hidden absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1 z-50"
        id="sidebar-close-btn"
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
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>

      <div
        class="h-12 flex items-center flex-shrink-0 bg-white dark:bg-dark-base z-10 transition-all duration-500"
        [class.px-4]="!collapsed() || mobileOpen()"
        [class.justify-center]="collapsed() && !mobileOpen()"
      >
        <a routerLink="/" class="flex items-center gap-2 overflow-hidden">
          <div
            class="w-8 h-8 bg-gradient-to-tr from-primary via-primary/80 to-blue-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20 hover:scale-110 transition-transform"
          >
            <span class="text-white font-black text-xs">{{
              branding.logoText || 'A'
            }}</span>
          </div>
          <span
            [class.sidebar-show]="!collapsed() || mobileOpen()"
            [class.sidebar-hide]="collapsed() && !mobileOpen()"
            class="sidebar-fade-text text-sm font-black tracking-tight text-slate-900 dark:text-white"
          >
            {{ branding.title
            }}<span class="text-primary">{{ branding.subtitle }}</span>
          </span>
        </a>
      </div>

      <!-- Scrollable content area -->
      <div
        class="sidebar-content flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar min-h-0 py-3"
        [class.px-3]="!collapsed() || mobileOpen()"
        [class.px-2]="collapsed() && !mobileOpen()"
      >
        <!-- Navigation -->
        <nav class="space-y-1">
          @for (item of navItems; track $index) {
            @if (item.isSeparator) {
              <!-- No line separator as requested -->
              <div class="my-1"></div>
            } @else {
              <div class="nav-item-group">
                <div
                  class="nav-item-wrapper relative"
                  (mouseenter)="onNavHover($event, $index)"
                  (mouseleave)="onNavHover($event, -1)"
                >
                  <a
                    [routerLink]="item.route ? item.route : null"
                    routerLinkActive="bg-primary/10 text-primary"
                    [routerLinkActiveOptions]="{ exact: item.exact || false }"
                    (click)="item.children ? toggleGroup($index) : null"
                    class="nav-link flex items-center gap-2.5 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-primary/10 dark:hover:bg-white/[0.04] rounded-lg transition-all text-xs font-bold group cursor-pointer"
                    [class.justify-center]="collapsed() && !mobileOpen()"
                    [class.bg-primary-light]="isParentActive(item)"
                    [class.text-primary]="isParentActive(item)"
                  >
                    <span
                      *ngIf="item.icon"
                      [innerHTML]="item.icon | safeHtml"
                      class="icon-container w-4 h-4 block group-hover:scale-110 transition-transform flex-shrink-0"
                    ></span>
                    
                    <span
                      [class.sidebar-show]="!collapsed() || mobileOpen()"
                      [class.sidebar-hide]="collapsed() && !mobileOpen()"
                      class="sidebar-fade-text flex-1"
                      >{{ item.label }}</span
                    >
                  </a>

                  <!-- Flyout for Collapsed Mode -->
                  @if (collapsed() && !mobileOpen() && item.children && activeFlyoutIndex() === $index) {
                    <div class="fixed z-[100] left-[52px] bg-white dark:bg-dark-elevated rounded-xl shadow-2xl py-2 w-44 animate-flyout-in"
                         [style.top.px]="navFlyoutTop">
                      <div class="px-4 pb-1.5 mb-1.5">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ item.label }}</span>
                      </div>
                      <div class="px-2 space-y-0.5">
                        @for (child of item.children; track child.route) {
                          <a [routerLink]="child.route" 
                             routerLinkActive="bg-primary/10 text-primary font-black"
                             (click)="activeFlyoutIndex.set(-1)"
                             class="flex items-center gap-2.5 p-2 text-[11px] font-bold text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                             <span *ngIf="child.icon" [innerHTML]="child.icon | safeHtml" class="w-3.5 h-3.5 opacity-70"></span>
                             <span>{{ child.label }}</span>
                          </a>
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- Children Items (Expanded Mode) -->
                <div class="grid transition-[grid-template-rows,margin-bottom] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                     [class.grid-rows-[1fr]]="item.children && openIndex() === $index && (!collapsed() || mobileOpen())"
                     [class.grid-rows-[0fr]]="!(item.children && openIndex() === $index && (!collapsed() || mobileOpen()))"
                     [class.mb-2]="item.children && openIndex() === $index && (!collapsed() || mobileOpen())">
                  <div class="overflow-hidden">
                    <div class="children-container mt-1 ml-6 space-y-1">
                      @for (child of item.children; track child.route) {
                        <a
                          [routerLink]="child.route"
                          routerLinkActive="text-primary font-black bg-primary/5"
                          [routerLinkActiveOptions]="{ exact: child.exact || false }"
                          class="flex items-center gap-2.5 p-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.02] rounded-lg transition-all group"
                        >
                          <span *ngIf="child.icon" [innerHTML]="child.icon | safeHtml" class="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity"></span>
                          <span>{{ child.label }}</span>
                        </a>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          }
        </nav>
      </div>

      <!-- Bottom Utilities -->
      <div
        class="flex-shrink-0"
      >
        <button
          (click)="collapsed.set(!collapsed())"
          (mouseenter)="
            onUtilityHover($event, collapsed() ? 'Expand' : 'Collapse')
          "
          (mouseleave)="onUtilityHover($event, null)"
          class="hidden lg:flex w-full items-center justify-center gap-3 py-4 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-all group/collapse"
        >
          <div
            class="transition-transform duration-500"
            [class.rotate-180]="collapsed()"
          >
            <svg
              class="w-5 h-5 flex-shrink-0 group-hover/collapse:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 19l-7-7 7-7"
              ></path>
            </svg>
          </div>
          <span
            [class.sidebar-show]="!collapsed() || mobileOpen()"
            [class.sidebar-hide]="collapsed() && !mobileOpen()"
            class="sidebar-fade-text text-[10px] font-bold uppercase tracking-widest"
            >Collapse Sidebar</span
          >
        </button>
      </div>
    </aside>

    <!-- Tooltip flyout -->
    @if (
      (navFlyoutIndex() >= 0 || utilityFlyoutLabel()) &&
      collapsed() &&
      !mobileOpen() &&
      activeFlyoutIndex() === -1
    ) {
      <div
        class="fixed z-[9999] animate-flyout"
        [style.left.px]="flyoutLeft"
        [style.top.px]="navFlyoutTop"
      >
        <div
          class="bg-white dark:bg-dark-elevated rounded-lg px-3 py-1.5 whitespace-nowrap shadow-md dark:shadow-xl dark:shadow-black/40"
        >
          <span class="text-xs font-medium text-slate-900 dark:text-white">
            {{
              navFlyoutIndex() >= 0
                ? navItems[navFlyoutIndex()]?.label
                : utilityFlyoutLabel()
            }}
          </span>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .sidebar-aside {
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: width;
        overflow: hidden;
      }
      .sidebar-expanded {
        width: 220px;
      }
      .sidebar-collapsed {
        width: 56px;
      }
      .sidebar-fade {
        transition:
          opacity 0.2s ease,
          max-height 0.3s ease,
          margin 0.3s ease,
          padding 0.3s ease;
        overflow: hidden;
      }
      .sidebar-fade.sidebar-show {
        opacity: 1;
        max-height: 500px;
        pointer-events: auto;
        overflow: visible;
      }
      .sidebar-fade.sidebar-hide {
        opacity: 0;
        max-height: 0;
        pointer-events: none;
        margin: 0;
        padding: 0;
      }
      .sidebar-fade-text {
        transition:
          opacity 0.2s ease,
          width 0.3s ease;
        overflow: hidden;
        white-space: nowrap;
      }
      .sidebar-fade-text.sidebar-show {
        opacity: 1;
        width: auto;
      }
      .sidebar-fade-text.sidebar-hide {
        opacity: 0;
        width: 0;
      }
      .icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
      }
      @keyframes flyout-in {
        from {
          opacity: 0;
          transform: translateX(-6px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .animate-flyout {
        animation: flyout-in 0.15s ease-out forwards;
      }
      .sidebar-mobile-closed {
        transform: translateX(-100%);
      }
      .sidebar-mobile-open {
        transform: translateX(0);
        width: 260px !important;
      }
      @media (min-width: 1024px) {
        .sidebar-mobile-closed,
        .sidebar-mobile-open {
          transform: none;
        }
        .sidebar-mobile-open {
          width: 220px !important;
        }
        .sidebar-aside {
          height: 100vh;
          min-height: 100vh;
        }
      }

      @keyframes roll-down {
        from { opacity: 0; transform: translateY(-5px); max-height: 0; }
        to { opacity: 1; transform: translateY(0); max-height: 800px; }
      }
      .animate-roll-down {
        animation: roll-down 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        overflow: hidden;
        border-radius: 1rem;
      }
      @keyframes flyout-fade {
        from { opacity: 0; transform: translateX(10px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .bg-primary-light {
        background-color: rgba(var(--primary-rgb, 59, 130, 246), 0.1);
      }
    `,
  ],
})
export class SidebarComponent implements OnInit {
  @Input() branding = { title: 'App', subtitle: '', logoText: 'A' };
  @Input() navItems: SidebarNavItem[] = [];

  private router = inject(Router);
  mobileOpen = signal(false);
  collapsed = signal(false);
  navFlyoutIndex = signal(-1);
  utilityFlyoutLabel = signal<string | null>(null);

  flyoutLeft = 64;
  navFlyoutTop = 0;
  private navFlyoutTimeout: any;

  sidebarRef = viewChild<ElementRef<HTMLElement>>('sidebarRef');

  activeFlyoutIndex = signal(-1);
  openIndex = signal<number | null>(null);

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const sidebarEl = this.sidebarRef()?.nativeElement;

    // Check if click is outside the sidebar area
    if (sidebarEl && !sidebarEl.contains(target)) {
      this.activeFlyoutIndex.set(-1);
      this.navFlyoutIndex.set(-1);
      this.utilityFlyoutLabel.set(null);
    }
  }

  ngOnInit(): void {
    // Listen for navigation to auto-expand parent groups
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.autoExpandActiveGroup();
    });

    // Initial check
    setTimeout(() => this.autoExpandActiveGroup(), 100);
  }

  private autoExpandActiveGroup(): void {
    const currentUrl = this.router.url;
    this.navItems.forEach((item, idx) => {
      if (item.children) {
        // Check if any child route is active
        const hasActiveChild = item.children.some((child) => {
          if (!child.route) return false;
          // Use exact match or startsWith for sub-pages
          return currentUrl === child.route || currentUrl.startsWith(`${child.route}/`);
        });

        if (hasActiveChild) {
          this.openIndex.set(idx);
        }
      }
    });
  }

  isParentActive(item: SidebarNavItem): boolean {
    if (!item.children) return false;
    const currentUrl = this.router.url;
    return item.children.some(
      (child) => child.route && (currentUrl === child.route || currentUrl.startsWith(`${child.route}/`)),
    );
  }

  toggleGroup(idx: number): void {
    if (this.collapsed() && !this.mobileOpen()) {
      this.activeFlyoutIndex.set(this.activeFlyoutIndex() === idx ? -1 : idx);
      return;
    }

    this.openIndex.update((current) => (current === idx ? null : idx));
  }

  onNavHover(event: MouseEvent, idx: number, isFlyout = false): void {
    if (!this.collapsed() || this.mobileOpen()) {
      this.navFlyoutIndex.set(-1);
      return;
    }

    if (idx >= 0) {
      clearTimeout(this.navFlyoutTimeout);
      if (!isFlyout) {
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        this.navFlyoutTop = rect.top; // Align top of flyout with parent
        this.flyoutLeft = this.getSidebarRight();
      }
      this.navFlyoutIndex.set(idx);
    } else {
      this.navFlyoutTimeout = setTimeout(() => {
        this.navFlyoutIndex.set(-1);
      }, 150);
    }
  }

  onUtilityHover(event: MouseEvent, label: string | null): void {
    if (!this.collapsed() || this.mobileOpen()) {
      this.utilityFlyoutLabel.set(null);
      return;
    }

    if (label) {
      clearTimeout(this.navFlyoutTimeout);
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      this.navFlyoutTop = rect.top + rect.height / 2 - 14;
      this.flyoutLeft = this.getSidebarRight();
      this.utilityFlyoutLabel.set(label);
    } else {
      this.navFlyoutTimeout = setTimeout(() => {
        this.utilityFlyoutLabel.set(null);
      }, 150);
    }
  }

  private getSidebarRight(): number {
    const sidebar = this.sidebarRef();
    if (sidebar) {
      return sidebar.nativeElement.getBoundingClientRect().right + 4;
    }
    return 76;
  }

  /** Called from topnav hamburger on mobile */
  toggle(): void {
    this.mobileOpen.set(!this.mobileOpen());
  }

  open(): void {
    this.mobileOpen.set(true);
  }

  close(): void {
    this.mobileOpen.set(false);
  }
}
