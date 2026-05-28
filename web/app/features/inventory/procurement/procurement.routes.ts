import type { Routes } from '@angular/router';

export const PROCUREMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./procurement.component').then((m) => m.ProcurementComponent),
    data: { title: 'Stock Procurement' },
  },
  {
    path: ':id',
    loadComponent: () => import('./procurement-detail.component').then((m) => m.ProcurementDetailComponent),
    data: { title: 'Purchase Order Details' },
  },
  {
    path: 'stock-order/create',
    loadComponent: () => import('./stock-order-create.component').then((m) => m.StockOrderCreateComponent),
    data: { title: 'Create Stock Order' },
  },
  {
    path: 'stock-order/edit/:id',
    loadComponent: () => import('./stock-order-create.component').then((m) => m.StockOrderCreateComponent),
    data: { title: 'Edit Stock Order' },
  },
];
