import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { finalize, firstValueFrom, from, Observable, tap } from 'rxjs';
import { type Customer, InventoryDataService } from 'ui-shared';

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  private dataService = inject(InventoryDataService);
  private http = inject(HttpClient);

  // State
  isLoading = signal(false);
  isActionLoading = signal(false);
  searchQuery = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);

  // Derived Data
  customers = this.dataService.customers;

  allFilteredCustomers = computed(() => {
    return Array(this.totalCount());
  });

  paginatedCustomers = computed(() => {
    return this.customers();
  });

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  headerStats = computed(() => [
    {
      label: 'Total Customers',
      value: this.totalCount().toLocaleString(),
      color: 'primary' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>',
    },
    {
      label: 'Active Accounts',
      value: this.customers()
        .filter((c) => c.status === 'Active')
        .length.toLocaleString(),
      color: 'success' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    },
    {
      label: 'High Value',
      value: this.customers()
        .filter((c) => c.segment === 'VIP')
        .length.toLocaleString(),
      color: 'warning' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>',
    },
  ]);

  // Actions
  getCustomersData(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.dataService.baseUrl}/customers`);
  }

  loadCustomers(): Observable<any> {
    this.isLoading.set(true);
    let params = `_page=${this.currentPage()}&_limit=${this.pageSize()}`;

    const query = this.searchQuery().trim();
    if (query) {
      params += `&q=${encodeURIComponent(query)}`;
    }

    return this.http.get<Customer[]>(`${this.dataService.baseUrl}/customers?${params}`, { observe: 'response' }).pipe(
      tap((res) => {
        const total = Number(res.headers.get('X-Total-Count') || '0');
        this.totalCount.set(total);
        this.dataService.setCustomers(res.body || []);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  getCustomerData(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.dataService.baseUrl}/customers/${id}`);
  }

  setCustomers(data: Customer[]): void {
    this.dataService.setCustomers(data);
  }

  setCustomer(data: Customer): void {
    this.dataService.updateCustomerInState(data);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getCustomer(id: string) {
    return this.customers().find((c) => c.id === id);
  }

  getOrdersForCustomer(customerName: string) {
    return this.dataService.getOrdersForCustomer(customerName);
  }

  addCustomer(customer: Customer) {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(this.http.post<Customer>(`${this.dataService.baseUrl}/customers`, customer)).then(
      (data) => {
        this.dataService.addCustomerToState(data);
      },
    );
    return from(promise).pipe(finalize(() => this.isActionLoading.set(false)));
  }

  updateCustomer(customer: Customer) {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(
      this.http.put<Customer>(`${this.dataService.baseUrl}/customers/${customer.id}`, customer),
    ).then((data) => {
      this.dataService.updateCustomerInState(data);
    });
    return from(promise).pipe(finalize(() => this.isActionLoading.set(false)));
  }
}
