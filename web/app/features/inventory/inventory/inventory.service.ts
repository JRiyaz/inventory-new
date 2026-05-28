import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { delay, firstValueFrom, forkJoin, of, tap } from 'rxjs';
import {
  type Customer,
  InventoryDataService,
  type Offer,
  type Order,
  type Payment,
  type Product,
  type Supplier,
  type Warehouse,
} from 'ui-shared';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private dataService = inject(InventoryDataService);
  private http = inject(HttpClient);

  // State
  isLoading = signal(false);
  isActionLoading = signal(false);

  // Data Sources
  products = this.dataService.products;
  orders = this.dataService.orders;
  customers = this.dataService.customers;
  suppliers = this.dataService.suppliers;
  warehouses = this.dataService.warehouses;
  payments = this.dataService.payments;
  offers = this.dataService.offers;

  // Derived Metrics
  headerStats = computed(() => [
    {
      label: 'Total Inventory Value',
      value: `${(this.products().reduce((acc, p) => acc + p.price * p.stock, 0) / 1000000).toFixed(2)}M`,
      color: 'success' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    },
    {
      label: 'Global Node Count',
      value: `${this.warehouses().length} Sites`,
      color: 'info' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    },
    {
      label: 'Avg. Stock Turn',
      value: '4.2x',
      color: 'primary' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>',
    },
  ]);

  getOverviewData() {
    const baseUrl = this.dataService.baseUrl;
    return forkJoin([
      this.http.get<Product[]>(`${baseUrl}/products`),
      this.http.get<Order[]>(`${baseUrl}/orders`),
      this.http.get<Customer[]>(`${baseUrl}/customers`),
      this.http.get<Supplier[]>(`${baseUrl}/suppliers`),
      this.http.get<Warehouse[]>(`${baseUrl}/warehouses`),
      this.http.get<Payment[]>(`${baseUrl}/payments`),
      this.http.get<Offer[]>(`${baseUrl}/offers`),
    ]);
  }

  setOverviewData(
    products: Product[],
    orders: Order[],
    customers: Customer[],
    suppliers: Supplier[],
    warehouses: Warehouse[],
    payments: Payment[],
    offers: Offer[],
  ) {
    this.dataService.setProducts(products);
    this.dataService.setOrders(orders);
    this.dataService.setCustomers(customers);
    this.dataService.setSuppliers(suppliers);
    this.dataService.setWarehouses(warehouses);
    this.dataService.setPayments(payments);
    this.dataService.setOffers(offers);
  }

  // Actions
  async loadOverview() {
    this.isLoading.set(true);
    try {
      const baseUrl = this.dataService.baseUrl;
      const [products, orders, customers, suppliers, warehouses, payments, offers] = await Promise.all([
        firstValueFrom(this.http.get<Product[]>(`${baseUrl}/products`)),
        firstValueFrom(this.http.get<Order[]>(`${baseUrl}/orders`)),
        firstValueFrom(this.http.get<Customer[]>(`${baseUrl}/customers`)),
        firstValueFrom(this.http.get<Supplier[]>(`${baseUrl}/suppliers`)),
        firstValueFrom(this.http.get<Warehouse[]>(`${baseUrl}/warehouses`)),
        firstValueFrom(this.http.get<Payment[]>(`${baseUrl}/payments`)),
        firstValueFrom(this.http.get<Offer[]>(`${baseUrl}/offers`)),
      ]);

      this.dataService.setProducts(products);
      this.dataService.setOrders(orders);
      this.dataService.setCustomers(customers);
      this.dataService.setSuppliers(suppliers);
      this.dataService.setWarehouses(warehouses);
      this.dataService.setPayments(payments);
      this.dataService.setOffers(offers);
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  optimizeLogistics() {
    this.isActionLoading.set(true);
    return of(null).pipe(
      delay(2000),
      tap(() => this.isActionLoading.set(false)),
    );
  }
}
