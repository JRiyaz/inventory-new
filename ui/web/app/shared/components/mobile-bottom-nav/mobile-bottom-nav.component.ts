import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../utils/safe-html.pipe';

export interface MobileNavItem {
  label: string;
  link: string;
  icon: string; // SVG string
  badge?: number | null;
  exact?: boolean;
}

@Component({
  selector: 'ui-mobile-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, SafeHtmlPipe],
  template: `
    <nav class="mobile-bottom-nav">
      <a
        *ngFor="let item of navItems"
        [routerLink]="item.link"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: item.exact || false }"
        class="nav-item"
      >
        <div class="icon-wrap">
          <div
            [innerHTML]="item.icon | safeHtml"
            class="w-6 h-6 flex items-center justify-center"
          ></div>
          <span class="badge" *ngIf="item.badge && item.badge > 0">{{
            item.badge
          }}</span>
        </div>
        <span>{{ item.label }}</span>
      </a>
    </nav>
  `,
  styles: [
    `
      .mobile-bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 70px;
        background: var(--surface);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-top: 1px solid var(--border);
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 0 1rem;
        z-index: 1000;
        box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.05);
      }

      @media (min-width: 768px) {
        .mobile-bottom-nav {
          display: none;
        }
      }

      :host-context(.dark) .mobile-bottom-nav {
        background: rgba(15, 23, 42, 0.8);
        border-color: rgba(255, 255, 255, 0.05);
      }

      .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        text-decoration: none;
        color: #94a3b8;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        width: 64px;
      }

      .nav-item span {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .icon-wrap {
        position: relative;
        padding: 6px;
        border-radius: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .nav-item.active {
        color: var(--primary);
      }

      .nav-item.active .icon-wrap {
        background: var(--primary-light);
        color: var(--primary);
        transform: translateY(-4px);
      }

      .badge {
        position: absolute;
        top: 0;
        right: 0;
        background: #ef4444;
        color: white;
        font-size: 9px;
        font-weight: 950;
        min-width: 16px;
        height: 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        transform: translate(25%, -25%);
      }

      :host-context(.dark) .badge {
        border-color: #0f172a;
      }

      .nav-item:active .icon-wrap {
        transform: scale(0.9);
      }
    `,
  ],
})
export class MobileBottomNavComponent {
  @Input() navItems: MobileNavItem[] = [];
}
