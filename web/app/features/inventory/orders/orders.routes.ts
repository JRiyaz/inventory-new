import type { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./orders.component').then((m) => m.OrdersComponent),
    pathMatch: 'full',
    data: { title: 'Order Tracking' },
  },
  {
    path: 'create',
    loadComponent: () => import('./order-create/order-create.component').then((m) => m.OrderCreateComponent),
    data: { title: 'Create New Order' },
  },
  {
    path: ':id',
    loadComponent: () => import('./order-detail/order-detail.component').then((m) => m.OrderDetailComponent),
    data: { title: 'Order Details' },
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./order-create/order-create.component').then((m) => m.OrderCreateComponent),
    data: { title: 'Edit Order' },
  },
];
