import { CommonModule } from '@angular/common';
import { Component, computed, OnDestroy, type OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-4 sm:p-8 min-h-screen animate-fade-in space-y-8">
      <!-- Welcome Glassmorphic Banner -->
      <div
        class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-[#111827] dark:via-[#1f2937] dark:to-[#111827] p-8 sm:p-10 shadow-2xl border border-slate-800 dark:border-white/5"
      >
        <!-- Background Decorative Blur Rings -->
        <div class="absolute -right-10 -top-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
        <div class="absolute -left-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-3">
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Supply Chain Active
            </span>
            <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
              Welcome back, <span class="text-primary">Administrator</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 font-medium max-w-xl">
              Control Center for industrial warehousing, client fulfillment, logistics optimization, and procurement.
            </p>
          </div>

          <!-- Real-time Clock Panel -->
          <div
            class="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[200px] flex flex-col items-center justify-center text-center animate-scale-in gap-1"
          >
            <span class="text-[9px] font-black uppercase tracking-widest text-slate-500">Local System Time</span>
            <span class="text-2xl font-black text-white font-mono tracking-wider leading-none py-1">{{ currentTime() }}</span>
            <span class="text-[10px] font-bold text-slate-400">{{ currentDate() }}</span>
            
            <button
              (click)="toggleTimeFormat()"
              class="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 active:scale-95 text-[9px] font-black uppercase tracking-widest text-white rounded-lg border border-white/10 transition-all cursor-pointer outline-none"
            >
              {{ toggleButtonText() }}
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Status Indicators (Zero Startup API calls) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card-premium p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Database Node</p>
              <h4 class="text-sm font-black text-slate-900 dark:text-white">Active & Connected</h4>
            </div>
          </div>
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
        </div>

        <div class="card-premium p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Load</p>
              <h4 class="text-sm font-black text-slate-900 dark:text-white">Optimal (0.04s latency)</h4>
            </div>
          </div>
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
        </div>

        <div class="card-premium p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.571V9a4 4 0 00-8 0v2.571c0 1.932-.418 3.765-1.176 5.419m11.764-1.205A13.915 13.915 0 0016 11.571V9a4 4 0 018 0v2.571c0 1.932.418 3.765 1.176 5.419M12 22V19.5" />
              </svg>
            </div>
            <div>
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Security Protocol</p>
              <h4 class="text-sm font-black text-slate-900 dark:text-white">SSL Encrypted</h4>
            </div>
          </div>
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
        </div>
      </div>

      <!-- Quick Operations Grid -->
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-1.5 h-5 bg-primary rounded-full"></div>
          <h2 class="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
            Quick Operations Grid
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Card 1: Create Order -->
          <div
            [routerLink]="['/inventory/orders/create']"
            class="card-premium p-6 group cursor-pointer hover:border-primary/50 transition-all flex flex-col h-full active:scale-95"
          >
            <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-115 transition-all">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 class="text-md font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">
              New Customer Order
            </h3>
            <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1 mb-4">
              Sales & Fulfillment
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">
              Instantly draft and create sales orders for corporate industrial clients.
            </p>
            <div class="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
              <span class="text-[9px] font-black uppercase tracking-widest text-primary">Open form</span>
              <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <!-- Card 2: Create Purchase Order -->
          <div
            [routerLink]="['/inventory/procurement/stock-order/create']"
            class="card-premium p-6 group cursor-pointer hover:border-amber-500/50 transition-all flex flex-col h-full active:scale-95"
          >
            <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 group-hover:scale-115 transition-all">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 class="text-md font-black text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
              New Stock PO
            </h3>
            <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1 mb-4">
              Procurement & Supply
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">
              Order raw materials and high-tech components from registered industrial suppliers.
            </p>
            <div class="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
              <span class="text-[9px] font-black uppercase tracking-widest text-amber-500">Order Stock</span>
              <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <!-- Card 3: Products Catalog -->
          <div
            [routerLink]="['/inventory/products']"
            class="card-premium p-6 group cursor-pointer hover:border-emerald-500/50 transition-all flex flex-col h-full active:scale-95"
          >
            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-115 transition-all">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 class="text-md font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
              Manage Catalog
            </h3>
            <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1 mb-4">
              Inventory & Items
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">
              Add new product lines, track item stock, manage discounts, categories and descriptions.
            </p>
            <div class="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
              <span class="text-[9px] font-black uppercase tracking-widest text-emerald-500">View Catalog</span>
              <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <!-- Card 4: System Overview -->
          <div
            [routerLink]="['/inventory/overview']"
            class="card-premium p-6 group cursor-pointer hover:border-purple-500/50 transition-all flex flex-col h-full active:scale-95 animate-pulse-slow"
          >
            <div class="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6 group-hover:scale-115 transition-all">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10a15.3 15.3 0 0 1-4 10a15.3 15.3 0 0 1-4-10a15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <h3 class="text-md font-black text-slate-900 dark:text-white group-hover:text-purple-500 transition-colors">
              System Overview
            </h3>
            <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1 mb-4">
              Real-time Analytics
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">
              Open the full analytical dashboard showing order charts, warehouse utilization stats, and regional performance.
            </p>
            <div class="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
              <span class="text-[9px] font-black uppercase tracking-widest text-purple-500">Open Dashboard</span>
              <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
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
export class DashboardComponent implements OnInit, OnDestroy {
  currentTime = signal<string>('');
  currentDate = signal<string>('');
  is12Hour = signal<boolean>(true); // 12-hour AM/PM format by default
  private timerId: any;

  toggleButtonText = computed(() => (this.is12Hour() ? 'Switch to 24-Hour' : 'Switch to 12-Hour'));

  ngOnInit() {
    this.updateClock();
    this.timerId = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  toggleTimeFormat() {
    this.is12Hour.update((v) => !v);
    this.updateClock();
  }

  private updateClock() {
    const now = new Date();

    // Time format HH:MM:SS with AM/PM support
    this.currentTime.set(
      now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: this.is12Hour(),
      }),
    );

    // Date format: Weekday, Month Day, Year
    this.currentDate.set(
      now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    );
  }
}
