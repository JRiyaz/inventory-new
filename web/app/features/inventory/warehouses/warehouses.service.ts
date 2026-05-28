import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { finalize, firstValueFrom, from, Observable, of, tap } from 'rxjs';
import { InventoryDataService, type Product, type Warehouse } from 'ui-shared';

@Injectable({
  providedIn: 'root',
})
export class WarehousesService {
  private dataService = inject(InventoryDataService);
  private http = inject(HttpClient);

  // State
  isLoading = signal(false);
  isActionLoading = signal(false);
  searchQuery = signal('');
  statusFilter = signal('All Statuses');

  // Derived Data
  warehouses = this.dataService.warehouses;

  allFilteredWarehouses = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    return this.warehouses().filter((w) => {
      const matchesSearch = w.name.toLowerCase().includes(query) || w.location.toLowerCase().includes(query);
      const matchesStatus = status === 'All Statuses' || w.status === status;
      return matchesSearch && matchesStatus;
    });
  });

  headerStats = computed(() => [
    {
      label: 'Total Sites',
      value: this.warehouses().length,
      color: 'primary' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>',
    },
    {
      label: 'Utilization',
      value: '78%',
      color: 'warning' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>',
    },
    {
      label: 'Active Zones',
      value: this.warehouses().reduce((acc, w) => acc + (w.zones?.length || 0), 0),
      color: 'success' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg>',
    },
  ]);

  // Actions
  getWarehousesData(): Observable<Warehouse[]> {
    return this.http.get<Warehouse[]>(`${this.dataService.baseUrl}/warehouses`);
  }

  getWarehouseData(id: string): Observable<Warehouse> {
    return this.http.get<Warehouse>(`${this.dataService.baseUrl}/warehouses/${id}`);
  }

  setWarehouses(data: Warehouse[]): void {
    this.dataService.setWarehouses(data);
  }

  setWarehouse(data: Warehouse): void {
    this.dataService.updateWarehouseInState(data);
  }

  getWarehouse(id: string) {
    return this.warehouses().find((w) => w.id === id);
  }

  getProductsByWarehouseId(warehouseId: string) {
    return this.dataService.products().filter((p) => (p as any).warehouseId === warehouseId);
  }

  getAvailableProducts() {
    return this.dataService.products().filter((p) => !(p as any).warehouseId);
  }

  addProductToWarehouse(productId: number, warehouseId: string): Observable<any> {
    this.isActionLoading.set(true);
    const product = this.dataService.products().find((p) => p.id === productId);
    if (product) {
      const updatedProduct = { ...product, warehouseId };
      const promise = firstValueFrom(
        this.http.put<Product>(`${this.dataService.baseUrl}/products/${productId}`, updatedProduct),
      ).then((data) => {
        this.dataService.updateProductInState(data);
      });
      return from(promise).pipe(tap(() => this.isActionLoading.set(false)));
    }
    return of(false);
  }

  getMovementsByWarehouseId(warehouseId: string) {
    return this.dataService
      .movements()
      .filter((m) => m.fromLocation.startsWith(warehouseId) || m.toLocation.startsWith(warehouseId));
  }

  addWarehouse(warehouse: Warehouse) {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(this.http.post<Warehouse>(`${this.dataService.baseUrl}/warehouses`, warehouse)).then(
      (data) => {
        this.dataService.addWarehouseToState(data);
      },
    );
    return from(promise).pipe(finalize(() => this.isActionLoading.set(false)));
  }

  updateWarehouse(warehouse: Warehouse) {
    this.isActionLoading.set(true);
    const promise = firstValueFrom(
      this.http.put<Warehouse>(`${this.dataService.baseUrl}/warehouses/${warehouse.id}`, warehouse),
    ).then((data) => {
      this.dataService.updateWarehouseInState(data);
    });
    return from(promise).pipe(finalize(() => this.isActionLoading.set(false)));
  }
}
