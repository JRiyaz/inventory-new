import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { type Breadcrumb, DetailLayoutComponent, StatusBadgeComponent } from 'ui-shared';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DetailLayoutComponent, StatusBadgeComponent],
  template: `
    <lib-detail-layout
      [title]="customer()?.name || 'Loading...'"
      [subtitle]="customer()?.company || 'Organization Details'"
      [status]="customer()?.status || 'Unknown'"
      [breadcrumbs]="breadcrumbs()"
      backLink="/inventory/customers"
      backLabel="Customer Directory"
      actionLabel="Create Invoice"
      editLabel="Edit Profile"
      [tabs]="['Profile', 'Order History', 'Financials', 'Notes']"
      [loading]="service.isActionLoading()"
      (tabChanged)="activeTab.set($event)"
      (action)="handleAction()"
      (edit)="goToEdit()"
      loaderType="bloom"
    >
      <div header-icon>
        <div
          class="w-full h-full bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-2xl"
        >
          {{ customer()?.name?.[0] || "C" }}
        </div>
      </div>

      <div sidebar-info class="space-y-6">
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Client Since
          </p>
          <p class="text-lg font-black text-slate-900 dark:text-white">
            {{ customer()?.joinDate | date: "MMM yyyy" }}
          </p>
        </div>
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Total Orders
          </p>
          <p class="text-xl font-black text-primary">
            {{ relatedOrders().length }}
          </p>
        </div>
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Total Spend
          </p>
          <p class="text-xl font-black text-emerald-500">
            {{ lifetimeSpend() | currency }}
          </p>
        </div>
      </div>

      <div sidebar-extra>
        <h4
          class="text-white text-xs font-black uppercase tracking-widest mb-4"
        >
          Key Contacts
        </h4>
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold"
            >
              PM
            </div>
            <div>
              <p class="text-[10px] text-white font-bold">Primary Manager</p>
              <p class="text-[9px] text-white/60">m.wilson&#64;technexus.com</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold"
            >
              FA
            </div>
            <div>
              <p class="text-[10px] text-white font-bold">Financial Admin</p>
              <p class="text-[9px] text-white/60">accounts&#64;technexus.com</p>
            </div>
          </div>
        </div>
      </div>

      <div tab-content class="animate-fade-in">
        @if (activeTab() === 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="card-premium p-6">
              <h4
                class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6"
              >
                Contact Information
              </h4>
              <div class="space-y-6">
                <div
                  class="flex items-start gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5"
                >
                  <div class="text-primary mt-0.5">
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
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p
                      class="text-[9px] font-black uppercase text-slate-400 tracking-widest"
                    >
                      Email Address
                    </p>
                    <p class="text-sm font-bold text-slate-900 dark:text-white">
                      {{ customer()?.email }}
                    </p>
                  </div>
                </div>
                <div
                  class="flex items-start gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5"
                >
                  <div class="text-primary mt-0.5">
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p
                      class="text-[9px] font-black uppercase text-slate-400 tracking-widest"
                    >
                      Phone Number
                    </p>
                    <p class="text-sm font-bold text-slate-900 dark:text-white">
                      {{ customer()?.phone }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card-premium p-6">
              <h4
                class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6"
              >
                Business Profile
              </h4>
              <div class="space-y-4">
                <div>
                  <p
                    class="text-[9px] font-black uppercase text-slate-400 tracking-widest"
                  >
                    Industry Segment
                  </p>
                  <p
                    class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight"
                  >
                    Industrial Automation
                  </p>
                </div>
                <div class="h-px bg-slate-100 dark:bg-white/5"></div>
                <div>
                  <p
                    class="text-[9px] font-black uppercase text-slate-400 tracking-widest"
                  >
                    Credit Limit
                  </p>
                  <p class="text-sm font-bold text-slate-900 dark:text-white">
                    $250,000.00
                  </p>
                </div>
                <div class="h-px bg-slate-100 dark:bg-white/5"></div>
                <div>
                  <p
                    class="text-[9px] font-black uppercase text-slate-400 tracking-widest"
                  >
                    Account Rep
                  </p>
                  <p class="text-sm font-bold text-primary">Sarah Jenkins</p>
                </div>
              </div>
            </div>
          </div>
        } @else if (activeTab() === 1) {
          <div class="space-y-4">
            @for (order of relatedOrders(); track order.id) {
              <div
                [routerLink]="['/inventory/orders', order.id]"
                class="card-premium p-5 flex items-center justify-between group hover:border-primary transition-all cursor-pointer"
              >
                <div class="flex items-center gap-5">
                  <div
                    class="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-all"
                  >
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
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-3 mb-1">
                      <p
                        class="text-sm font-black text-slate-900 dark:text-white"
                      >
                        Order #{{ order.id }}
                      </p>
                      <lib-status-badge
                        [status]="order.status"
                        class="scale-75 origin-left"
                      ></lib-status-badge>
                    </div>
                    <p
                      class="text-[10px] text-slate-400 font-bold uppercase tracking-widest"
                    >
                      {{ order.date | date: "mediumDate" }} •
                      {{ order.items.length }} Items
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-lg font-black text-primary">
                    {{ order.amount | currency }}
                  </p>
                </div>
              </div>
            } @empty {
              <div
                class="text-center py-20 bg-white/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10"
              >
                <p class="text-slate-400 italic">
                  No order history found for this customer.
                </p>
              </div>
            }
          </div>
        } @else if (activeTab() === 2) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="card-premium p-6">
              <p
                class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2"
              >
                Account Balance
              </p>
              <p class="text-2xl font-black text-rose-500">$12,450.00</p>
              <p class="text-[9px] text-slate-400 font-bold mt-2">
                Past Due: $4,500.00
              </p>
            </div>
            <div class="card-premium p-6">
              <p
                class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2"
              >
                Payment Terms
              </p>
              <p class="text-2xl font-black text-slate-900 dark:text-white">
                NET 30
              </p>
              <p class="text-[9px] text-emerald-500 font-black mt-2 uppercase">
                Good Credit Standing
              </p>
            </div>
            <div class="card-premium p-6">
              <p
                class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2"
              >
                Total Paid (YTD)
              </p>
              <p class="text-2xl font-black text-emerald-500">
                {{ lifetimeSpend() * 0.8 | currency }}
              </p>
              <p class="text-[9px] text-slate-400 font-bold mt-2">
                12 Transactions
              </p>
            </div>
          </div>
        } @else if (activeTab() === 3) {
          <div class="card-premium p-8 max-w-2xl">
            <div class="flex items-start gap-4 mb-8">
              <div
                class="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-4">
                  <h4
                    class="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight"
                  >
                    Internal Memo
                  </h4>
                  <span
                    class="text-[9px] text-slate-400 font-bold uppercase tracking-widest"
                    >Modified 2 days ago</span
                  >
                </div>
                <p
                  class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium"
                >
                  Prefer high-density packaging. Always verify shipping address
                  for Bulk-2 warehouse deliveries. Currently negotiating a new
                  service level agreement for Q3.
                </p>
              </div>
            </div>
            <button
              class="w-full py-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary hover:border-primary/50 transition-all"
            >
              Add Internal Note
            </button>
          </div>
        }
      </div>
    </lib-detail-layout>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class CustomerDetailComponent implements OnInit {
  public service = inject(CustomersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  activeTab = signal(0);

  customerId = computed(() => this.route.snapshot.paramMap.get('id') || '');
  customer = computed(() => this.service.getCustomer(this.customerId()));

  breadcrumbs = computed<Breadcrumb[]>(() => [
    { label: 'Inventory', link: '/inventory' },
    { label: 'Customers', link: '/inventory/customers' },
    { label: this.customer()?.name || 'Detail' },
  ]);

  relatedOrders = computed(() => {
    const c = this.customer();
    return c ? this.service.getOrdersForCustomer(c.name) : [];
  });

  lifetimeSpend = computed(() => {
    return this.relatedOrders().reduce((acc: number, order: any) => acc + (order.amount || 0), 0);
  });

  ngOnInit(): void {
    this.service.isLoading.set(true);
    const sub = this.service.getCustomerData(this.customerId()).subscribe({
      next: (data) => {
        this.service.setCustomer(data);
        this.service.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading customer details:', err);
        this.service.isLoading.set(false);
      },
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  goToEdit() {
    const id = this.customerId();
    if (id) {
      this.router.navigate(['/inventory/customers', id, 'edit']);
    }
  }

  handleAction() {
    this.service.isActionLoading.set(true);
    setTimeout(() => {
      this.service.isActionLoading.set(false);
    }, 2000);
  }
}
