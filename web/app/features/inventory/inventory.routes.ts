import type { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadChildren: () => import('./inventory/inventory.routes').then((m) => m.INVENTORY_ROOT_ROUTES),
      },
      {
        path: 'products',
        loadChildren: () => import('./products/products.routes').then((m) => m.PRODUCTS_ROUTES),
      },
      {
        path: 'orders',
        loadChildren: () => import('./orders/orders.routes').then((m) => m.ORDERS_ROUTES),
      },
      {
        path: 'customers',
        loadChildren: () => import('./customers/customers.routes').then((m) => m.CUSTOMERS_ROUTES),
      },
      {
        path: 'suppliers',
        loadChildren: () => import('./suppliers/suppliers.routes').then((m) => m.SUPPLIERS_ROUTES),
      },
      {
        path: 'warehouses',
        loadChildren: () => import('./warehouses/warehouses.routes').then((m) => m.WAREHOUSES_ROUTES),
      },
      {
        path: 'payments',
        loadChildren: () => import('./payments/payments.routes').then((m) => m.PAYMENTS_ROUTES),
      },
      {
        path: 'offers',
        loadComponent: () => import('./offers/offers.component').then((m) => m.OffersComponent),
      },
      {
        path: 'analytics',
        loadChildren: () => import('./analytics/analytics.routes').then((m) => m.ANALYTICS_ROUTES),
      },
      {
        path: 'support',
        loadComponent: () => import('./support/support.component').then((m) => m.SupportComponent),
      },
      {
        path: 'procurement',
        loadChildren: () => import('./procurement/procurement.routes').then((m) => m.PROCUREMENT_ROUTES),
      },
    ],
  },
];
