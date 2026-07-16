import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import type { Breadcrumb, StatItem } from '../../models';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'lib-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, LoaderComponent],
  template: `
    <div class="mb-6 animate-fade-in">
      <!-- Breadcrumbs -->
      @if (breadcrumbs().length > 0) {
        <nav class="flex items-center gap-2 mb-3 px-1">
          @for (item of breadcrumbs(); track item.label; let last = $last) {
            <div class="flex items-center gap-2">
              @if (item.link) {
                <a
                  [routerLink]="item.link"
                  class="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                  >{{ item.label }}</a
                >
              } @else {
                <span
                  class="text-[9px] font-black uppercase tracking-widest text-slate-500"
                  >{{ item.label }}</span
                >
              }
              @if (!last) {
                <svg
                  class="w-2.5 h-2.5 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="3"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              }
            </div>
          }
        </nav>
      }

      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6"
      >
        <div>
          <div class="flex items-center gap-3 mb-1">
            @if (backLink()) {
              <a
                [routerLink]="backLink()"
                class="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-primary group"
              >
                <svg
                  class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </a>
            }
            <h1
              class="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase"
            >
              {{ title() }}
            </h1>
          </div>
          <p
            class="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide max-w-2xl"
          >
            {{ subtitle() }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Total Count Display -->
          @if (count() !== null) {
            <div
              class="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg shadow-inner group transition-all hover:border-primary/30"
            >
              <span
                class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                >Total</span
              >
              <div class="min-w-[20px] flex justify-center">
                @if (loading()) {
                  <div class="dots-wave scale-75">
                    <span class="!bg-primary"></span>
                    <span class="!bg-primary"></span>
                    <span class="!bg-primary"></span>
                  </div>
                } @else {
                  <span
                    class="text-xs font-black text-slate-900 dark:text-white animate-scale-in"
                    >{{ count() }}</span
                  >
                }
              </div>
            </div>
          }

          @if (showAction()) {
            <button
              (click)="action.emit()"
              [disabled]="isActionLoading()"
              class="btn-primary-premium flex items-center justify-center min-w-[140px] group overflow-hidden"
            >
              <lib-loader
                [loading]="isActionLoading()"
                [label]="actionLabel()"
              ></lib-loader>
            </button>
          }
        </div>
      </div>

      <!-- Quick Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (stat of stats(); track stat.label) {
          <div
            class="card-premium p-4 flex items-center justify-between group hover:border-primary/30 transition-all duration-700 relative overflow-hidden border-l-4"
            [style.transition-delay]="loading() ? '0ms' : '300ms'"
            [ngClass]="{
              'border-l-transparent': loading(),
              'border-l-emerald-500': !loading() && stat.color === 'success',
              'border-l-rose-500': !loading() && stat.color === 'danger',
              'border-l-amber-500': !loading() && stat.color === 'warning',
              'border-l-sky-500': !loading() && stat.color === 'info',
              'border-l-primary':
                !loading() && (stat.color === 'primary' || !stat.color),
            }"
          >
            <div>
              <p
                class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5"
              >
                {{ stat.label }}
              </p>
              <div class="h-6 flex items-center">
                @if (loading()) {
                  <div class="dots-wave scale-75">
                    <span class="!bg-primary"></span>
                    <span class="!bg-primary"></span>
                    <span class="!bg-primary"></span>
                  </div>
                } @else {
                  <p
                    class="text-lg font-black text-slate-900 dark:text-white leading-none animate-scale-in"
                  >
                    {{ stat.value }}
                  </p>
                }
              </div>
            </div>
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-700"
              [style.transition-delay]="loading() ? '0ms' : '600ms'"
              [ngClass]="
                loading()
                  ? 'bg-slate-50 dark:bg-white/5 text-transparent'
                  : {
                      'bg-emerald-500/5 text-emerald-500':
                        stat.color === 'success',
                      'bg-rose-500/5 text-rose-500': stat.color === 'danger',
                      'bg-amber-500/5 text-amber-500': stat.color === 'warning',
                      'bg-sky-500/5 text-sky-500': stat.color === 'info',
                      'bg-primary/5 text-primary':
                        stat.color === 'primary' || !stat.color,
                    }
              "
            >
              @if (!loading()) {
                @if (stat.icon) {
                  <div
                    [innerHTML]="sanitize(stat.icon)"
                    class="w-5 h-5 animate-scale-in flex items-center justify-center"
                  ></div>
                } @else {
                  @if (stat.color === 'danger') {
                    <svg
                      class="w-5 h-5 animate-scale-in"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      />
                    </svg>
                  } @else {
                    <svg
                      class="w-5 h-5 animate-scale-in"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  }
                }
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>('');
  actionLabel = input<string>('New Item');
  backLink = input<string | null>(null);
  breadcrumbs = input<Breadcrumb[]>([]);
  count = input<number | string | null>(null);
  loading = input<boolean>(false);
  isActionLoading = input<boolean>(false);
  showAction = input<boolean>(true);
  stats = input<StatItem[]>([]);

  action = output<void>();

  private sanitizer = inject(DomSanitizer);

  sanitize(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
