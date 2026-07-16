import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { type Breadcrumb, DetailLayoutComponent, StatusBadgeComponent } from 'ui-shared';
import { PaymentsService } from '../payments.service';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DetailLayoutComponent, StatusBadgeComponent],
  template: `
    <lib-detail-layout
      [title]="payment()?.id || 'Loading...'"
      [subtitle]="'Transaction ID: ' + (payment()?.transactionId || 'N/A')"
      [status]="payment()?.status || 'Unknown'"
      [breadcrumbs]="breadcrumbs()"
      backLink="/inventory/payments"
      backLabel="Financial Ledger"
      actionLabel="Print Receipt"
      [tabs]="['Transaction Details', 'Related Order', 'Audit Log']"
      [loading]="service.isActionLoading()"
      (tabChanged)="activeTab.set($event)"
      (action)="handlePrint()"
    >
      <div header-icon>
        <div
          class="w-full h-full bg-primary/10 rounded-2xl flex items-center justify-center text-primary"
        >
          <svg
            class="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <div sidebar-info class="space-y-6">
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Amount
          </p>
          <p class="text-2xl font-black text-primary">
            {{ payment()?.amount | currency }}
          </p>
        </div>
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Gateway
          </p>
          <p
            class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight"
          >
            {{ payment()?.method }}
          </p>
        </div>
        <div class="space-y-1">
          <p
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
          >
            Date
          </p>
          <p class="text-sm font-bold text-slate-900 dark:text-white">
            {{ payment()?.date | date: "longDate" }}
          </p>
        </div>
      </div>

      <div sidebar-extra>
        <h4
          class="text-white text-xs font-black uppercase tracking-widest mb-4"
        >
          Security Verification
        </h4>
        <div class="space-y-4">
          <div
            class="flex items-center justify-between text-[10px] text-white/70 font-bold"
          >
            <span>Risk Score</span>
            <span class="text-emerald-400">Low (0.01)</span>
          </div>
          <div
            class="flex items-center justify-between text-[10px] text-white/70 font-bold"
          >
            <span>CVC Check</span>
            <span class="text-emerald-400">Passed</span>
          </div>
          <div
            class="flex items-center justify-between text-[10px] text-white/70 font-bold"
          >
            <span>IP Country</span>
            <span class="text-white">US (California)</span>
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
                Payment Configuration
              </h4>
              <div class="space-y-4">
                <div
                  class="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl"
                >
                  <span class="text-[10px] font-black uppercase text-slate-400"
                    >Currency</span
                  >
                  <span class="text-sm font-bold text-slate-900 dark:text-white"
                    >USD - US Dollar</span
                  >
                </div>
                <div
                  class="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl"
                >
                  <span class="text-[10px] font-black uppercase text-slate-400"
                    >Processing Fee</span
                  >
                  <span class="text-sm font-bold text-rose-500">{{
                    (payment()?.amount || 0) * 0.029 + 0.3 | currency
                  }}</span>
                </div>
                <div
                  class="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl"
                >
                  <span class="text-[10px] font-black uppercase text-slate-400"
                    >Net Deposit</span
                  >
                  <span class="text-sm font-bold text-emerald-500">{{
                    (payment()?.amount || 0) * 0.971 - 0.3 | currency
                  }}</span>
                </div>
              </div>
            </div>

            <div class="card-premium p-6">
              <h4
                class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6"
              >
                Gateway Response
              </h4>
              <div class="p-4 bg-slate-900 rounded-2xl overflow-hidden">
                <pre
                  class="text-[10px] text-emerald-400 font-mono leading-relaxed"
                  >{{ "{" }}
  "status": "succeeded",
  "object": "payment_intent",
  "id": "{{ payment()?.transactionId }}",
  "amount_received": {{ payment()?.amount }},
  "captured": true,
  "livemode": true
{{ "}" }}</pre
                >
              </div>
            </div>
          </div>
        } @else if (activeTab() === 1) {
          @if (relatedOrder(); as order) {
            <div
              [routerLink]="['/inventory/orders', order.id]"
              class="card-premium p-6 flex items-center justify-between group hover:border-primary transition-all cursor-pointer"
            >
              <div class="flex items-center gap-6">
                <div
                  class="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                >
                  <svg
                    class="w-8 h-8"
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
                  <h3
                    class="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors"
                  >
                    Order #{{ order.id }}
                  </h3>
                  <p
                    class="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1"
                  >
                    {{ order.date | date: "mediumDate" }} • {{ order.customer }}
                  </p>
                  <div class="mt-3 flex gap-2">
                    <lib-status-badge
                      [status]="order.status"
                      class="scale-75 origin-left"
                    ></lib-status-badge>
                  </div>
                </div>
              </div>
              <svg
                class="w-6 h-6 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          } @else {
            <div
              class="py-20 text-center bg-white/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10"
            >
              <p class="text-slate-400 italic">
                This transaction is not linked to any specific order.
              </p>
            </div>
          }
        } @else if (activeTab() === 2) {
          <div class="card-premium overflow-hidden">
            <table class="w-full text-left">
              <thead
                class="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06]"
              >
                <tr>
                  <th
                    class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Timestamp
                  </th>
                  <th
                    class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Action
                  </th>
                  <th
                    class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Origin
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 dark:divide-white/[0.04]">
                <tr class="text-sm font-medium">
                  <td class="px-6 py-4 text-slate-500">
                    {{ payment()?.date }} 14:22:10
                  </td>
                  <td class="px-6 py-4 text-slate-900 dark:text-white">
                    Payment Finalized
                  </td>
                  <td class="px-6 py-4 text-slate-400 italic">System Auto</td>
                </tr>
                <tr class="text-sm font-medium">
                  <td class="px-6 py-4 text-slate-500">
                    {{ payment()?.date }} 14:22:08
                  </td>
                  <td class="px-6 py-4 text-slate-900 dark:text-white">
                    CVC Check Passed
                  </td>
                  <td class="px-6 py-4 text-slate-400 italic">
                    Stripe Gateway
                  </td>
                </tr>
                <tr class="text-sm font-medium">
                  <td class="px-6 py-4 text-slate-500">
                    {{ payment()?.date }} 14:22:05
                  </td>
                  <td class="px-6 py-4 text-slate-900 dark:text-white">
                    Transaction Initialized
                  </td>
                  <td class="px-6 py-4 text-slate-400 italic">Checkout API</td>
                </tr>
              </tbody>
            </table>
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
export class PaymentDetailComponent implements OnInit {
  public service = inject(PaymentsService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  activeTab = signal(0);

  paymentId = computed(() => this.route.snapshot.paramMap.get('id') || '');
  payment = computed(() => this.service.getPayment(this.paymentId()));

  breadcrumbs = computed<Breadcrumb[]>(() => [
    { label: 'Inventory', link: '/inventory' },
    { label: 'Payments', link: '/inventory/payments' },
    { label: this.payment()?.id || 'Detail' },
  ]);

  relatedOrder = computed(() => {
    const p = this.payment();
    if (!p?.orderId) return null;
    return this.service.getOrderById(p.orderId);
  });

  ngOnInit(): void {
    this.service.isLoading.set(true);
    const sub = this.service.getPaymentData(this.paymentId()).subscribe({
      next: (data) => {
        this.service.setPayment(data);
        this.service.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading payment details:', err);
        this.service.isLoading.set(false);
      },
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  handlePrint(): void {
    this.service.isActionLoading.set(true);
    setTimeout(() => {
      this.service.isActionLoading.set(false);
      window.print();
    }, 1500);
  }
}
