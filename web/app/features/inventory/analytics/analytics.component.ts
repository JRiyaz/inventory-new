import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  type OnInit,
  Renderer2,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CustomDatePickerComponent, PageHeaderComponent, SkeletonComponent } from 'ui-shared';
import { AnalyticsService } from './analytics.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, SkeletonComponent, CustomDatePickerComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="p-3 sm:p-6  min-h-screen animate-fade-in pb-20">
      <lib-page-header
        [title]="headerInfo().title"
        [subtitle]="headerInfo().subtitle"
        [stats]="service.summaryStats()"
        [breadcrumbs]="breadcrumbs()"
        [loading]="service.isLoading()"
        actionLabel="Export Report"
        backLink="/inventory"
      ></lib-page-header>

      @if (service.isLoading()) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div class="lg:col-span-2 card-premium p-6 h-[400px]">
            <lib-skeleton width="100%" height="100%"></lib-skeleton>
          </div>
          <div class="card-premium p-6 h-[400px]">
            <lib-skeleton width="100%" height="100%"></lib-skeleton>
          </div>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <!-- Main Trend Chart -->
          <div
            class="lg:col-span-2 card-premium p-6 flex flex-col relative overflow-hidden group"
          >
            <div
              class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400"
            ></div>

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
            >
              <div>
                <h3
                  class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter"
                >
                  {{ headerInfo().chartTitle }}
                </h3>
                <p
                  class="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest"
                >
                  {{ service.activeDuration() }} Performance Overview
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <!-- Duration Switcher -->
                <div
                  class="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5"
                >
                  @for (d of durations; track d) {
                    <button
                      (click)="service.activeDuration.set(d)"
                      [class]="
                        service.activeDuration() === d
                          ? 'bg-white dark:bg-primary shadow-sm text-primary dark:text-white'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      "
                      class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                    >
                      {{ d }}
                    </button>
                  }
                </div>

                <!-- Chart Type Switcher -->
                <div
                  class="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5"
                >
                  <button
                    (click)="service.activeGraphType.set('line')"
                    [class]="
                      service.activeGraphType() === 'line'
                        ? 'bg-white dark:bg-primary shadow-sm text-primary dark:text-white'
                        : 'text-slate-500'
                    "
                    class="p-1.5 rounded-lg transition-all"
                    title="Line Chart"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    (click)="service.activeGraphType.set('bar')"
                    [class]="
                      service.activeGraphType() === 'bar'
                        ? 'bg-white dark:bg-primary shadow-sm text-primary dark:text-white'
                        : 'text-slate-500'
                    "
                    class="p-1.5 rounded-lg transition-all"
                    title="Bar Chart"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      ></path>
                    </svg>
                  </button>
                </div>

                <!-- Modernized Date Picker -->
                <div class="relative min-w-[140px]">
                  <lib-custom-datepicker
                    [value]="service.selectedDate()"
                    (dateChange)="service.selectedDate.set($event)"
                    placeholder="Filter Date"
                  ></lib-custom-datepicker>
                </div>
              </div>
            </div>

            <div class="flex-1 relative min-h-[300px]">
              <!-- SVG Chart -->
              <svg
                class="w-full h-full overflow-visible"
                viewBox="0 0 1000 300"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="chartGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stop-color="var(--primary-color, #3b82f6)"
                      stop-opacity="0.3"
                    />
                    <stop
                      offset="100%"
                      stop-color="var(--primary-color, #3b82f6)"
                      stop-opacity="0"
                    />
                  </linearGradient>
                </defs>

                <!-- Grid Lines -->
                @for (i of [0, 1, 2, 3]; track i) {
                  <line
                    x1="0"
                    [attr.y1]="i * 100"
                    x2="1000"
                    [attr.y2]="i * 100"
                    stroke="currentColor"
                    stroke-opacity="0.05"
                  />
                }

                @if (service.activeGraphType() === "line") {
                  <!-- Area -->
                  <path
                    [attr.d]="service.lineChartPath() + ' L 1000 300 L 0 300 Z'"
                    fill="url(#chartGradient)"
                    class="animate-chart-fill"
                  />

                  <!-- Line -->
                  <path
                    [attr.d]="service.lineChartPath()"
                    fill="none"
                    stroke="var(--primary-color, #3b82f6)"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="animate-draw-line"
                  />

                  <!-- Data Points -->
                  @for (point of service.lineChartPoints(); track $index) {
                    <circle
                      [attr.cx]="point.x"
                      [attr.cy]="point.y"
                      r="6"
                      fill="white"
                      stroke="var(--primary-color, #3b82f6)"
                      stroke-width="3"
                      class="hover:scale-150 transition-transform cursor-pointer"
                    />
                  }
                } @else {
                  <!-- Bar Chart -->
                  @for (point of service.lineChartPoints(); track $index) {
                    <rect
                      [attr.x]="point.x - 15"
                      [attr.y]="point.y"
                      width="30"
                      [attr.height]="300 - point.y"
                      fill="var(--primary-color, #3b82f6)"
                      fill-opacity="0.8"
                      rx="4"
                      class="hover:fill-opacity-100 transition-all cursor-pointer animate-grow-height"
                    />
                  }
                }
              </svg>
            </div>

            <div
              class="flex justify-between mt-6 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"
            >
              @if (service.activeDuration() === "Week") {
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span
                ><span>Fri</span><span>Sat</span><span>Sun</span>
              } @else if (service.activeDuration() === "Month") {
                <span>Week 1</span><span>Week 2</span><span>Week 3</span
                ><span>Week 4</span>
              } @else {
                <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
              }
            </div>
          </div>

          <!-- Distribution Card -->
          <div class="card-premium p-6 flex flex-col group">
            <h3
              class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1"
            >
              Inventory Mix
            </h3>
            <p
              class="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-8"
            >
              Stock Value by Category
            </p>

            <div
              class="flex-1 flex flex-col items-center justify-center relative"
            >
              <svg class="w-48 h-48 rotate-[-90deg]">
                @for (segment of service.donutSegments(); track segment.label) {
                  <circle
                    cx="96"
                    cy="96"
                    r="70"
                    fill="none"
                    [attr.stroke]="segment.color"
                    stroke-width="24"
                    [attr.stroke-dasharray]="segment.dashArray"
                    [attr.stroke-dashoffset]="segment.dashOffset"
                    class="transition-all duration-1000 hover:stroke-[30px] cursor-pointer"
                  />
                }
              </svg>
              <div
                class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              >
                <span
                  class="text-2xl font-black text-slate-900 dark:text-white leading-none"
                  >{{
                    service.totalValue() | currency: "USD" : "symbol" : "1.0-0"
                  }}</span
                >
                <span
                  class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1"
                  >Total Value</span
                >
              </div>
            </div>

            <div class="mt-8 space-y-2">
              @for (segment of service.donutSegments(); track segment.label) {
                <div
                  class="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  (click)="activeSection.set(segment.label)"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-2 h-2 rounded-full"
                      [style.background-color]="segment.color"
                    ></div>
                    <span
                      class="text-xs font-bold text-slate-700 dark:text-slate-300"
                      >{{ segment.label }}</span
                    >
                  </div>
                  <span
                    class="text-xs font-black text-slate-900 dark:text-white"
                    >{{ segment.percentage }}%</span
                  >
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Section Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          @for (section of service.sections(); track section.id) {
            <div
              class="card-premium p-6 group cursor-pointer hover:border-primary/50 transition-all flex flex-col h-[200px]"
              [class.border-primary]="activeSection() === section.title"
              (click)="activeSection.set(section.title)"
            >
              <div class="flex justify-between items-start mb-4">
                <div
                  class="p-2 rounded-xl"
                  [style.background-color]="section.color + '20'"
                  [style.color]="section.color"
                >
                  <div
                    class="w-5 h-5"
                    [innerHTML]="sanitize(section.icon)"
                  ></div>
                </div>
                <div class="flex flex-col items-end">
                  <span
                    class="text-sm font-black text-slate-900 dark:text-white"
                    >{{ section.value }}</span
                  >
                  <span
                    class="text-[8px] font-black text-emerald-500 uppercase tracking-widest"
                    >{{ section.change }} ↑</span
                  >
                </div>
              </div>
              <h4
                class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1"
              >
                {{ section.title }}
              </h4>
              <p
                class="text-[9px] text-slate-500 dark:text-slate-400 font-medium mb-4 line-clamp-2"
              >
                {{ section.description }}
              </p>

              <div class="mt-auto flex items-center gap-1">
                @for (bar of section.miniChart; track $index) {
                  <div
                    class="flex-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden h-1"
                  >
                    <div
                      class="h-full animate-grow-height"
                      [style.width.%]="bar"
                      [style.background-color]="section.color"
                    ></div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Detailed Section View (Animated Slide Over) -->
    @if (activeSection()) {
      <div
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden"
      >
        <!-- Overlay -->
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in cursor-pointer"
          (click)="activeSection.set(null)"
        ></div>

        <!-- Modal Content -->
        <div
          class="relative bg-white dark:bg-dark-base w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-slide-up flex flex-col z-10"
        >
          <div
            class="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-dark-elevated"
          >
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-2xl bg-primary/10 text-primary">
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  ></path>
                </svg>
              </div>
              <div>
                <h2
                  class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter"
                >
                  {{ activeSection() }} Analysis
                </h2>
                <p
                  class="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest"
                >
                  Deep dive into {{ activeSection() }} performance metrics
                </p>
              </div>
            </div>
            <button
              (click)="activeSection.set(null)"
              class="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
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
          </div>

          <div
            class="flex-1 overflow-y-auto p-6 custom-scrollbar overscroll-contain"
          >
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              @for (stat of activeDetailStats(); track stat.label) {
                <div
                  class="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5"
                >
                  <span
                    class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1"
                    >{{ stat.label }}</span
                  >
                  <span
                    class="text-xl font-black text-slate-900 dark:text-white block"
                    >{{ stat.value }}</span
                  >
                  <span class="text-[9px] font-bold text-emerald-500 mt-1 block"
                    >{{ stat.change }} since last period</span
                  >
                </div>
              }
            </div>

            <div class="space-y-6">
              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center">
                  <h3
                    class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter"
                  >
                    Segment Performance
                  </h3>
                  <span class="text-[10px] font-black text-primary uppercase"
                    >Updated Live</span
                  >
                </div>
                <div class="space-y-4 mt-2">
                  @for (item of [1, 2, 3, 4]; track item) {
                    <div class="space-y-2">
                      <div class="flex justify-between text-[10px] font-bold">
                        <span
                          class="text-slate-600 dark:text-slate-400 uppercase"
                          >Sub-Segment {{ item }}</span
                        >
                        <span class="text-slate-900 dark:text-white"
                          >{{ 100 - item * 15 }}%</span
                        >
                      </div>
                      <div
                        class="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden"
                      >
                        <div
                          class="h-full bg-primary rounded-full transition-all duration-1000"
                          [style.width.%]="100 - item * 15"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      @reference "tailwindcss";
      @custom-variant dark (&:where(.dark, .dark *));
      @theme {
        --color-primary: var(--theme-primary);
        --color-dark-base: var(--theme-dark-base);
        --color-dark-surface: var(--theme-dark-surface);
        --color-dark-elevated: var(--theme-dark-elevated);
        --color-dark-card: var(--theme-dark-card);
      }
      .animate-chart-fill {
        animation: fillChart 2s ease-out forwards;
      }
      .animate-draw-line {
        stroke-dasharray: 2000;
        stroke-dashoffset: 2000;
        animation: drawLine 2s ease-out forwards;
      }
      .animate-grow-height {
        animation: growHeight 1.5s ease-out forwards;
      }
      @keyframes drawLine {
        to {
          stroke-dashoffset: 0;
        }
      }
      @keyframes fillChart {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes growHeight {
        from {
          width: 0;
        }
      }
      .card-premium {
        @apply bg-white dark:bg-dark-surface border border-slate-200 dark:border-white/10 transition-all duration-300;
        backdrop-filter: blur(20px);
        border-radius: 2rem;
      }
      :root[data-theme="glass"] .card-premium {
        @apply border-none shadow-none;
        background: var(--glass-bg-light) !important;
      }
      :root[data-theme="glass"].dark .card-premium {
        background: var(--glass-bg-dark) !important;
      }
      .animate-slide-up {
        animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      @keyframes slideUp {
        from {
          transform: translateY(40px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      /* Ensure the modal stays fixed regardless of parent transforms */
      app-analytics {
        display: block;
        isolation: isolate;
        transform: none !important;
      }

      /* Global scroll lock for the dashboard layout */
      .modal-open .overflow-y-auto.custom-scrollbar {
        overflow: hidden !important;
      }
    `,
  ],
})
export class AnalyticsComponent implements OnInit {
  public service = inject(AnalyticsService);
  private route = inject(ActivatedRoute);
  private renderer = inject(Renderer2);
  private sanitizer = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);

  sanitize(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  activeSection = signal<string | null>(null);
  readonly durations = ['Week', 'Month', 'Year'] as const;

  constructor() {
    effect(() => {
      const section = this.activeSection();
      if (section) {
        this.renderer.addClass(document.body, 'modal-open');
      } else {
        this.renderer.removeClass(document.body, 'modal-open');
      }
    });
  }

  headerInfo = computed(() => {
    const type = this.route.snapshot.data['type'] || 'global';
    switch (type) {
      case 'sales':
        return {
          title: 'Sales & CRM Analytics',
          subtitle: 'Detailed breakdown of customer orders, revenue, and promotional impact.',
          chartTitle: 'Sales Revenue Analysis',
        };
      case 'procurement':
        return {
          title: 'Supply Chain Analytics',
          subtitle: 'Monitoring stock orders, supplier performance, and warehouse efficiency.',
          chartTitle: 'Procurement Expenditure Analysis',
        };
      default:
        return {
          title: 'Global Ecosystem Analytics',
          subtitle: 'Consolidated performance metrics across both sales and procurement streams.',
          chartTitle: 'Consolidated Revenue Analysis',
        };
    }
  });

  breadcrumbs = computed(() => [{ label: 'Inventory', link: '/inventory' }, { label: this.headerInfo().title }]);

  activeDetailStats = computed(() => {
    const section = this.activeSection();
    if (!section) return [];

    return [
      { label: 'Volume', value: '1.2M', change: '+12%' },
      { label: 'Efficiency', value: '98.4%', change: '+2%' },
      { label: 'Stability', value: 'High', change: '0%' },
    ];
  });

  ngOnInit() {
    this.service.isLoading.set(true);
    const sub = this.service.getAnalyticsData().subscribe({
      next: ([products, orders, customers, suppliers]) => {
        this.service.setAnalyticsData(products, orders, customers, suppliers);
        this.service.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        this.service.isLoading.set(false);
      },
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }
}
