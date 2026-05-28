import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { finalize, firstValueFrom, from, Observable, tap } from 'rxjs';
import { InventoryDataService, type Order } from 'ui-shared';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private dataService = inject(InventoryDataService);
  private http = inject(HttpClient);

  // State
  isLoading = signal(false);
  isActionLoading = signal(false);
  searchQuery = signal('');
  statusFilter = signal('All Statuses');
  sortField = signal<string>('id');
  sortOrder = signal<'asc' | 'desc'>('desc');
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);

  // Derived Data
  orders = this.dataService.orders;

  customerOptions = computed(() =>
    this.dataService.customers().map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
    })),
  );

  productOptions = this.dataService.products;

  allFilteredOrders = computed(() => {
    return Array(this.totalCount());
  });

  paginatedOrders = computed(() => {
    return this.orders();
  });

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  headerStats = computed(() => [
    {
      label: 'Total Orders',
      value: this.orders().length,
      color: 'primary' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>',
    },
    {
      label: 'Pending Processing',
      value: this.orders().filter((o) => o.status === 'Pending').length,
      color: 'warning' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    },
    {
      label: 'Total Volume',
      value:
        '$' +
        this.orders()
          .reduce((acc, o) => acc + (o.totalAmount || 0), 0)
          .toLocaleString(),
      color: 'success' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    },
  ]);

  // Actions
  getOrdersData(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.dataService.baseUrl}/orders`);
  }

  loadOrders(): Observable<any> {
    this.isLoading.set(true);
    let params = `_page=${this.currentPage()}&_limit=${this.pageSize()}`;

    const query = this.searchQuery().trim();
    if (query) {
      params += `&q=${encodeURIComponent(query)}`;
    }

    const status = this.statusFilter();
    if (status && status !== 'All Statuses') {
      params += `&status=${encodeURIComponent(status)}`;
    }

    const field = this.sortField();
    const order = this.sortOrder();
    if (field) {
      params += `&_sort=${field}&_order=${order}`;
    }

    return this.http.get<Order[]>(`${this.dataService.baseUrl}/orders?${params}`, { observe: 'response' }).pipe(
      tap((res) => {
        const total = Number(res.headers.get('X-Total-Count') || '0');
        this.totalCount.set(total);
        this.dataService.setOrders(res.body || []);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  getOrderData(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.dataService.baseUrl}/orders/${id}`);
  }

  setOrders(data: Order[]): void {
    this.dataService.setOrders(data);
  }

  setOrder(data: Order): void {
    this.dataService.updateOrderInState(data);
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

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getOrder(id: string) {
    return this.orders().find((o) => o.id === id);
  }

  getCustomerByName(name: string) {
    return this.dataService.customers().find((c) => c.name === name);
  }

  getPaymentsByOrderId(orderId: string) {
    return this.dataService.getPaymentsByOrderId(orderId);
  }

  addOrder(order: Order) {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(this.http.post<Order>(`${this.dataService.baseUrl}/orders`, order)).then((data) => {
      this.dataService.addOrderToState(data);
    });
    return from(promise).pipe(finalize(() => this.isActionLoading.set(false)));
  }

  updateOrder(order: Order) {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(this.http.put<Order>(`${this.dataService.baseUrl}/orders/${order.id}`, order)).then(
      (data) => {
        this.dataService.updateOrderInState(data);
      },
    );
    return from(promise).pipe(finalize(() => this.isActionLoading.set(false)));
  }
}
