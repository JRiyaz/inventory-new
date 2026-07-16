import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { type Customer, InventoryDataService, type Order, type Product, type Supplier } from 'ui-shared';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private dataService = inject(InventoryDataService);
  private http = inject(HttpClient);

  // State
  isLoading = signal(false);
  activeDuration = signal<'Week' | 'Month' | 'Year'>('Month');
  activeGraphType = signal<'line' | 'bar'>('line');
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  // Data Sources
  products = this.dataService.products;
  orders = this.dataService.orders;
  suppliers = this.dataService.suppliers;
  customers = this.dataService.customers;

  // Derived Metrics
  totalValue = computed(() => this.products().reduce((acc, p) => acc + p.price * p.stock, 0));

  summaryStats = computed(() => [
    {
      label: 'Gross Revenue',
      value: this.orders()
        .reduce((acc, o) => acc + (o.totalAmount || 0), 0)
        .toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }),
      color: 'primary' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    },
    {
      label: 'Stock Valuation',
      value: this.totalValue().toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
      color: 'success' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>',
    },
    {
      label: 'Order Fulfillment',
      value: '94.2%',
      color: 'warning' as const,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    },
  ]);

  sections = computed(() => [
    {
      id: 1,
      title: 'Products',
      value: this.products().length,
      change: '8.4%',
      color: '#3b82f6',
      description: 'Inventory SKU growth and category diversification analysis.',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>',
      miniChart: [40, 70, 45, 90, 65],
    },
    {
      id: 2,
      title: 'Orders',
      value: this.orders().length,
      change: '12.1%',
      color: '#8b5cf6',
      description: 'Sales velocity and average order value trends.',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>',
      miniChart: [30, 50, 80, 40, 95],
    },
    {
      id: 3,
      title: 'Suppliers',
      value: this.suppliers().length,
      change: '2.5%',
      color: '#10b981',
      description: 'Supply chain reliability and procurement efficiency.',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>',
      miniChart: [60, 40, 70, 85, 50],
    },
    {
      id: 4,
      title: 'Customers',
      value: this.customers().length,
      change: '15.8%',
      color: '#f59e0b',
      description: 'Retention rates and lifetime value segmentation.',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>',
      miniChart: [20, 40, 30, 60, 80],
    },
  ]);

  donutSegments = computed(() => {
    const categories = ['Industrial', 'Electronics', 'Raw Materials'];
    const colors = ['#3b82f6', '#8b5cf6', '#10b981'];
    const total = this.totalValue();

    let currentOffset = 0;
    const circumference = 2 * Math.PI * 70;

    return categories.map((cat, i) => {
      const value = this.products()
        .filter((p) => p.category === cat)
        .reduce((acc, p) => acc + p.price * p.stock, 0);

      const percentage = Math.round((value / total) * 100) || 0;
      const dashArray = `${(percentage / 100) * circumference} ${circumference}`;
      const dashOffset = -currentOffset;

      currentOffset += (percentage / 100) * circumference;

      return {
        label: cat,
        percentage,
        color: colors[i],
        dashArray,
        dashOffset,
      };
    });
  });

  lineChartPoints = computed(() => {
    const orders = this.orders();
    const duration = this.activeDuration();

    // Group orders by date and sort
    const dailyRevenue: { [key: string]: number } = {};
    orders.forEach((o) => {
      dailyRevenue[o.date] = (dailyRevenue[o.date] || 0) + (o.totalAmount || 0);
    });

    let sortedDates = Object.keys(dailyRevenue).sort();

    // Filter by duration (Simulation)
    if (duration === 'Week') {
      sortedDates = sortedDates.slice(-7);
    } else if (duration === 'Month') {
      sortedDates = sortedDates.slice(-30);
    }

    const points = sortedDates.map((date) => dailyRevenue[date]);

    if (points.length === 0)
      return [
        { x: 0, y: 150 },
        { x: 1000, y: 150 },
      ];

    const max = Math.max(...points, 1);
    const stepX = 1000 / Math.max(points.length - 1, 1);

    return points.map((val, i) => ({
      x: i * stepX,
      y: 300 - (val / max) * 250,
    }));
  });

  lineChartPath = computed(() => {
    const points = this.lineChartPoints();
    return `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
  });

  // Actions
  getAnalyticsData(): Observable<[Product[], Order[], Customer[], Supplier[]]> {
    const baseUrl = this.dataService.baseUrl;
    return forkJoin([
      this.http.get<Product[]>(`${baseUrl}/products`),
      this.http.get<Order[]>(`${baseUrl}/orders`),
      this.http.get<Customer[]>(`${baseUrl}/customers`),
      this.http.get<Supplier[]>(`${baseUrl}/suppliers`),
    ]);
  }

  setAnalyticsData(products: Product[], orders: Order[], customers: Customer[], suppliers: Supplier[]): void {
    this.dataService.setProducts(products);
    this.dataService.setOrders(orders);
    this.dataService.setCustomers(customers);
    this.dataService.setSuppliers(suppliers);
  }
}
