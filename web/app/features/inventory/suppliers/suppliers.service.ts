import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { finalize, firstValueFrom, from, Observable, tap } from 'rxjs';
import { InventoryDataService, type Supplier } from 'ui-shared';

@Injectable({
  providedIn: 'root',
})
export class SuppliersService {
  private dataService = inject(InventoryDataService);
  private http = inject(HttpClient);

  // State
  isLoading = signal(false);
  isActionLoading = signal(false);
  searchQuery = signal('');
  statusFilter = signal('All Statuses');
  currentPage = signal(1);
  pageSize = signal(8);
  totalCount = signal(0);

  // Derived Data
  suppliers = this.dataService.suppliers;

  allFilteredSuppliers = computed(() => {
    return Array(this.totalCount());
  });

  paginatedSuppliers = computed(() => {
    return this.suppliers();
  });

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  headerStats = computed(() => [
    {
      label: 'Total Vendors',
      value: this.totalCount(),
      color: 'primary' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>',
    },
    {
      label: 'Critical Supply',
      value: this.suppliers().filter((s) => s.status === 'Critical').length,
      color: 'danger' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
    },
    {
      label: 'Reliability',
      value: '98.4%',
      color: 'success' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    },
  ]);

  // Actions
  getSuppliersData(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.dataService.baseUrl}/suppliers`);
  }

  loadSuppliers(): Observable<any> {
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

    return this.http.get<Supplier[]>(`${this.dataService.baseUrl}/suppliers?${params}`, { observe: 'response' }).pipe(
      tap((res) => {
        const total = Number(res.headers.get('X-Total-Count') || '0');
        this.totalCount.set(total);
        this.dataService.setSuppliers(res.body || []);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  getSupplierData(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.dataService.baseUrl}/suppliers/${id}`);
  }

  setSuppliers(data: Supplier[]): void {
    this.dataService.setSuppliers(data);
  }

  setSupplier(data: Supplier): void {
    this.dataService.updateSupplierInState(data);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getSupplier(id: string) {
    return this.suppliers().find((s) => s.id === id);
  }

  getProductsBySupplierId(supplierId: string) {
    return this.dataService.products().filter((p) => p.supplierId === supplierId);
  }

  addSupplier(supplier: Supplier) {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(this.http.post<Supplier>(`${this.dataService.baseUrl}/suppliers`, supplier)).then(
      (data) => {
        this.dataService.addSupplierToState(data);
      },
    );
    return from(promise).pipe(finalize(() => this.isActionLoading.set(false)));
  }

  updateSupplier(supplier: Supplier) {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(
      this.http.put<Supplier>(`${this.dataService.baseUrl}/suppliers/${supplier.id}`, supplier),
    ).then((data) => {
      this.dataService.updateSupplierInState(data);
    });
    return from(promise).pipe(finalize(() => this.isActionLoading.set(false)));
  }
}
