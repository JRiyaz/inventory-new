import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, from, Observable, tap } from 'rxjs';
import { InventoryDataService, type PurchaseOrder } from 'ui-shared';

@Injectable({
  providedIn: 'root',
})
export class ProcurementService {
  private dataService = inject(InventoryDataService);
  private http = inject(HttpClient);

  // State
  isLoading = signal(false);
  isActionLoading = signal(false);
  searchQuery = signal('');
  statusFilter = signal('All Statuses');
  currentPage = signal(1);
  pageSize = signal(10);
  sortField = signal<string>('date');
  sortOrder = signal<'asc' | 'desc'>('desc');
  totalCount = signal(0);

  // Purchase Orders State
  purchaseOrders = signal<PurchaseOrder[]>([]);

  // Derived Data
  allFilteredOrders = computed(() => {
    return Array(this.totalCount());
  });

  paginatedOrders = computed(() => {
    return [...this.dataService.purchaseOrders(), ...this.purchaseOrders()];
  });

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  headerStats = computed(() => [
    {
      label: 'Total Orders',
      value: this.allFilteredOrders().length,
      color: 'primary' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>',
    },
    {
      label: 'Total Amount',
      value:
        '$' +
        this.allFilteredOrders()
          .reduce((sum, o) => sum + o.amount, 0)
          .toLocaleString(),
      color: 'success' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    },
    {
      label: 'Pending',
      value: this.allFilteredOrders().filter((o) => o.status === 'Ordered').length,
      color: 'warning' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    },
  ]);

  // Helpers
  getPurchaseOrdersData(): Observable<PurchaseOrder[]> {
    return this.http.get<PurchaseOrder[]>(`${this.dataService.baseUrl}/purchaseOrders`);
  }

  loadPurchaseOrders(): Observable<any> {
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

    return this.http
      .get<PurchaseOrder[]>(`${this.dataService.baseUrl}/purchaseOrders?${params}`, { observe: 'response' })
      .pipe(
        tap((res) => {
          const total = Number(res.headers.get('X-Total-Count') || '0');
          this.totalCount.set(total);
          this.dataService.setPurchaseOrders(res.body || []);
          this.purchaseOrders.set(res.body || []);
        }),
        tap(() => this.isLoading.set(false)),
      );
  }

  setPurchaseOrders(data: PurchaseOrder[]): void {
    this.dataService.setPurchaseOrders(data);
  }

  setPage(page: number) {
    this.currentPage.set(page);
  }

  toggleSort(field: string) {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('asc');
    }
  }
  getProducts() {
    return this.dataService.products();
  }

  getSuppliers() {
    return this.dataService.suppliers();
  }

  getProductById(id: number) {
    return this.dataService.products().find((p) => p.id === id);
  }

  getSupplierById(id: string) {
    return this.dataService.suppliers().find((s) => s.id === id);
  }

  addPurchaseOrder(order: PurchaseOrder) {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(
      this.http.post<PurchaseOrder>(`${this.dataService.baseUrl}/purchaseOrders`, order),
    ).then((data) => {
      this.dataService.setPurchaseOrders([...this.dataService.purchaseOrders(), data]);
    });
    return from(promise).pipe(tap(() => this.isActionLoading.set(false)));
  }

  updatePurchaseOrder(order: PurchaseOrder): Observable<any> {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(
      this.http.put<PurchaseOrder>(`${this.dataService.baseUrl}/purchaseOrders/${order.id}`, order),
    ).then((data) => {
      const updatedList = this.dataService.purchaseOrders().map((o) => (o.id === data.id ? data : o));
      this.dataService.setPurchaseOrders(updatedList);
      const updatedSubList = this.purchaseOrders().map((o) => (o.id === data.id ? data : o));
      this.purchaseOrders.set(updatedSubList);
    });
    return from(promise).pipe(tap(() => this.isActionLoading.set(false)));
  }

  getPurchaseOrder(id: string) {
    const all = [...this.dataService.purchaseOrders(), ...this.purchaseOrders()];
    return all.find((o) => o.id === id);
  }
}
