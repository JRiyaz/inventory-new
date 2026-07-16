import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { finalize, firstValueFrom, from, Observable, tap } from 'rxjs';
import { InventoryDataService, type Payment } from 'ui-shared';

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private dataService = inject(InventoryDataService);
  private http = inject(HttpClient);

  // State
  isLoading = signal(false);
  isActionLoading = signal(false);
  searchQuery = signal('');
  statusFilter = signal('All Status');
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  sortField = signal<string>('id');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Derived Data
  payments = this.dataService.payments;

  allFilteredPayments = computed(() => {
    return Array(this.totalCount());
  });

  paginatedPayments = computed(() => {
    return this.payments();
  });

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  headerStats = computed(() => [
    {
      label: 'Total Volume',
      value:
        '$' +
        this.payments()
          .reduce((acc, p) => acc + p.amount, 0)
          .toLocaleString(),
      color: 'primary' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    },
    {
      label: 'Pending Clear',
      value: this.payments().filter((p) => p.status === 'Pending').length,
      color: 'warning' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    },
    {
      label: 'Avg. Transaction',
      value:
        '$' +
        (this.payments().length
          ? Math.round(this.payments().reduce((acc, p) => acc + p.amount, 0) / this.payments().length)
          : 0
        ).toLocaleString(),
      color: 'success' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>',
    },
  ]);

  // Actions
  getPaymentsData(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.dataService.baseUrl}/payments`);
  }

  loadPayments(): Observable<any> {
    this.isLoading.set(true);
    let params = `_page=${this.currentPage()}&_limit=${this.pageSize()}`;

    const query = this.searchQuery().trim();
    if (query) {
      params += `&q=${encodeURIComponent(query)}`;
    }

    const status = this.statusFilter();
    if (status && status !== 'All Status') {
      params += `&status=${encodeURIComponent(status)}`;
    }

    const field = this.sortField();
    const order = this.sortOrder();
    if (field) {
      params += `&_sort=${field}&_order=${order}`;
    }

    return this.http.get<Payment[]>(`${this.dataService.baseUrl}/payments?${params}`, { observe: 'response' }).pipe(
      tap((res) => {
        const total = Number(res.headers.get('X-Total-Count') || '0');
        this.totalCount.set(total);
        this.dataService.setPayments(res.body || []);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  toggleSort(field: string) {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('asc');
    }
    this.currentPage.set(1);
  }

  getPaymentData(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.dataService.baseUrl}/payments/${id}`);
  }

  setPayments(data: Payment[]): void {
    this.dataService.setPayments(data);
  }

  setPayment(data: Payment): void {
    this.dataService.updatePaymentInState(data);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPayment(id: string) {
    return this.payments().find((p) => p.id === id);
  }

  getOrderById(id: string) {
    return this.dataService.orders().find((o) => o.id === id);
  }

  processPayment(payment: Payment) {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(this.http.post<Payment>(`${this.dataService.baseUrl}/payments`, payment)).then(
      (data) => {
        this.dataService.addPaymentToState(data);
      },
    );
    return from(promise).pipe(finalize(() => this.isActionLoading.set(false)));
  }
}
