import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { finalize, map, Observable, tap } from 'rxjs';
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

  // Unified sales order mapping helper to convert backend snake_case SalesOrder schemas to frontend Order camelCase
  public mapSalesOrderToOrder(so: any): Order {
    const customers = this.dataService.customers();
    const customer = customers.find((c) => c.id === so.customer_id.toString() || Number(c.id) === so.customer_id);
    const customerName = customer ? customer.name : `Customer #${so.customer_id}`;

    return {
      id: so.id ? so.id.toString() : so.order_number || '',
      customer: customerName,
      customerName: customerName,
      status: so.status || 'Pending',
      amount: so.total_amount || 0,
      totalAmount: so.total_amount || 0,
      date: so.created_at ? so.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      priority: so.priority || false,
      items: (so.items || []).map((item: any) => ({
        productId: item.product_id,
        name: item.name,
        qty: item.quantity,
        price: item.unit_price,
      })),
      createdBy: so.created_by || 'Admin',
    };
  }

  // Actions
  getOrdersData(): Observable<Order[]> {
    return this.http
      .get<any[]>(`${this.dataService.baseUrl}/orders`)
      .pipe(map((body) => body.map((so) => this.mapSalesOrderToOrder(so))));
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

    return this.http.get<any[]>(`${this.dataService.baseUrl}/orders?${params}`, { observe: 'response' }).pipe(
      tap((res) => {
        const total = Number(res.headers.get('X-Total-Count') || '0');
        this.totalCount.set(total);
        const mapped = (res.body || []).map((so) => this.mapSalesOrderToOrder(so));
        this.dataService.setOrders(mapped);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  getOrderData(id: string): Observable<Order> {
    return this.http
      .get<any>(`${this.dataService.baseUrl}/orders/${id}`)
      .pipe(map((so) => this.mapSalesOrderToOrder(so)));
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

  addOrder(order: Order): Observable<Order> {
    this.isActionLoading.set(true);

    const customers = this.dataService.customers();
    const customer = customers.find((c) => c.name === order.customer);
    const customerId = customer ? Number(customer.id) : 1;

    const payload = {
      customer_id: customerId,
      items: order.items.map((item) => {
        const prod = this.dataService.products().find((p) => p.id === item.productId);
        return {
          product_id: item.productId,
          sku: prod?.sku || `SKU-${item.productId}`,
          name: item.name,
          quantity: item.qty,
          unit_price: item.price,
        };
      }),
    };

    return this.http.post<any>(`${this.dataService.baseUrl}/orders`, payload, { withCredentials: true }).pipe(
      map((data) => {
        const mapped = this.mapSalesOrderToOrder(data);
        this.dataService.addOrderToState(mapped);
        return mapped;
      }),
      finalize(() => this.isActionLoading.set(false)),
    );
  }

  updateOrder(order: Order): Observable<Order> {
    this.isActionLoading.set(true);
    return this.http.put<any>(`${this.dataService.baseUrl}/orders/${order.id}`, order, { withCredentials: true }).pipe(
      map((data) => {
        const mapped = this.mapSalesOrderToOrder(data);
        this.dataService.updateOrderInState(mapped);
        return mapped;
      }),
      finalize(() => this.isActionLoading.set(false)),
    );
  }
}
